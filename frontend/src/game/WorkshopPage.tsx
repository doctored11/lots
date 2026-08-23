import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "./GameContext";
import {
  ITEMS,
  ALL_ITEM_KEYS,
  ECONOMY,
  RARITY_LABELS,
  formatItemRewards,
} from "./catalog";
import styles from "./workshopPage.module.css";

function ItemVisual({ itemKey, size }: { itemKey: string; size: number }) {
  const item = ITEMS[itemKey];
  if (!item) return null;
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.label}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: size * 0.7,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {item.emoji}
    </div>
  );
}

export function WorkshopPage() {
  const game = useGame();
  const [draft, setDraft] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [shopResult, setShopResult] = useState<string | null>(null);

  const invCount = (key: string) => game.inventory[key] ?? 0;
  const draftCount = (key: string) => draft.filter((d) => d === key).length;

  const addToDraft = (key: string) => {
    if (draft.length >= ECONOMY.reelMax) return;
    if (draftCount(key) >= invCount(key)) return;
    setDraft([...draft, key]);
  };

  const removeFromDraft = (index: number) => {
    setDraft(draft.filter((_, i) => i !== index));
  };

  const handleBuild = () => {
    const err = game.buildMachine(draft);
    if (err) {
      setMessage("❌ " + err);
    } else {
      setMessage("✅ Автомат собран! Лента установлена, HP полный.");
      setDraft([]);
    }
  };

  const handleShopRoll = () => {
    const res = game.shopRoll();
    if (res.error) {
      setShopResult(null);
      setMessage("❌ " + res.error);
    } else if (res.item) {
      setMessage("");
      setShopResult(res.item);
    }
  };

  return (
    <div className={styles.workshop}>
      <div className={styles.topBar}>
        <Link to="/" className={styles.backLink}>
          ← к автомату
        </Link>
        <span className={styles.balance}>💰 {game.balance}</span>
      </div>
      <h1>🔧 Мастерская</h1>

      <section>
        <h2>📖 Книга рецептов</h2>
        <p className={styles.hint}>
          Описание открывается, когда на барабанах выпадает три одинаковых
          предмета.
        </p>
        <div className={styles.grid}>
          {ALL_ITEM_KEYS.map((key) => {
            const item = ITEMS[key];
            const unlocked = game.unlockedRecipes.includes(key);
            return (
              <div
                key={key}
                className={`${styles.card} ${styles["rarity_" + item.rarity]} ${
                  unlocked ? "" : styles.locked
                }`}
              >
                <div className={styles.cardImg}>
                  <ItemVisual itemKey={key} size={56} />
                </div>
                <div className={styles.cardTitle}>
                  {unlocked ? item.label : "???"}
                </div>
                <div className={styles.cardRarity}>
                  {RARITY_LABELS[item.rarity]} · цена {item.spinCost}
                </div>
                <div className={styles.cardDesc}>
                  {unlocked
                    ? item.desc
                    : "Выбей три таких подряд, чтобы узнать свойства."}
                </div>
                {unlocked && (
                  <div className={styles.cardRewards}>
                    {formatItemRewards(key)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>🎒 Инвентарь</h2>
        {Object.keys(game.inventory).length === 0 && (
          <p className={styles.hint}>
            Пусто. Крути автомат — предметы падают за каждый спин.
          </p>
        )}
        <div className={styles.grid}>
          {Object.entries(game.inventory).map(([key, count]) => (
            <button
              key={key}
              className={`${styles.card} ${styles.invCard} ${
                styles["rarity_" + ITEMS[key].rarity]
              }`}
              onClick={() => addToDraft(key)}
              disabled={
                draftCount(key) >= count || draft.length >= ECONOMY.reelMax
              }
              title="Нажми, чтобы добавить в ленту"
            >
              <div className={styles.cardImg}>
                <ItemVisual itemKey={key} size={56} />
              </div>
              <div className={styles.cardTitle}>{ITEMS[key].label}</div>
              <div className={styles.cardRarity}>×{count}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>🎰 Сборка автомата</h2>
        <p className={styles.hint}>
          Лента из {ECONOMY.reelMin}–{ECONOMY.reelMax} предметов. Предметы
          расходуются. Цена прокрута и выигрыши зависят от вставленных лотов.
          Текущая лента: {game.reel.map((k) => ITEMS[k].label).join(", ")}
        </p>
        <div className={styles.draftLine}>
          {draft.length === 0 && (
            <span className={styles.hint}>Кликай по предметам инвентаря…</span>
          )}
          {draft.map((key, i) => (
            <span
              key={i}
              className={styles.draftItem}
              onClick={() => removeFromDraft(i)}
              title="Нажми, чтобы убрать"
            >
              <ItemVisual itemKey={key} size={44} />
            </span>
          ))}
        </div>
        <button
          className={styles.buildBtn}
          disabled={draft.length < ECONOMY.reelMin}
          onClick={handleBuild}
        >
          Собрать автомат ({draft.length}/{ECONOMY.reelMax})
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section>
        <h2>🛒 Магазин</h2>
        <p className={styles.hint}>
          Прокрут за {ECONOMY.shopRollCost} монет — случайный предмет в
          коллекцию. Редкие падают реже.
        </p>
        <button
          className={styles.buildBtn}
          onClick={handleShopRoll}
          disabled={game.balance < ECONOMY.shopRollCost}
        >
          🎲 Крутануть ({ECONOMY.shopRollCost})
        </button>
        {shopResult && (
          <div
            className={`${styles.shopResult} ${
              styles["rarity_" + ITEMS[shopResult].rarity]
            }`}
          >
            Выпал:
            <ItemVisual itemKey={shopResult} size={28} />
            {ITEMS[shopResult].label} ({RARITY_LABELS[ITEMS[shopResult].rarity]})
          </div>
        )}
      </section>
    </div>
  );
}
