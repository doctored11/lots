import React, { useContext } from "react";
import { useSlotContext } from "../../components/slotMashine/slotMashine/SlotContext";
import { PlayerContext } from "../../PlayerContext";
import { useMashineLogic } from "../../components/slotMashine/slotMashine/mashineBody/useMashineLogic";

export function BetControls() {
  const { betInGame, setBetInGame, betStep } = useSlotContext();
  const player = useContext(PlayerContext);
  // const { isSpinning } = useMashineLogic();
  const { isSpinning,isAnimating } = useSlotContext();


  const increaseBet = () => {
    if (isSpinning) return;
    if (!player || !player.canSpend(betStep)) {
      alert("Без гроша и жизнь плоха, или как там в оригинале...");
      return;
    }

    player.minusBalance(betStep);
    setBetInGame(betInGame + betStep);
  };

  return (
    <div>
      {/* <p>Текущая ставка: {betInGame} монет</p> */}
      <button disabled={isSpinning||isAnimating} onClick={increaseBet}>
        +10 к ставке
      </button>
    </div>
  );
}
