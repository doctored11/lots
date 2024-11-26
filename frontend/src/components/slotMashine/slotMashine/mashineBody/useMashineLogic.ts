import { useState, useContext } from "react";
import { SlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../PlayerContext";
import { useGameAPI } from "../../../../api/useLotsAPI";

export function useMashineLogic() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);
  const { spinSlots } = useGameAPI();

  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingBalance, setPendingBalance] = useState<number | null>(null);

  async function startSpin() {
    try {
      if (!player || !slotMashine) return;
      setIsSpinning(true);
      const response = await spinSlots(
        player.chatId,
        slotMashine.betInGame,
        player.balance+ slotMashine.betInGame,
      );
      if (response.success) {
        const { combination, newBalance } = response.data;

        console.log("🤔 Новая комбинация:", combination);
        console.log("Новый баланс (ожидается):", newBalance);

        setSpinValues(combination);
        setPendingBalance(newBalance);
      } else {
        alert("Ошибка: " + response.error);
      }
    } catch (err) {
      console.error("Ошибка спина:", err);
    } finally {
      slotMashine?.setBetInGame(0);
    }
  }

  function onSpinEnd() {
    if (pendingBalance !== null && player) {
      console.log("✔️ Анимация завершена. Обновляем баланс и слот.");
      const winValue = pendingBalance - player.balance
      player.addBalance(winValue);
      slotMashine?.updateSlotScore(winValue);
      slotMashine?.setBetInGame(0);
      setPendingBalance(null);
    }
    setIsSpinning(false);
  }

  return {
    spinValues,
    isSpinning,
    startSpin,
    onSpinEnd,
  };
}
