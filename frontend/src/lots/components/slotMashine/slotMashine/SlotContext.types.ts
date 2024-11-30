// SlotContext.types.ts
import { REWARDS, DRUM_CHANCES } from "../../../constants/drumConstants";
export interface PendingStateType {
  newReel: Array<keyof typeof REWARDS>;
  newBalance: number;
  newColor: string;
  newBetStep: number;
  newLives: number;
}
export type DrumItem = keyof typeof DRUM_CHANCES;
export interface SlotContextType {
  betStep: number;
  betInGame: number;
  combination: Array<number | null>;
  mode: string;
  reel: Array<keyof typeof REWARDS>;
  color: string;
  lastWin: number;
  maxWin: number;
  rollCount: number;
  isSpinning: boolean;
  isAnimating: boolean;
  machineLives: number;
  setMachineLives: (lives: number) => void;
  setIsSpinning: (value: boolean) => void;
  setIsAnimating: (value: boolean) => void;
  setCombination: (combination: Array<number | null>) => void;
  setBetStep: (betStep: number) => void;
  setBetInGame: (betInGame: number) => void;
  setMode: (mode: string) => void;
  setReel: (reel: Array<keyof typeof REWARDS>) => void;
  setRollCount: (rollCount: number) => void;
  setColor: (color: string) => void;
  setLastWin: (win: number) => void;
  pendingState: PendingStateType | null;
  setPendingState: React.Dispatch<
    React.SetStateAction<PendingStateType | null>
  >;

  setMaxWin: (win: number) => void;
  reelUpdate: () => void;
  updateSlotScore: (win: number) => void;
  getNewMachine: (
    chatId: string,
    balance: number
  ) => Promise<{
    success: boolean;
    data?: {
      newReel: Array<keyof typeof REWARDS>;
      newBalance: number;
      newColor: string;
      newBetStep: number;
      newLives: number;
    };
    error?: string;
  }>;
  loading: boolean;
  startAnimation: (setIsAnimating: (value: boolean) => void) => void; 
  startExplosionAnimation: (setIsAnimating: (value: boolean) => void) => void;
  endAnimation: (
    setIsAnimating: (value: boolean) => void,
    applyPendingState: () => void
  ) => void;
}
