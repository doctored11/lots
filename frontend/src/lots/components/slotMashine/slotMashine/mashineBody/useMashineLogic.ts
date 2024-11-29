import { useState, useContext } from "react";
import { SlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../../PlayerContext";
import { useGameAPI } from "../../../../../api/useLotsAPI";
import { ChangeMashine } from "../../../../../lots/components/changeMashine/ChangeMashine";

export function useMashineLogic() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);
  const { spinSlots } = useGameAPI();

  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);

  const [pendingBalance, setPendingBalance] = useState<number | null>(null);

  async function startSpin() {
    try {
      if (!player || !slotMashine || slotMashine.isSpinning) return;
       slotMashine.setIsSpinning(true);
      const response = await spinSlots(
        player.chatId,
        slotMashine.betInGame,
        player.balance + slotMashine.betInGame
      );
      if (response.success) {
        if (response.action === "changeMachine") {
          setPendingBalance(null);
          console.log("⚙️ смена автомата инициирована сервером");
          slotMashine.setReel(response.data.newReel);
          slotMashine.setMachineLives(response.data.newLives);
          slotMashine.setBetStep(response.data.newBetStep);
          slotMashine.setColor(response.data.newColor);
          player.setBalance(response.data.balance);
          console.log("💥", response.data);
          slotMashine.endAnimation();
          slotMashine.setIsSpinning(false);
          return;
        }
        const { combination, newBalance, machineLives } = response.data;
        //давай и тут сетить жизни автомата - позже к ним анимации добавлю

        console.log("🤔 Новая комбинация:", combination);
        console.log("Новый баланс (ожидается):", newBalance);

        setSpinValues(combination);
        setPendingBalance(newBalance);
        slotMashine.setMachineLives(machineLives);
        console.log("жизни автомата", machineLives);
      } else {
        alert("Ошибка: " + response.error);
      }
    } catch (err) {
      console.error("Ошибка спина:", err);
    } finally {
      slotMashine?.setBetInGame(0);
      slotMashine?.setIsSpinning(false);
    }
  }

  function onSpinEnd() {
    if (pendingBalance !== null && player) {
      console.log("✔️ Анимация завершена. Обновляем баланс и слот.");
      const winValue = pendingBalance - player.balance;
      player.addBalance(winValue);
      slotMashine?.updateSlotScore(winValue);
      slotMashine?.setBetInGame(0);
      setPendingBalance(null);
    }
    slotMashine?.setIsSpinning(false);
  }

  return {
    spinValues,
    isSpinning: slotMashine?.isSpinning,
    startSpin,
    onSpinEnd,
  };
}
