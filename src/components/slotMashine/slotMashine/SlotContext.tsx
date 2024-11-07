import React, { createContext, useState, useContext, ReactNode } from "react";
import { REWARDS } from "../../../constants/drumConstants";

interface SlotContextType {
  betStep: number;
  betInGame: number;
  combination: Array<number | null>;
  mode: string;
  reel: Array<keyof typeof REWARDS>;
  rollCount: number;
  setCombination: (combination: Array<number | null>) => void;
  setBetStep: (betStep: number) => void;
  setBetInGame: (betInGame: number) => void;
  setMode: (mode: string) => void;
  setReel: (reel: Array<keyof typeof REWARDS>) => void;
  setRollCount: (rollCount: number) => void;
}

export const SlotContext = createContext<SlotContextType | undefined>(undefined);

export const SlotProvider = ({ children }: { children: ReactNode }) => {
  const [betStep, setBetStep] = useState(10);
  const [betInGame, setBetInGame] = useState(0);
  const [combination, setCombination] = useState<Array<number | null>>([null, null, null]);
  const [mode, setMode] = useState("normal");
  const [reel, setReel] = useState<Array<keyof typeof REWARDS>>(["bomb", "clover", "grape", "mushroom","grape"]);
  const [rollCount, setRollCount] = useState(3);

  const slotContextValue: SlotContextType = {
    betStep,
    betInGame,
    combination,
    mode,
    reel,
    rollCount,
    setCombination,
    setBetStep,
    setBetInGame,
    setMode,
    setReel,
    setRollCount,
  };

  return <SlotContext.Provider value={slotContextValue}>{children}</SlotContext.Provider>;
};


export const useSlotContext = () => {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error("Провайдер нужен");
  }
  return context;
};
