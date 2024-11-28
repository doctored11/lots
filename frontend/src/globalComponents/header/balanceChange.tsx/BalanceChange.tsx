import React, { useEffect, useState, useRef } from "react";
import styles from "./balanceChange.module.css";

interface BalanceChangeProps {
  change: number;
  onRemove: () => void; 
}

export function BalanceChange({ change, onRemove }: BalanceChangeProps) {
  const [animate, setAnimate] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const removeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const delay = change > 0 ? 400 : 10; 
    animationTimeoutRef.current = setTimeout(() => setAnimate(true), delay);

    visibilityTimeoutRef.current = setTimeout(
      () => setIsVisible(false),
      change > 0 ? 900 : 300
    );
    removeTimeoutRef.current = setTimeout(onRemove, change > 0 ? 1200 : 550);

    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
    };
  }, []); 

  return (
    <div
      className={`${styles.balanceChange} ${animate ? (change > 0 ? styles.up : styles.down) : ""}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {change > 0 ? `+${change}` : `${change}`}
    </div>
  );
}
