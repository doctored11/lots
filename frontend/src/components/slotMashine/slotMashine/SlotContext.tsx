import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  SetStateAction,
  useEffect,
} from "react";
import { REWARDS, DRUM_CHANCES } from "../../../constants/drumConstants";
import { getRandomInt } from "../../../tools/tools";
import { useGameAPI } from "../../../api/useLotsAPI";
import { usePlayerContext } from "../../../PlayerContext";

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
  getNewMachine: (
    chatId: string,
    balance: number
  ) => Promise<{
    success: boolean;
    data?: {
      newReel: Array<keyof typeof REWARDS>;
      newBalance: number;
    };
    error?: string;
  }>;
  loading: boolean;
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

  const { getSlotInfo, changeMachine } = useGameAPI();

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
    getNewMachine,
    loading,
  };

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

  async function getNewMachine(
    chatId: string,
    balance: number
  ): Promise<{
    success: boolean;
    data?: {
      newReel: Array<keyof typeof REWARDS>;
      newBalance: number;
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
        return response;
      } else {
        alert("Ошибка смены автомата: " + response.error);
        restorePreviousState(currentState);
        return { success: false, error: "не успех(" };
      }
    } catch (error) {
      console.error("Ошибка смены автомата:", error);
      restorePreviousState(currentState)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Неизвестная ошибка: " + error,
      };
    }

    function restorePreviousState(state: {
      reel: Array<keyof typeof REWARDS>;
      color: string;
      betStep: number;
      lastWin: number;
      maxWin: number;
    }) {
      setReel(state.reel);
      setColor(state.color);
      setBetStep(state.betStep);
      setLastWin(state.lastWin);
      setMaxWin(state.maxWin);
      console.log("🤡 Состояние автомата восстановлено:", state.reel);
    }
  }

  return (
    <SlotContext.Provider value={slotContextValue}>
      {children}
    </SlotContext.Provider>
  );
};
