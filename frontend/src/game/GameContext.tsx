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
  calculateWinnings,
  reelNeighbors,
  rollSpinDamage,
  rollItemDrop,
  rollStarterRare,
  Rarity,
} from "./catalog";

const SAVE_KEY = "slotGameV4"; // смена ключа = сброс прогресса у всех

export interface GameState {
  balance: number;
  inventory: Record<string, number>;
  reel: string[];
  hp: number;
  spinsDone: number; // для износа
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
}

interface GameContextType extends GameState {
  isSpinning: boolean;
  isAnimating: boolean;
  setIsSpinning: (v: boolean) => void;
  setIsAnimating: (v: boolean) => void;
  spinCost: number;
  justBuilt: boolean; // автомат только что собран — для анимации прилёта
  setJustBuilt: (v: boolean) => void;
  bet: number; // выбранная игроком ставка
  setBet: (v: number) => void;
  betMin: number;
  betMax: number;
  // действия
  doSpin: () => SpinResult | { error: string };
  chargeSpinCost: (cost: number) => void;
  applySpinResult: (r: SpinResult) => void;
  buyNewMachine: () => string | null; // новый автомат (только если взорвался)
  repair: () => string | null; // ремонт +10 HP за 50
  shopRoll: () => { item?: string; error?: string };
  buildMachine: (reel: string[]) => string | null;
  pendingReel: string[] | null; // лента, ждущая анимации смены автомата
  applyPendingReel: () => void;
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
    reel: [...ECONOMY.startReel],
    hp: ECONOMY.startHp,
    spinsDone: 0,
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
    return {
      balance: typeof parsed.balance === "number" ? parsed.balance : ECONOMY.startBalance,
      inventory: cleanInv,
      reel: Array.isArray(parsed.reel)
        ? parsed.reel.filter((k: string) => ITEMS[k]) // пустая лента валидна (утеряна при взрыве)
        : [...ECONOMY.startReel],
      hp: typeof parsed.hp === "number" ? parsed.hp : ECONOMY.startHp,
      spinsDone: typeof parsed.spinsDone === "number" ? parsed.spinsDone : 0,
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

  const { min: betMin, max: betMax } = machineBetRange(state.reel);
  const [bet, setBetRaw] = useState(betMin);

  // при смене ленты ставка зажимается в новый диапазон
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

  // чистый расчёт спина — вызывается в момент нажатия, результат применяется после анимации
  function doSpin(): SpinResult | { error: string } {
    if (state.hp <= 0) return { error: "broken" };
    if (state.reel.length < ECONOMY.reelMin) return { error: "noReel" };
    if (state.balance < spinCost) return { error: "noMoney" };

    const combination = [
      getRandomIdx(state.reel),
      getRandomIdx(state.reel),
      getRandomIdx(state.reel),
    ];
    const results = combination.map((i) => state.reel[i]);

    // тройка бомб: каждая бомба тянет предметы с рядов выше и ниже,
    // каждый сосед даёт свой потенциал за тройку
    let bonusTriples: string[] = [];
    const isBombTriple = results.every((r) => r === "bomb");
    if (isBombTriple) {
      bonusTriples = combination.flatMap((idx) =>
        reelNeighbors(state.reel, idx)
      );
    }

    const win = calculateWinnings(spinCost, results, bonusTriples);
    let damage = rollSpinDamage(state.spinsDone, state.reel);
    // пара бомб на барабанах — тройной износ за прокрут
    if (results.filter((r) => r === "bomb").length === 2) {
      damage *= 3;
    }
    // отрицательный урон (лечащие предметы) лечит, но не выше максимума
    const hpAfter = Math.min(ECONOMY.maxHp, Math.max(0, state.hp - damage));

    let unlockedRecipe: string | null = null;
    if (
      results[0] === results[1] &&
      results[1] === results[2] &&
      !state.unlockedRecipes.includes(results[0])
    ) {
      unlockedRecipe = results[0];
    }

    return {
      combination,
      results,
      win,
      cost: spinCost,
      damage,
      hpAfter,
      broken: hpAfter <= 0,
      unlockedRecipe,
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

      // автомат сломался — предметы ленты сгорают
      let inventory = prev.inventory;
      let lastLostItems = prev.lastLostItems;
      if (r.broken) {
        inventory = { ...prev.inventory };
        prev.reel.forEach((k) => {
          inventory[k] = Math.max(0, (inventory[k] || 0) - 1);
        });
        lastLostItems = [...prev.reel];
      }

      return {
        ...prev,
        balance: prev.balance + roundedWin, // ставка уже списана в chargeSpinCost
        hp: r.hpAfter,
        spinsDone: prev.spinsDone + 1,
        inventory,
        unlockedRecipes,
        lastLostItems,
        lastWin: roundedWin,
        maxWin: Math.max(prev.maxWin, roundedWin),
      };
    });
  }

  // ремонт: +10 HP за 50 монет (сломанный автомат уже не чинится — только новый)
  function repair(): string | null {
    if (state.hp <= 0) return "Автомат взорвался — только новый";
    if (state.hp >= ECONOMY.maxHp) return "Автомат полностью исправен";
    if (state.balance < ECONOMY.repairCost) return "Не хватает монет на ремонт";
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.repairCost,
      hp: Math.min(ECONOMY.maxHp, prev.hp + ECONOMY.repairAmount),
    }));
    return null;
  }

  // новый автомат за 1000 монет — только если старый взорвался
  function buyNewMachine(): string | null {
    if (state.hp > 0) return "Автомат ещё жив — чини его";
    if (state.balance < ECONOMY.newMachineCost) {
      return `Новый автомат стоит ${ECONOMY.newMachineCost} монет — не хватает`;
    }
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.newMachineCost,
      hp: ECONOMY.maxHp,
      spinsDone: 0,
      lastLostItems: [],
      reel: [], // лента утеряна при взрыве — новую надо собрать в мастерской
    }));
    setJustBuilt(true); // анимация прилёта
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

  function buildMachine(reel: string[]): string | null {
    if (reel.length < ECONOMY.reelMin || reel.length > ECONOMY.reelMax) {
      return `Лента должна быть ${ECONOMY.reelMin}–${ECONOMY.reelMax} предметов`;
    }
    // проверяем наличие (предметы НЕ расходуются — сгорают только при взрыве автомата)
    const need: Record<string, number> = {};
    reel.forEach((k) => {
      need[k] = (need[k] || 0) + 1;
    });
    for (const [k, n] of Object.entries(need)) {
      if ((state.inventory[k] || 0) < n) return `Не хватает: ${ITEMS[k]?.label || k}`;
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
    setState((prev) => ({
      ...prev,
      reel,
      hp: ECONOMY.maxHp, // новый автомат — полный HP
      spinsDone: 0,      // износ сбрасывается
      lastWin: 0,
      maxWin: 0,
    }));
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
    doSpin,
    chargeSpinCost,
    applySpinResult,
    buyNewMachine,
    repair,
    shopRoll,
    shopRollPreview,
    applyShopRoll,
    buildMachine,
    pendingReel,
    applyPendingReel,
    addCoins,
    unlockAllRecipes,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

function getRandomIdx(arr: unknown[]) {
  return Math.floor(Math.random() * arr.length);
}
