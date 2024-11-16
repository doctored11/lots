import React, { createContext, useState, useContext, ReactNode } from "react";

interface PlayerContextType {
  balance: number;
  addBalance: (amount: number) => void;
  minusBalance: (amount: number) => boolean;
  canSpend: (amount: number) => boolean;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(100); 

  const addBalance = (amount: number) => {
    setBalance((prevBalance) => prevBalance + amount);
  };

  const minusBalance = (amount: number) => {
    if (balance >= amount) {
      setBalance((prevBalance) => prevBalance - amount);
      console.log( '00',balance)
      return true;
    } else {
      console.log("Недостаточно средств");
      return false;
    }
  };

  const canSpend = (amount: number) => balance >= amount;

  const playerContextValue: PlayerContextType = {
    balance,
    addBalance,
    minusBalance,
    canSpend,
  };

  return <PlayerContext.Provider value={playerContextValue}>{children}</PlayerContext.Provider>;
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("нет PlayerProvider");
  }
  return context;
};
