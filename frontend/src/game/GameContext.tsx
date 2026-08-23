import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  ITEMS,
  ECONOMY,
  machineSpinCost,
  calculateWinnings,
  rollSpinDamage,
  rollItemDrop,
  Rarity,
} from "./catalog";

const SAVE_KEY = "slotGameV3";

export interface GameState {
  balance: number;
  inventory: Record<string, number>;
  reel: string[];
  hp: number;
  spinsDone: number; // для износа
  unlockedRecipes: string[];
  lastWin: number;
  maxWin: number;
}

export interface SpinResult {
  combination: number[];
  results: string[];
  win: number;
  cost: number;
  damage: number;
  hpAfter: number;
  broken: boolean;
  droppedItem: string;
  unlockedRecipe: string | null;
}

interface GameContextType extends GameState {
  isSpinning: boolean;
  isAnimating: boolean;
  setIsSpinning: (v: boolean) => void;
  setIsAnimating: (v: boolean) => void;
  spinCost: number;
  // действия
  doSpin: () => SpinResult | { error: string };
  applySpinResult: (r: SpinResult) => void;
  repair: () => string | null; // null = ок, иначе текст ошибки
  shopRoll: () => { item?: string; error?: string };
  buildMachine: (reel: string[]) => string | null;
}

function initialState(): GameState {
  const inventory: Record<string, number> = {};
  ECONOMY.startInventory.forEach((k) => {
    inventory[k] = (inventory[k] || 0) + 1;
  });
  return {
    balance: ECONOMY.startBalance,
    inventory,
    reel: [...ECONOMY.startReel],
    hp: ECONOMY.startHp,
    spinsDone: 0,
    unlockedRecipes: [],
    lastWin: 0,
    maxWin: 0,
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
    const cleanReel = Array.isArray(parsed.reel)
      ? parsed.reel.filter((k: string) => ITEMS[k])
      : [];
    return {
      balance: typeof parsed.balance === "number" ? parsed.balance : ECONOMY.startBalance,
      inventory: cleanInv,
      reel: cleanReel.length >= ECONOMY.reelMin ? cleanReel : [...ECONOMY.startReel],
      hp: typeof parsed.hp === "number" ? parsed.hp : ECONOMY.startHp,
      spinsDone: typeof parsed.spinsDone === "number" ? parsed.spinsDone : 0,
      unlockedRecipes: Array.isArray(parsed.unlockedRecipes)
        ? parsed.unlockedRecipes.filter((k: string) => ITEMS[k])
        : [],
      lastWin: parsed.lastWin || 0,
      maxWin: parsed.maxWin || 0,
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

  // автосейв
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const spinCost = machineSpinCost(state.reel);

  // чистый расчёт спина — вызывается в момент нажатия, результат применяется после анимации
  function doSpin(): SpinResult | { error: string } {
    if (state.hp <= 0) return { error: "broken" };
    if (state.balance < spinCost) return { error: "noMoney" };

    const combination = [
      getRandomIdx(state.reel),
      getRandomIdx(state.reel),
      getRandomIdx(state.reel),
    ];
    const results = combination.map((i) => state.reel[i]);
    const win = calculateWinnings(spinCost, results);
    const damage = rollSpinDamage(state.spinsDone);
    const hpAfter = Math.max(0, state.hp - damage);
    const droppedItem = rollItemDrop();

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
      droppedItem,
      unlockedRecipe,
    };
  }

  // применение результата после окончания анимации барабанов
  function applySpinResult(r: SpinResult) {
    setState((prev) => {
      const inventory = { ...prev.inventory };
      inventory[r.droppedItem] = (inventory[r.droppedItem] || 0) + 1;
      const unlockedRecipes = r.unlockedRecipe
        ? [...prev.unlockedRecipes, r.unlockedRecipe]
        : prev.unlockedRecipes;
      const roundedWin = Math.round(r.win);
      return {
        ...prev,
        balance: prev.balance - r.cost + roundedWin,
        hp: r.hpAfter,
        spinsDone: prev.spinsDone + 1,
        inventory,
        unlockedRecipes,
        lastWin: roundedWin,
        maxWin: Math.max(prev.maxWin, roundedWin),
      };
    });
  }

  function repair(): string | null {
    if (state.hp >= ECONOMY.maxHp) return "Автомат полностью исправен";
    if (state.balance < ECONOMY.repairCost) return "Не хватает монет на ремонт";
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.repairCost,
      hp: Math.min(ECONOMY.maxHp, prev.hp + ECONOMY.repairAmount),
    }));
    return null;
  }

  function shopRoll(): { item?: string; error?: string } {
    if (state.balance < ECONOMY.shopRollCost) {
      return { error: `Нужно ${ECONOMY.shopRollCost} монет` };
    }
    const item = rollItemDrop();
    setState((prev) => ({
      ...prev,
      balance: prev.balance - ECONOMY.shopRollCost,
      inventory: {
        ...prev.inventory,
        [item]: (prev.inventory[item] || 0) + 1,
      },
    }));
    return { item };
  }

  function buildMachine(reel: string[]): string | null {
    if (reel.length < ECONOMY.reelMin || reel.length > ECONOMY.reelMax) {
      return `Лента должна быть ${ECONOMY.reelMin}–${ECONOMY.reelMax} предметов`;
    }
    // проверяем наличие
    const need: Record<string, number> = {};
    reel.forEach((k) => {
      need[k] = (need[k] || 0) + 1;
    });
    for (const [k, n] of Object.entries(need)) {
      if ((state.inventory[k] || 0) < n) return `Не хватает: ${ITEMS[k]?.label || k}`;
    }
    setState((prev) => {
      const inventory = { ...prev.inventory };
      reel.forEach((k) => {
        inventory[k] -= 1;
      });
      return {
        ...prev,
        inventory,
        reel: [...reel],
        hp: ECONOMY.maxHp, // новый автомат — полный HP
        spinsDone: 0,      // износ сбрасывается
        lastWin: 0,
        maxWin: 0,
      };
    });
    return null;
  }

  const value: GameContextType = {
    ...state,
    isSpinning,
    isAnimating,
    setIsSpinning,
    setIsAnimating,
    spinCost,
    doSpin,
    applySpinResult,
    repair,
    shopRoll,
    buildMachine,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

function getRandomIdx(arr: unknown[]) {
  return Math.floor(Math.random() * arr.length);
}
