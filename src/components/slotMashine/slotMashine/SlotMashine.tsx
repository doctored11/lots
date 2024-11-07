import React, { createContext, useContext, useEffect, useState } from "react";
import { MashineBody } from "./mashineBody/MashineBody";
import { PlayerContext } from "../../../PlayerContext";
import { REWARDS } from "constants/drumConstants";
import { SlotContext, SlotProvider } from "./SlotContext";

interface SlotContextType {
  betStep: number;
  betInGame: number;
  combination: Array<number | null>;
  mode: string;
  reel: Array<keyof typeof REWARDS>;
  rollCount: number;
  setCombination: (combination: Array<number | null>) => void;
}

export function SlotMashine() {
  const player = useContext(PlayerContext);
  const mashine = useContext(SlotContext);

  useEffect(() => mashine?.reelUpdate(), []);
  return (
    <>
      <p>Баланс: {player?.balance}</p>
      <div>SlotMashine</div>
      <MashineBody />
    </>
  );
}
