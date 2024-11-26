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
  getNewMachine: (chatId: string, balance: number) => Promise<void>;
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

  const initializeSlot = async (chatId: string) => {
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
    const storedChatId = localStorage.getItem("chatId");
    if (storedChatId) {
      initializeSlot(storedChatId);
    } else {
      setLoading(false); 
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

  async function getNewMachine(chatId: string, balance: number) {
    try {
      const response = await changeMachine(chatId, balance);
      if (response.success) {
        setReel(response.data.newReel);
        setBetStep(10);
        setLastWin(0);
        setMaxWin(0);
        console.log("Новая лента автомата:", response.data.newReel);
      } else {
        alert("Ошибка смены автомата: " + response.error);
      }
    } catch (error) {
      console.error("Ошибка смены автомата:", error);
    }
  }
  
  return (
    <SlotContext.Provider value={slotContextValue}>
      {children}
    </SlotContext.Provider>
  );
};

