import { useState, useContext } from "react";
import { SlotContext, useSlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../../PlayerContext";
import { useGameAPI } from "../../../../../api/useLotsAPI";
import { REWARDS } from "../../../../../lots/constants/drumConstants";

export function useMashineLogic() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);
  const { spinSlots } = useGameAPI();

  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);

  const [pendingBalance, setPendingBalance] = useState<number | null>(null);
  const slot = useSlotContext();

  const applyPendingState = () => {
    console.log("автомат pending = ", slot.pendingState);
    if (slot.pendingState) {
      slot.setReel(slot.pendingState.newReel);
      slot.setBetStep(slot.pendingState.newBetStep);
      slot.setLastWin(0);
      slot.setMaxWin(0);
      slot.setColor(slot.pendingState.newColor);
      slot.setRollCount(slot.pendingState.newLives);
      player?.setBalance(slot.pendingState.newBalance);
      console.log("Новая лента автомата:", slot.pendingState.newReel);
      slot.setPendingState(null);
    }
  };

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
        const {
          combination,
          newBalance,
          machineLives,
          droppedItem,
          unlockedRecipeItem,
          broken,
        } = response.data;

        console.log("🤔 Новая комбинация:", combination);
        console.log("Новый баланс (ожидается):", newBalance);

        setSpinValues(combination);
        setPendingBalance(newBalance);
        slotMashine.setMachineLives(machineLives);
        if (droppedItem) slotMashine.setLastDrop(droppedItem);
        if (unlockedRecipeItem) slotMashine.setLastUnlock(unlockedRecipeItem);
        if (broken) {
          console.log("💥 Автомат сломался (0 HP), нужен ремонт");
          playBreakAnimation();
        }
        console.log("HP автомата", machineLives);
      } else {
        if (response.broken) {
          playBreakAnimation();
        }
        alert("Ошибка: " + response.error);
        slotMashine.setIsSpinning(false);
      }
    } catch (err) {
      console.error("Ошибка спина:", err);
      slotMashine?.setIsSpinning(false);
    } finally {
      slotMashine?.setBetInGame(0);
    }
  }

  // взрыв при поломке: показываем анимацию и возвращаем автомат на место
  function playBreakAnimation() {
    if (!slotMashine) return;
    slotMashine.startExplosionAnimation();
    setTimeout(() => {
      const mashineView = document.getElementById("mashine");
      if (mashineView) mashineView.style.opacity = "1";
      slotMashine.setIsAnimating(false);
    }, 1500);
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
