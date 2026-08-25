import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  ITEMS,
  ALL_ITEM_KEYS,
  ECONOMY,
  machineBetRange,
  rollSpinDamage,
  rollItemDrop,
  rollStarterRare,
  getRandomInt,
  generateMachineName,
  generateMachineColor,
  extraMachineCost,
  reelUpgradeCost,
  hpUpgradeCost,
  Rarity,
} from "./catalog";
import { evaluateSpin } from "./abilities";

const SAVE_KEY = "slotGameV4"; // смена ключа = сброс прогресса у всех

// один автомат: изолированные лента, HP, ставка, цвет; улучшения сохраняются
export interface MachineState {
  id: number;
  name: string; // смешное имя: прил + животное + 3 цифры
  color: string; // цвет корпуса
  reel: string[];
  reelCount: number; // количество барабанов (1..5), дефолт 3
  hp: number;
  maxHp: number; // улучшается отдельно на каждом автомате
  hpLevel: number; // уровень улучшения HP (для цены)
  nextReelPrice: number; // цена следующего +1 барабана (рандомится при создании/апгрейде)
  spinsDone: number;
  bet: number; // ставка автомата (сохраняется)
  autoSpin: boolean; // автокрут автомата (сохраняется, слетает только при особых событиях)
  lastWin: number;
  maxWin: number;
}

export interface GameState {
  balance: number;
  inventory: Record<string, number>; // общий инвентарь
  machines: MachineState[];
  activeMachine: number; // автомат, выбранный в мастерской для сборки
  unlockedRecipes: string[];
  lastLostItems: string[]; // что сгорело при последнем взрыве
}

export interface SpinResult {
  combination: number[];
  results: string[];
  win: number;
  cost: number;
  damage: number;
  hpAfter: number;
  broken: boolean;
  unlockedRecipe: string | null;
  notes: string[]; // сработавшие обилки
}

interface GameContextType extends GameState {
  spinCost: number; // ставка активного автомата (для мастерской)
  justBuilt: number | null; // id автомата, ждущего анимации прилёта
  clearJustBuilt: () => void;
  activeBetMin: number;
  activeBetMax: number;
  setActiveMachine: (i: number) => void;
  // действия (все по индексу автомата — машины полностью автономны)
  doSpin: (mi: number) => SpinResult | { error: string };
  chargeSpinCost: (cost: number) => void;
  applySpinResult: (mi: number, r: SpinResult) => void;
  setBet: (mi: number, v: number) => void;
  setAutoSpin: (mi: number, v: boolean) => void; // включить/выключить автокрут автомата
  restoreMachine: (mi: number) => string | null; // восстановить взорвавшийся (улучшения сохраняются)
  buyExtraMachine: () => string | null; // докупить автомат (от 10к по экспоненте)
  repair: (mi: number) => string | null; // ремонт +10 HP за 50
  shopRoll: () => { item?: string; error?: string };
  upgradeReels: (mi: number) => string | null; // +1 барабан (макс 5), дорого
  upgradeHp: (mi: number) => string | null; // +50 макс HP, дорожает с уровнем
  nextExtraMachineCost: number; // цена следующего автомата
  reelUpgradePrice: (mi: number) => number; // база для UI (рандом при покупке)
  hpUpgradePrice: (mi: number) => number;
  buildMachine: (reel: string[]) => string | null; // сборка ленты активного автомата
  availableCount: (itemKey: string) => number; // свободные экземпляры
  addCoins: (amount: number) => void; // дев-кнопка для тестов
  unlockAllRecipes: () => void; // дев-кнопка: открыть все рецепты
  // гача разделена на два шага — чтобы применить результат после анимации кейса
  shopRollPreview: () => { item?: string; error?: string };
  applyShopRoll: (item: string) => void;
}

function freshMachine(id: number, bet?: number): MachineState {
  const reelCount = getRandomInt(1, 2); // новые автоматы — с 1-2 барабанами
  return {
    id,
    name: generateMachineName(),
    color: generateMachineColor(),
    reel: [],
    reelCount,
    hp: ECONOMY.maxHp,
    maxHp: ECONOMY.maxHp,
    hpLevel: 0,
    nextReelPrice: reelUpgradeCost(reelCount), // цена генерится заранее
    spinsDone: 0,
    bet: bet ?? ECONOMY.baseSpinCost,
    autoSpin: false,
    lastWin: 0,
    maxWin: 0,
  };
}

