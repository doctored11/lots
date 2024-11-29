import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  SetStateAction,
  useEffect,
} from "react";
import { REWARDS, DRUM_CHANCES } from "../../../constants/drumConstants";
import { getRandomInt } from "../../../../tools/tools";
import { useGameAPI } from "../../../../api/useLotsAPI";
import { usePlayerContext } from "../../../../PlayerContext";
import styles from "./mashineBody/mashineBody.module.css" //да стили для смены машины

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
  startAnimation: () => void;
  endAnimation: () => void;
}

export const SlotContext = createContext<SlotContextType | undefined>(
  undefined
);

export const useSlotContext = () => {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error("Провайдер нужен");
  }
  return context;
};
export const SlotProvider = ({ children }: { children: ReactNode }) => {
  const [betStep, setBetStep] = useState(10);
  const [betInGame, setBetInGame] = useState(0);
  const [machineLives, setMachineLives] = useState(10);

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
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  const [pendingState, setPendingState] = useState<{
    newReel: Array<keyof typeof REWARDS>;
    newBalance: number;
    newColor: string;
    newBetStep: number;
    newLives: number;
  } | null>(null);


  const { getSlotInfo, changeMachine } = useGameAPI();

  const { chatId } = usePlayerContext();
  const initializeSlot = async () => {
    if (!chatId) {
      console.error("Отсутствует chatId для инициализации слота");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getSlotInfo(chatId);
      console.log("⚠️ - ", response);
      if (response.success) {
        setReel(response.data.reel);
        setBetStep(response.data.betStep);
        setLastWin(response.data.lastWin);
        setMaxWin(response.data.maxWin);
        setColor(response.data.color || "#6294a4f0");
        console.log("Слот успешно инициализирован:", response.data);
      } else {
        console.error("Ошибка загрузки слота:", response.error);
      }
    } catch (error) {
      console.error("Ошибка инициализации слота:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      initializeSlot();
    } else {
      console.log("нет chatId в SlotContext");
    }
  }, []);

  function updateSlotScore(win: number) {
    const roundedWin = Math.round(win);
    setLastWin(roundedWin);
    if (roundedWin > maxWin) {
      setMaxWin(roundedWin);
    }
  }

  function applyPendingState() {
    if (pendingState) {
      setReel(pendingState.newReel);
      setBetStep(pendingState.newBetStep);
      setLastWin(0);
      setMaxWin(0);
      setColor(pendingState.newColor);
      setMachineLives(pendingState.newLives);
      setPendingState(null); 
    }
  }

  
  


  const startAnimation = () => {
    setIsAnimating(true);
    const shadowView = document.getElementById("shadow");
    const mashineView = document.getElementById("mashine");

    shadowView?.classList.add(styles.shadow);
    if (mashineView) {
      setTimeout(() => {
        mashineView.classList.add(styles.mashineHide);
        shadowView?.classList.add(styles.shadowGrow);
       
      }, 100);
    }
  };
  

  const endAnimation = () => {
    const shadowView = document.getElementById("shadow");
    const mashineView = document.getElementById("mashine");

    mashineView?.classList.remove(styles.mashineHide);
    shadowView?.classList.remove(styles.shadowGrow);

    applyPendingState()

    mashineView?.classList.add(styles.mashineShow);
    shadowView?.classList.add(styles.shadowAppearance);

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineShow);
      shadowView?.classList.remove(styles.shadowAppearance);
      setIsAnimating(false);
    }, 1300);
  };

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
    isSpinning,
    machineLives,
    setMachineLives,
    isAnimating,
    setIsAnimating,
    setIsSpinning,
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
    getNewMachine,
    loading,
    startAnimation,
    endAnimation,
  };

  async function getNewMachine(
    chatId: string,
    balance: number
  ): Promise<{
    success: boolean;
    data?: {
      newReel: Array<keyof typeof REWARDS>;
      newBalance: number;
      newColor: string;
      newBetStep: number;
      newLives: number;
    };
    error?: string;
  }> {
    const currentState = {
      reel,
      color,
      betStep,
      lastWin,
      maxWin,
    };

    try {
      console.log(" запрос на смену автомата:", {
        chatId,
        balance,
      });
      const response = await changeMachine(chatId, balance);
      console.log("Ответ от сервера при смене автомата:", response);
      if (response.success) {
        console.log(" - получили новую ленту:", response.data.newReel);

        // setReel(response.data.newReel);
        // setColor(response.data.color);
        // setBetStep(10);
        // setLastWin(0);
        // setMaxWin(0);

        return response;
      } else {
        alert("Ошибка смены автомата: " + response.error);
        return { success: false, error: "не успех(" };
      }
    } catch (error) {
      console.error("Ошибка смены автомата:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Неизвестная ошибка: " + error,
      };
    }




    
  }

  return (
    <SlotContext.Provider value={slotContextValue}>
      {children}
    </SlotContext.Provider>
  );
};
