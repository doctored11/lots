import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useGameAPI } from "./api/useLotsAPI";

interface PlayerContextType {
  balance: number;
  chatId: string | null;
  setChatId: (chatId: string) => void;
  addBalance: (amount: number) => void;
  minusBalance: (amount: number) => boolean;
  canSpend: (amount: number) => boolean;
  loading: boolean;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(100);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); 
  const { getPlayerInfo,initializePlayer } = useGameAPI();

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

  // const initializePlayer = async (chatId: string) => {
  //   try {
  //     setLoading(true); 
  //     const response = await getPlayerInfo(chatId);
  //     if (response.success) {
  //       setChatId(chatId);
  //       setBalance(response.data.balance);
  //       localStorage.setItem("chatId", chatId); 
  //     } else {
  //       console.error("Ошибка загрузки игрока:", response.error);
  //     }
  //   } catch (error) {
  //     console.error("Ошибка инициализации игрока:", error);
  //   } finally {
  //     setLoading(false); 
  //   }
  // };

  const canSpend = (amount: number) => balance >= amount;

  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (chatId) {
          const response = await initializePlayer(chatId);
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
  };

  return (
    <PlayerContext.Provider value={playerContextValue}>
      {loading ? <div>Загрузка...</div> : children}
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