function initialState(): GameState {
  const inventory: Record<string, number> = {};
  ECONOMY.startInventory.forEach((k) => {
    inventory[k] = (inventory[k] || 0) + 1;
  });
  // + 1 случайный редкий предмет в стартовый набор
  const rare = rollStarterRare();
  inventory[rare] = (inventory[rare] || 0) + 1;
  return {
    balance: ECONOMY.startBalance,
    inventory,
    machines: [
      {
        // первый автомат: 3 барабана и стартовая лента по умолчанию
        ...freshMachine(1),
        reelCount: 3,
        reel: [...ECONOMY.startReel],
      },
    ],
    activeMachine: 0,
    unlockedRecipes: [],
    lastLostItems: [],
  };
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    // мягкая валидация: неизвестные предметы выкидываем
    const cleanInv: Record<string, number> = {};
    Object.entries(parsed.inventory || {}).forEach(([k, v]) => {
      if (ITEMS[k] && typeof v === "number" && v > 0) cleanInv[k] = v;
    });
    const cleanMachine = (m: any, idx: number): MachineState => ({
      id: typeof m?.id === "number" ? m.id : idx + 1,
      name: typeof m?.name === "string" ? m.name : generateMachineName(),
      color: typeof m?.color === "string" ? m.color : generateMachineColor(),
      reel: Array.isArray(m?.reel)
        ? m.reel.filter((k: string) => ITEMS[k]) // пустая лента валидна (утеряна при взрыве)
        : [],
      reelCount: Math.min(
        Math.max(1, typeof m?.reelCount === "number" ? m.reelCount : 3),
        ECONOMY.maxReels
      ),
      hp: typeof m?.hp === "number" ? m.hp : ECONOMY.startHp,
      maxHp: typeof m?.maxHp === "number" ? m.maxHp : ECONOMY.maxHp,
      hpLevel: typeof m?.hpLevel === "number" ? m.hpLevel : 0,
      nextReelPrice:
        typeof m?.nextReelPrice === "number"
          ? m.nextReelPrice
          : reelUpgradeCost(
              Math.min(Math.max(1, typeof m?.reelCount === "number" ? m.reelCount : 3), ECONOMY.maxReels)
            ),
      spinsDone: typeof m?.spinsDone === "number" ? m.spinsDone : 0,
      bet: typeof m?.bet === "number" && m.bet > 0 ? m.bet : ECONOMY.baseSpinCost,
      autoSpin: m?.autoSpin === true,
      lastWin: m?.lastWin || 0,
      maxWin: m?.maxWin || 0,
    });
    const machines: MachineState[] = Array.isArray(parsed.machines)
      ? parsed.machines.map(cleanMachine)
      : [];
    if (machines.length === 0) return initialState();
    const activeMachine = Math.min(
      Math.max(0, typeof parsed.activeMachine === "number" ? parsed.activeMachine : 0),
      machines.length - 1
    );
    return {
      balance: typeof parsed.balance === "number" ? parsed.balance : ECONOMY.startBalance,
      inventory: cleanInv,
      machines,
      activeMachine,
      unlockedRecipes: Array.isArray(parsed.unlockedRecipes)
        ? parsed.unlockedRecipes.filter((k: string) => ITEMS[k])
        : [],
      lastLostItems: Array.isArray(parsed.lastLostItems)
        ? parsed.lastLostItems.filter((k: string) => ITEMS[k])
        : [],
    };
  } catch {
    return initialState();
  }
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("нужен GameProvider");
  return ctx;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>(loadState);
  const [justBuilt, setJustBuilt] = useState<number | null>(null); // id автомата для анимации

  // автосейв
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const activeMachine = state.machines[state.activeMachine];
  const { min: activeBetMin, max: activeBetMax } = machineBetRange(
    activeMachine?.reel ?? []
  );

  // предметы, занятые в ДРУГИХ автоматах (свой активный не мешает пересборке)
  function usedElsewhere(itemKey: string): number {
    let used = 0;
    state.machines.forEach((m, i) => {
      if (i === state.activeMachine) return;
      m.reel.forEach((k) => {
        if (k === itemKey) used++;
      });
    });
    return used;
  }

  function availableCount(itemKey: string): number {
    return (state.inventory[itemKey] || 0) - usedElsewhere(itemKey);
  }

  // обновление одного автомата по индексу
  function patchMachineAt(mi: number, patch: Partial<MachineState>) {
    setState((prev) => ({
      ...prev,
      machines: prev.machines.map((m, i) => (i === mi ? { ...m, ...patch } : m)),
    }));
  }

  // чистый расчёт спина автомата mi — в момент нажатия; применяется после анимации
  function doSpin(mi: number): SpinResult | { error: string } {
    const machine = state.machines[mi];
    if (!machine) return { error: "noReel" };
    if (machine.hp <= 0) return { error: "broken" };
    if (machine.reel.length < ECONOMY.reelMin) return { error: "noReel" };
    if (state.balance < machine.bet) return { error: "noMoney" };

    // барабанов = reelCount автомата (1..5)
    const combination = Array.from({ length: machine.reelCount }, () =>
      getRandomIdx(machine.reel)
    );
    const results = combination.map((i) => machine.reel[i]);

    // выигрыш и множитель урона — через движок обилок
    const evaluation = evaluateSpin(machine.bet, results, machine.reel, combination);

    // износ: рандом 0..5 + гарантированный износ всех лотов ленты (включая дубли)
    let damage = rollSpinDamage(machine.reel) * evaluation.damageMult;
    // отрицательный урон (лечащие предметы) лечит, но не выше максимума автомата
    const hpAfter = Math.min(machine.maxHp, Math.max(0, machine.hp - damage));

    // рецепт открывается за тройку и больше (на 4-5 барабанах тоже)
    let unlockedRecipe: string | null = null;
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r] = (counts[r] || 0) + 1;
    });
    for (const [key, count] of Object.entries(counts)) {
      if (count >= 3 && !state.unlockedRecipes.includes(key)) {
        unlockedRecipe = key;
        break;
      }
    }

    return {
      combination,
      results,
      win: evaluation.win,
      cost: machine.bet,
      damage,
      hpAfter,
      broken: hpAfter <= 0,
      unlockedRecipe,
      notes: evaluation.notes,
    };
  }

  // списание ставки сразу при нажатии на рычаг
  function chargeSpinCost(cost: number) {
    setState((prev) => ({ ...prev, balance: prev.balance - cost }));
  }

  // применение результата после окончания анимации барабанов
  function applySpinResult(mi: number, r: SpinResult) {
    setState((prev) => {
      const unlockedRecipes = r.unlockedRecipe
        ? [...prev.unlockedRecipes, r.unlockedRecipe]
        : prev.unlockedRecipes;
      const roundedWin = Math.round(r.win);

      const machines = [...prev.machines];
      const m = { ...machines[mi] };
      m.hp = r.hpAfter;
      m.spinsDone = m.spinsDone + 1;
      m.lastWin = roundedWin;
      m.maxWin = Math.max(m.maxWin, roundedWin);

      // автомат сломался — предметы его ленты сгорают, лента пустеет
      let inventory = prev.inventory;
      let lastLostItems = prev.lastLostItems;
      if (r.broken) {
        inventory = { ...prev.inventory };
        m.reel.forEach((k) => {
          inventory[k] = Math.max(0, (inventory[k] || 0) - 1);
        });
        lastLostItems = [...m.reel];
        m.reel = [];
      }
      machines[mi] = m;

      return {
        ...prev,
        balance: prev.balance + roundedWin, // ставка уже списана в chargeSpinCost
        machines,
        inventory,
        unlockedRecipes,
        lastLostItems,
      };
    });
  }

  // автокрут конкретного автомата
  function setAutoSpin(mi: number, v: boolean) {
    patchMachineAt(mi, { autoSpin: v });
  }

  // ставка конкретного автомата, зажатая в его диапазон
  function setBet(mi: number, v: number) {
    const m = state.machines[mi];
    if (!m) return;
    const { min, max } = machineBetRange(m.reel);
    patchMachineAt(mi, { bet: Math.min(Math.max(v, min), max) });
  }

  // ремонт: +10 HP за 50 монет (взорвавшийся автомат уже не чинится)
  function repair(mi: number): string | null {
    const machine = state.machines[mi];
    if (!machine) return "Нет автомата";
    if (machine.hp <= 0) return "Автомат взорвался — только восстановление";
    if (machine.hp >= machine.maxHp) return "Автомат полностью исправен";
    if (state.balance < ECONOMY.repairCost) return "Не хватает монет на ремонт";
    setState((prev) => ({ ...prev, balance: prev.balance - ECONOMY.repairCost }));
    patchMachineAt(mi, {
      hp: Math.min(machine.maxHp, machine.hp + ECONOMY.repairAmount),
    });
    return null;
  }

  // восстановление взорвавшегося автомата за 1000 монет.
  // Это ТОТ ЖЕ автомат: имя, цвет, число барабанов и улучшения HP сохраняются,
  // теряются только предметы ленты (сгорают при взрыве)
  function restoreMachine(mi: number): string | null {
    const machine = state.machines[mi];
    if (!machine) return "Нет автомата";
    if (machine.hp > 0) return "Автомат ещё жив — чини его";
    if (state.balance < ECONOMY.newMachineCost) {
      return `Восстановление стоит ${ECONOMY.newMachineCost} монет — не хватает`;
    }
    setState((prev) => ({ ...prev, balance: prev.balance - ECONOMY.newMachineCost }));
    patchMachineAt(mi, {
      hp: machine.maxHp,
      spinsDone: 0,
      lastWin: 0,
      maxWin: 0,
      autoSpin: false, // при восстановлении автокрут слетает
    });
    setState((prev) => ({ ...prev, lastLostItems: [] }));
    setJustBuilt(machine.id);
    return null;
  }

  // докупить дополнительный автомат: 10к, дальше по экспоненте
  function buyExtraMachine(): string | null {
    const cost = extraMachineCost(state.machines.length);
    if (state.balance < cost) {
      return `Новый автомат стоит ${cost} монет — не хватает`;
    }
    const newId = Math.max(0, ...state.machines.map((m) => m.id)) + 1;
    setState((prev) => ({
      ...prev,
      balance: prev.balance - cost,
      machines: [...prev.machines, freshMachine(newId)],
      lastLostItems: [],
    }));
    setJustBuilt(newId);
    return null;
  }

  // улучшение: +1 барабан (макс 5). Цена: 100к + рандом до 300к, дальше ×2
  function upgradeReels(mi: number): string | null {
    const machine = state.machines[mi];
    if (!machine) return "Нет автомата";
    if (machine.reelCount >= ECONOMY.maxReels) return "Максимум барабанов";
    const cost = reelUpgradeCost(machine.reelCount);
    if (state.balance < cost) return `Улучшение стоит ${cost} монет — не хватает`;
    setState((prev) => ({ ...prev, balance: prev.balance - cost }));
    patchMachineAt(mi, { reelCount: machine.reelCount + 1, autoSpin: false });
    return null;
  }

  // улучшение: +50 макс HP. Цена растёт с уровнем
  function upgradeHp(mi: number): string | null {
    const machine = state.machines[mi];
    if (!machine) return "Нет автомата";
    const cost = hpUpgradeCost(machine.hpLevel);
    if (state.balance < cost) return `Улучшение стоит ${cost} монет — не хватает`;
    setState((prev) => ({ ...prev, balance: prev.balance - cost }));
    patchMachineAt(mi, {
      maxHp: machine.maxHp + ECONOMY.hpUpgradeStep,
      hp: machine.hp + ECONOMY.hpUpgradeStep, // прибавка сразу доступна
      hpLevel: machine.hpLevel + 1,
      autoSpin: false, // при любом улучшении автокрут слетает
    });
    return null;
  }

  function shopRoll(): { item?: string; error?: string } {
    const preview = shopRollPreview();
    if (preview.item) applyShopRoll(preview.item);
    return preview;
  }

  function shopRollPreview(): { item?: string; error?: string } {
    if (state.balance < ECONOMY.shopRollCost) {
      return { error: `Нужно ${ECONOMY.shopRollCost} монет` };
    }
    return { item: rollItemDrop() };
  }

  function applyShopRoll(item: string) {
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.shopRollCost,
      inventory: {
        ...prev.inventory,
        [item]: (prev.inventory[item] || 0) + 1,
      },
    }));
  }

  // дев-кнопка для тестов: накинуть монет
  function addCoins(amount: number) {
    setState((prev) => ({ ...prev, balance: prev.balance + amount }));
  }

  // дев-кнопка для тестов: открыть все рецепты в книге
  function unlockAllRecipes() {
    setState((prev) => ({
      ...prev,
      unlockedRecipes: [...ALL_ITEM_KEYS],
    }));
  }

  // сборка ленты активного автомата.
  // Лента применяется СРАЗУ — иначе лоты можно абузить в другой автомат
  // до применения отложенного стейта. Анимация прилёта — чисто визуальная.
  function buildMachine(reel: string[]): string | null {
    const machine = state.machines[state.activeMachine];
    if (!machine) return "Нет автомата";
    // сломанный автомат нельзя собирать — сначала платное восстановление
    if (machine.hp <= 0) {
      return `Автомат взорван! Сначала восстанови его за ${ECONOMY.newMachineCost} монет`;
    }
    if (reel.length < ECONOMY.reelMin || reel.length > ECONOMY.reelMax) {
      return `Лента должна быть ${ECONOMY.reelMin}–${ECONOMY.reelMax} предметов`;
    }
    // проверяем доступность: инвентарь минус занятые в других автоматах
    const need: Record<string, number> = {};
    reel.forEach((k) => {
      need[k] = (need[k] || 0) + 1;
    });
    for (const [k, n] of Object.entries(need)) {
      if (availableCount(k) < n) {
        return `${ITEMS[k]?.label || k} занят в другом автомате или не хватает`;
      }
    }
    if (state.balance < ECONOMY.buildCost) {
      return `Сборка стоит ${ECONOMY.buildCost} монет — не хватает`;
    }
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.buildCost,
      lastLostItems: [],
    }));
    patchMachineAt(state.activeMachine, {
      reel: [...reel],
      hp: machine.maxHp, // собранный заново — полный HP
      spinsDone: 0,
      lastWin: 0,
      maxWin: 0,
      autoSpin: false, // при замене ленты автокрут слетает
    });
    setJustBuilt(machine.id); // для анимации улет/прилёт
    return null;
  }

  function setActiveMachine(i: number) {
    if (i < 0 || i >= state.machines.length) return;
    setState((prev) => ({ ...prev, activeMachine: i }));
  }

  const value: GameContextType = {
    ...state,
    spinCost: activeMachine?.bet ?? ECONOMY.baseSpinCost,
    justBuilt,
    clearJustBuilt: () => setJustBuilt(null),
    activeBetMin,
    activeBetMax,
    setActiveMachine,
    doSpin,
    chargeSpinCost,
    applySpinResult,
    setBet,
    setAutoSpin,
    restoreMachine,
    buyExtraMachine,
    repair,
    upgradeReels,
    upgradeHp,
    nextExtraMachineCost: extraMachineCost(state.machines.length),
    reelUpgradePrice: (mi) => {
      const m = state.machines[mi];
      return m ? reelUpgradeCost(m.reelCount, () => 0) : Infinity; // база для UI; рандом — при покупке
    },
    hpUpgradePrice: (mi) => {
      const m = state.machines[mi];
      return m ? hpUpgradeCost(m.hpLevel) : Infinity;
    },
    buildMachine,
    availableCount,
    addCoins,
    unlockAllRecipes,
    shopRollPreview,
    applyShopRoll,
    shopRoll,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

function getRandomIdx(arr: unknown[]) {
  return Math.floor(Math.random() * arr.length);
}
