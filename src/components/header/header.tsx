import React, { useEffect, useState, useContext } from "react";
import { PlayerContext } from "../../PlayerContext";
import { BalanceChange } from "./balanceChange.tsx/BalanceChange";
import styles from './header.module.css'

interface BalanceChangeItem {
  id: number;
  change: number;
}

export function Header() {
  const player = useContext(PlayerContext);
  const [previousBalance, setPreviousBalance] = useState(player?.balance || 0);
  const [balanceChanges, setBalanceChanges] = useState<BalanceChangeItem[]>([]);

  useEffect(() => {
    if (player?.balance !== undefined) {
      const change = player.balance - previousBalance;
      if (change !== 0) {
        setBalanceChanges((prevChanges) => [
          ...prevChanges,
          { id: Date.now(), change }, 
        ]);
        setPreviousBalance(player.balance);
      }
    }
  }, [player?.balance, previousBalance]);

  const removeChange = (id: number) => {
    setBalanceChanges((prevChanges) => prevChanges.filter((item) => item.id !== id));
  };

  return (
    <header className={styles.header}>
      <p className={styles.balanceTxt}>Баланс: {player?.balance}</p>
      <div className={styles.balanceDeltaBlock}>
        {balanceChanges.map(({ id, change }) => (
          <BalanceChange
            key={id}
            change={change}
            onRemove={() => removeChange(id)}
          />
        ))}
      </div>
    </header>
  );
}
