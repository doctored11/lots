import { useState, useContext } from "react";
import { SlotContext, useSlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../../PlayerContext";
import { useGameAPI } from "../../../../../api/useLotsAPI";
import { ChangeMashine } from "../../../../../lots/components/changeMashine/ChangeMashine";
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

  const restorePreviousState = () => {
    console.warn("🤡 Восстановлено предыдущее состояние автомата ", slot.reel);
    slot.setReel(slot.reel);
    slot.setBetStep(slot.betStep);
    slot.setLastWin(slot.lastWin);
    slot.setMaxWin(slot.maxWin);
    slot.setColor(slot.color);
    slot.setIsAnimating(false);
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
        if (response.action === "changeMachine") {
          setPendingBalance(null);
          console.log("⚙️ смена автомата инициирована сервером");
          handleMachineChange(response.data);

          return;
        }
        const { combination, newBalance, machineLives } = response.data;
        

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
    }
  }
  function handleMachineChange(data: {
    newReel:  Array<keyof typeof REWARDS>;
    newLives: number;
    newBetStep: number;
    newColor: string;
    balance: number;
  }) {
    if(!slotMashine) return
    slotMashine.setReel(data.newReel);
    slotMashine.setMachineLives(data.newLives);
    slotMashine.setBetStep(data.newBetStep);
    slotMashine.setColor(data.newColor);
    player?.setBalance(data.balance);

    console.log("💥 Новый автомат:", data);
    slotMashine.startExplosionAnimation()

    setTimeout(() => {
      slotMashine.setIsSpinning(false);
      slotMashine.endAnimation(applyPendingState);
     
    }, 1000)
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
