import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import { useGameAPI } from "./api/useLotsAPI";

interface PlayerContextType {
  balance: number;
  chatId: string | null;
  setChatId: (chatId: string) => void;
  addBalance: (amount: number) => void;
  minusBalance: (amount: number) => boolean;
  canSpend: (amount: number) => boolean;
  loading: boolean;
  setBalance: Dispatch<SetStateAction<number>>;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(
  undefined
);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(100);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { getPlayerInfo, initializePlayer } = useGameAPI();

  const addBalance = (amount: number) => {
    setBalance((prevBalance) => prevBalance + amount);
  };

  const minusBalance = (amount: number) => {
    if (balance >= amount) {
      setBalance((prevBalance) => prevBalance - amount);
      return true;
    } else {
      console.log("Недостаточно средств");
      return false;
    }
  };

  const canSpend = (amount: number) => balance >= amount;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const chatId = tg.initDataUnsafe.user.id;
      console.log("Инициализация chatId:", chatId);
      setChatId(chatId + "");
      setUserName(tg.initDataUnsafe.user.username || null);
    } else {
      console.error("Ошибка инициализации Telegram WebApp");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (chatId) {
          const response = await initializePlayer(chatId, userName);
          if (response.success) {
            console.log("Пользователь успешно инициализирован:", response.data);
            setBalance(response.data.balance);
          } else {
            console.error("Ошибка инициализации пользователя:", response.error);
          }
        }
      } catch (error) {
        console.error("Ошибка во время инициализации:", error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchData();
    }
  }, [chatId]);

  const playerContextValue: PlayerContextType = {
    balance,
    chatId,
    addBalance,
    minusBalance,
    canSpend,
    setChatId,
    loading,
    setBalance,
  };

  return (
    <PlayerContext.Provider value={playerContextValue}>
      {/* TODO */}
      {/* пока в dev - так то раскоментить + лоадер или страница адрес -> tg */}
      {/* {loading ? <div>Загрузка...</div> : children} */}
      {children} 
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("нет PlayerProvider");
  }
  return context;
};
