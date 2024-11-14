import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  SetStateAction,
} from "react";
import { REWARDS, DRUM_CHANCES } from "../../../constants/drumConstants";
import { getRandomInt } from "../../../tools/tools";

type DrumItem = keyof typeof DRUM_CHANCES;

// прости я в будущем
interface SlotContextType {
  betStep: number;
  betInGame: number;
  combination: Array<number | null>;
  mode: string;
  reel: Array<keyof typeof REWARDS>;
  color: string;
  lastWin: number;
  maxWin: number;
  rollCount: number;
  setCombination: (combination: Array<number | null>) => void;
  setBetStep: (betStep: number) => void;
  setBetInGame: (betInGame: number) => void;
  setMode: (mode: string) => void;
  setReel: (reel: Array<keyof typeof REWARDS>) => void;
  setRollCount: (rollCount: number) => void;
  setColor: (color: string) => void;
  setLastWin: (win: number) => void;
  setMaxWin: (win: number) => void;
  reelUpdate: () => void;
  updateSlotScore: (win: number) => void;
}

export const SlotContext = createContext<SlotContextType | undefined>(
  undefined
);

export const SlotProvider = ({ children }: { children: ReactNode }) => {
  const [betStep, setBetStep] = useState(10);
  const [betInGame, setBetInGame] = useState(0);
  const [combination, setCombination] = useState<Array<number | null>>([
    null,
    null,
    null,
  ]);
  const [mode, setMode] = useState("normal");
  const [reel, setReel] = useState<Array<keyof typeof REWARDS>>([
    "bomb",
    "clover",
    "grape",
    "mushroom",
    "grape",
    "melon",
    "banana",
    "blueBerrie",
    "cherry",
  ]);
  const [rollCount, setRollCount] = useState(3);
  const [lastWin, setLastWin] = useState(0);
  const [maxWin, setMaxWin] = useState(0);
  const [color, setColor] = useState("#6294a4f0");

  const slotContextValue: SlotContextType = {
    betStep,
    betInGame,
    combination,
    mode,
    color,
    reel,
    lastWin,
    maxWin,
    rollCount,
    setCombination,
    setBetStep,
    setBetInGame,
    setMode,
    setReel,
    setRollCount,
    setColor,
    setLastWin,
    setMaxWin,
    reelUpdate,
    updateSlotScore,
  };

  return (
    <SlotContext.Provider value={slotContextValue}>
      {children}
    </SlotContext.Provider>
  );

  function updateSlotScore(win: number) {
    const roundedWin = Math.round(win);
    setLastWin(roundedWin);
    if (roundedWin > maxWin) {
      setMaxWin(roundedWin);
    }
  }

  function reelUpdate() {
    const newReel: DrumItem[] = [];
    const weightedItems: DrumItem[] = [];

    Object.entries(DRUM_CHANCES).forEach(([item, { priority, maxCount }]) => {
      for (let i = 0; i < priority; i++) {
        weightedItems.push(item as DrumItem);
      }
    });

    weightedItems.sort(() => Math.random() - 0.5);

    const itemCount: Record<DrumItem, number> = Object.keys(
      DRUM_CHANCES
    ).reduce((acc, key) => {
      acc[key as DrumItem] = 0;
      return acc;
    }, {} as Record<DrumItem, number>);

    const elCount = getRandomInt(5, 8);
    while (newReel.length < elCount) {
      const randomIndex = getRandomInt(0, weightedItems.length - 1);
      const selectedItem = weightedItems[randomIndex];

      if (
        (itemCount[selectedItem] || 0) < DRUM_CHANCES[selectedItem].maxCount
      ) {
        newReel.push(selectedItem);
        itemCount[selectedItem] = (itemCount[selectedItem] || 0) + 1;
      }
    }

    setReel(newReel);
    console.log("колесико обновлено, ", elCount, newReel);
  }
};

export const useSlotContext = () => {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error("Провайдер нужен");
  }
  return context;
};
