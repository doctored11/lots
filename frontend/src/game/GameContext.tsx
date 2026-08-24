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
  extraMachineCost,
  reelUpgradeCost,
  hpUpgradeCost,
  Rarity,
} from "./catalog";
import { evaluateSpin } from "./abilities";

const SAVE_KEY = "slotGameV4"; // смена ключа = сброс прогресса у всех

// один автомат: изолированные лента, HP и своя ставка (диапазон от ленты)
export interface MachineState {
  id: number;
  name: string; // смешное имя: прил + животное + 3 цифры
  reel: string[];
  reelCount: number; // количество барабанов (1..5), дефолт 3
  hp: number;
  maxHp: number; // улучшается отдельно на каждом автомате
  hpLevel: number; // уровень улучшения HP (для цены)
  spinsDone: number;
}

export interface GameState {
  balance: number;
  inventory: Record<string, number>; // общий инвентарь
  machines: MachineState[];
  activeMachine: number; // индекс активного автомата
  unlockedRecipes: string[];
  lastWin: number;
  maxWin: number;
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
  isSpinning: boolean;
  isAnimating: boolean;
  setIsSpinning: (v: boolean) => void;
  setIsAnimating: (v: boolean) => void;
  spinCost: number;
  justBuilt: boolean; // автомат только что собран — для анимации прилёта
  setJustBuilt: (v: boolean) => void;
  bet: number; // выбранная игроком ставка (активного автомата)
  setBet: (v: number) => void;
  betMin: number;
  betMax: number;
  setActiveMachine: (i: number) => void;
  // действия
  doSpin: () => SpinResult | { error: string };
  chargeSpinCost: (cost: number) => void;
  applySpinResult: (r: SpinResult) => void;
  buyNewMachine: () => string | null; // замена взорвавшегося или новый слот
  buyExtraMachine: () => string | null; // докупить автомат (от 10к по экспоненте)
  repair: () => string | null; // ремонт +10 HP за 50 (активного автомата)
  upgradeReels: () => string | null; // +1 барабан (макс 5), дорого
  upgradeHp: () => string | null; // +50 макс HP, дорожает с уровнем
  nextExtraMachineCost: number; // цена следующего автомата
  nextReelUpgradeCost: number; // цена +1 барабана активного (Infinity если макс)
  nextHpUpgradeCost: number; // цена +50 макс HP активного
  shopRoll: () => { item?: string; error?: string };
  buildMachine: (reel: string[]) => string | null; // сборка ленты активного автомата
  pendingReel: string[] | null; // лента, ждущая анимации прилёта
  applyPendingReel: () => void;
  availableCount: (itemKey: string) => number; // свободные экземпляры (не занятые в других автоматах)
  addCoins: (amount: number) => void; // дев-кнопка для тестов
  unlockAllRecipes: () => void; // дев-кнопка: открыть все рецепты
  // гача разделена на два шага — чтобы применить результат после анимации кейса
  shopRollPreview: () => { item?: string; error?: string };
  applyShopRoll: (item: string) => void;
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
        id: 1,
        name: generateMachineName(),
        reel: [...ECONOMY.startReel],
        reelCount: 3, // первый автомат по умолчанию с тремя лентами
        hp: ECONOMY.startHp,
        maxHp: ECONOMY.maxHp,
        hpLevel: 0,
        spinsDone: 0,
      },
    ],
    activeMachine: 0,
    unlockedRecipes: [],
    lastWin: 0,
    maxWin: 0,
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
      spinsDone: typeof m?.spinsDone === "number" ? m.spinsDone : 0,
    });
    // миграция старого сейва (reel/hp на верхнем уровне)
    const machines: MachineState[] = Array.isArray(parsed.machines)
      ? parsed.machines.map(cleanMachine)
      : [cleanMachine({ id: 1, reel: parsed.reel, hp: parsed.hp, spinsDone: parsed.spinsDone }, 0)];
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
      lastWin: parsed.lastWin || 0,
      maxWin: parsed.maxWin || 0,
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justBuilt, setJustBuilt] = useState(false);
  const [pendingReel, setPendingReel] = useState<string[] | null>(null);

  const machine = state.machines[state.activeMachine];
  const { min: betMin, max: betMax } = machineBetRange(machine?.reel ?? []);
  const [bet, setBetRaw] = useState(betMin);

  // при смене ленты/автомата ставка зажимается в новый диапазон
  useEffect(() => {
    setBetRaw((b) => Math.min(Math.max(b, betMin), betMax));
  }, [betMin, betMax]);

  const setBet = (v: number) =>
    setBetRaw(Math.min(Math.max(v, betMin), betMax));

  // автосейв
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  // цена прокрута = выбранная ставка
  const spinCost = bet;

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

  // обновление активного автомата
  function patchMachine(patch: Partial<MachineState>) {
    setState((prev) => ({
      ...prev,
      machines: prev.machines.map((m, i) =>
        i === prev.activeMachine ? { ...m, ...patch } : m
      ),
    }));
  }

  // чистый расчёт спина — вызывается в момент нажатия, результат применяется после анимации
  function doSpin(): SpinResult | { error: string } {
    if (!machine) return { error: "noReel" };
    if (machine.hp <= 0) return { error: "broken" };
    if (machine.reel.length < ECONOMY.reelMin) return { error: "noReel" };
    if (state.balance < spinCost) return { error: "noMoney" };

    // барабанов = reelCount автомата (1..5)
    const combination = Array.from({ length: machine.reelCount }, () =>
      getRandomIdx(machine.reel)
    );
    const results = combination.map((i) => machine.reel[i]);

    // выигрыш и множитель урона — через движок обилок
    const evaluation = evaluateSpin(spinCost, results, machine.reel, combination);

    // износ: рандом 0..5 + гарантированный износ всех лотов ленты (включая дубли)
    let damage = rollSpinDamage(machine.reel) * evaluation.damageMult;
    // отрицательный урон (лечащие предметы) лечит, но не выше максимума автомата
    const hpAfter = Math.min(
      machine.maxHp,
      Math.max(0, machine.hp - damage)
    );

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
      cost: spinCost,
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
  function applySpinResult(r: SpinResult) {
    setState((prev) => {
      const unlockedRecipes = r.unlockedRecipe
        ? [...prev.unlockedRecipes, r.unlockedRecipe]
        : prev.unlockedRecipes;
      const roundedWin = Math.round(r.win);

      const machines = [...prev.machines];
      const m = { ...machines[prev.activeMachine] };
      m.hp = r.hpAfter;
      m.spinsDone = m.spinsDone + 1;

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
      machines[prev.activeMachine] = m;

      return {
        ...prev,
        balance: prev.balance + roundedWin, // ставка уже списана в chargeSpinCost
        machines,
        inventory,
        unlockedRecipes,
        lastLostItems,
        lastWin: roundedWin,
        maxWin: Math.max(prev.maxWin, roundedWin),
      };
    });
  }

  // ремонт: +10 HP за 50 монет (взорвавшийся автомат уже не чинится — только новый)
  function repair(): string | null {
    if (!machine) return "Нет автомата";
    if (machine.hp <= 0) return "Автомат взорвался — только новый";
    if (machine.hp >= machine.maxHp) return "Автомат полностью исправен";
    if (state.balance < ECONOMY.repairCost) return "Не хватает монет на ремонт";
    setState((prev) => ({ ...prev, balance: prev.balance - ECONOMY.repairCost }));
    patchMachine({ hp: Math.min(machine.maxHp, machine.hp + ECONOMY.repairAmount) });
    return null;
  }

  // новый автомат: рандомно 1 или 2 барабана, пустая лента, смешное имя
  function freshMachine(id: number): MachineState {
    return {
      id,
      name: generateMachineName(),
      reel: [],
      reelCount: getRandomInt(1, 2), // новые автоматы — с 1-2 лентами
      hp: ECONOMY.maxHp,
      maxHp: ECONOMY.maxHp,
      hpLevel: 0,
      spinsDone: 0,
    };
  }

  // замена взорвавшегося автомата за 1000 монет (лента утеряна навсегда)
  function buyNewMachine(): string | null {
    if (!machine || machine.hp > 0) return "Автомат ещё жив — чини его";
    if (state.balance < ECONOMY.newMachineCost) {
      return `Новый автомат стоит ${ECONOMY.newMachineCost} монет — не хватает`;
    }
    setState((prev) => {
      const machines = [...prev.machines];
      machines[prev.activeMachine] = freshMachine(machines[prev.activeMachine].id);
      return {
        ...prev,
        balance: prev.balance - ECONOMY.newMachineCost,
        machines,
        lastLostItems: [],
      };
    });
    setJustBuilt(true); // анимация прилёта
    return null;
  }

  // докупить дополнительный автомат: 10к, дальше по экспоненте
  function buyExtraMachine(): string | null {
    const cost = extraMachineCost(state.machines.length);
    if (state.balance < cost) {
      return `Новый автомат стоит ${cost} монет — не хватает`;
    }
    setState((prev) => {
      const newId = Math.max(0, ...prev.machines.map((m) => m.id)) + 1;
      const machines = [...prev.machines, freshMachine(newId)];
      return {
        ...prev,
        balance: prev.balance - cost,
        machines,
        activeMachine: machines.length - 1,
        lastLostItems: [],
      };
    });
    setJustBuilt(true);
    return null;
  }

  // улучшение: +1 барабан (макс 5). Цена: 100к + рандом до 300к, дальше ×2
  function upgradeReels(): string | null {
    if (!machine) return "Нет автомата";
    if (machine.reelCount >= ECONOMY.maxReels) return "Максимум барабанов";
    const cost = reelUpgradeCost(machine.reelCount);
    if (state.balance < cost) return `Улучшение стоит ${cost} монет — не хватает`;
    setState((prev) => ({ ...prev, balance: prev.balance - cost }));
    patchMachine({ reelCount: machine.reelCount + 1 });
    return null;
  }

  // улучшение: +50 макс HP. Цена растёт с уровнем
  function upgradeHp(): string | null {
    if (!machine) return "Нет автомата";
    const cost = hpUpgradeCost(machine.hpLevel);
    if (state.balance < cost) return `Улучшение стоит ${cost} монет — не хватает`;
    setState((prev) => ({ ...prev, balance: prev.balance - cost }));
    patchMachine({
      maxHp: machine.maxHp + ECONOMY.hpUpgradeStep,
      hp: machine.hp + ECONOMY.hpUpgradeStep, // прибавка сразу доступна
      hpLevel: machine.hpLevel + 1,
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
  // Предметы не расходуются, но нельзя ставить лот, занятый в другом автомате
  function buildMachine(reel: string[]): string | null {
    if (!machine) return "Нет автомата";
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
    // лента применяется отложенно — после анимации улёта старого автомата
    setPendingReel([...reel]);
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.buildCost,
      lastLostItems: [],
    }));
    setJustBuilt(true); // для анимации улет/прилёт
    return null;
  }

  // применяет отложенную ленту (вызывается в момент прилёта нового автомата)
  function applyPendingReel() {
    if (!pendingReel) return;
    const reel = pendingReel;
    setPendingReel(null);
    patchMachine({ reel, hp: machine?.maxHp ?? ECONOMY.maxHp, spinsDone: 0 });
    setState((prev) => ({ ...prev, lastWin: 0, maxWin: 0 }));
  }

  function setActiveMachine(i: number) {
    if (i < 0 || i >= state.machines.length) return;
    setState((prev) => ({ ...prev, activeMachine: i, lastWin: 0, maxWin: 0 }));
  }

  const value: GameContextType = {
    ...state,
    isSpinning,
    isAnimating,
    setIsSpinning,
    setIsAnimating,
    spinCost,
    justBuilt,
    setJustBuilt,
    bet,
    setBet,
    betMin,
    betMax,
    setActiveMachine,
    doSpin,
    chargeSpinCost,
    applySpinResult,
    buyNewMachine,
    buyExtraMachine,
    upgradeReels,
    upgradeHp,
    nextExtraMachineCost: extraMachineCost(state.machines.length),
    nextReelUpgradeCost: machine
      ? reelUpgradeCost(machine.reelCount, () => 0) // база для UI; рандом — при покупке
      : Infinity,
    nextHpUpgradeCost: machine ? hpUpgradeCost(machine.hpLevel) : Infinity,
    repair,
    shopRoll,
    shopRollPreview,
    applyShopRoll,
    buildMachine,
    pendingReel,
    applyPendingReel,
    availableCount,
    addCoins,
    unlockAllRecipes,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

function getRandomIdx(arr: unknown[]) {
  return Math.floor(Math.random() * arr.length);
}
