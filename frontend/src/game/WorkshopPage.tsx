import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useGame } from "./GameContext";
import {
  ITEMS,
  ALL_ITEM_KEYS,
  ECONOMY,
  RARITY_LABELS,
  formatItemRewards,
  rollItemDrop,
} from "./catalog";
import styles from "./workshopPage.module.css";

// случайный предмет для ленты кейса (визуально честный — те же веса)
function randomCaseItem(): string {
  return rollItemDrop();
}

// пример награды с реальными числами предмета: "пример: ставка 10, 3 шт → 200"
function rewardExample(itemKey: string): string {
  const item = ITEMS[itemKey];
  if (!item) return "";
  const bet = 10;
  const parts = ([1, 2, 3] as const).map((count) => {
    const v = item.values[count];
    const win =
      v.type === "plus" ? Math.floor(bet * v.amount) : Math.floor(bet * v.factor);
    return `${count} шт → ${win}`;
  });
  return `Пример при ставке ${bet}: ` + parts.join(" · ");
}

// тултип с расширенной подсказкой по лоту (показывается при наведении)
function ItemTooltip({
  itemKey,
  unlocked,
}: {
  itemKey: string;
  unlocked: boolean;
}) {
  const item = ITEMS[itemKey];
  if (!item) return null;
  return (
    <div className={styles.tooltip} onClick={(e) => e.stopPropagation()}>
      <div className={styles.tooltipTitle}>
        {unlocked ? item.label : "???"}
      </div>
      <div className={`${styles.tooltipRarity} ${styles["rarity_" + item.rarity]}`}>
        {RARITY_LABELS[item.rarity]}
      </div>
      <div className={styles.tooltipRow}>
        Ставка автомата:{" "}
        <b>
          {item.betMinMod >= 0 ? `+${item.betMinMod}` : item.betMinMod} к мин ·{" "}
          {item.betMaxMod >= 0 ? `+${item.betMaxMod}` : item.betMaxMod} к макс
        </b>
      </div>
      <div className={styles.tooltipRow}>
        Износ автомата: <b>+{item.wear}</b>
      </div>
      {unlocked ? (
        <>
          <div className={styles.tooltipRow}>
            Награды: <b>{formatItemRewards(itemKey)}</b>
          </div>
          <div className={styles.tooltipNote}>
            +N — добавка к ставке, ×N — множитель ставки. Выигрыш = ставка ×
            (сумма +) × (произведение ×).
          </div>
          <div className={styles.tooltipNote}>
            {rewardExample(itemKey)}
          </div>
          <div className={styles.tooltipDesc}>{item.desc}</div>
        </>
      ) : (
        <div className={styles.tooltipDesc}>
          Свойства скрыты. Выбей комбинацию из трёх таких на барабанах, чтобы
          открыть описание и награды.
        </div>
      )}
    </div>
  );
}

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

  // прокрутка кейса
  const [caseItems, setCaseItems] = useState<string[]>([]);
  const [caseRolling, setCaseRolling] = useState(false);
  const [caseOffset, setCaseOffset] = useState(0);
  const caseWinItem = useRef<string | null>(null);

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

  const CASE_LENGTH = 40; // предметов в ленте
  const CASE_WIN_INDEX = 34; // позиция выигрышного (под стоп-линией)
  const CASE_ITEM_W = 84; // ширина карточки в ленте, px

  const handleShopRoll = () => {
    if (caseRolling) return;
    const res = game.shopRollPreview();
    if (res.error) {
      setShopResult(null);
      setMessage("❌ " + res.error);
      return;
    }
    setMessage("");
    setShopResult(null);
    caseWinItem.current = res.item!;

    // лента: случайные предметы, на выигрышной позиции — наш
    const strip: string[] = [];
    for (let i = 0; i < CASE_LENGTH; i++) {
      strip.push(i === CASE_WIN_INDEX ? res.item! : randomCaseItem());
    }
    // мгновенный сброс ленты в начало (transition выключен, т.к. caseRolling=false)
    setCaseItems(strip);
    setCaseOffset(0);

    // старт анимации на следующий кадр, чтобы transition сработал
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCaseRolling(true);
        // останавливаемся так, чтобы выигрышный был под центром + лёгкий разброс
        const jitter = (Math.random() - 0.5) * (CASE_ITEM_W * 0.6);
        const viewportW = 3 * CASE_ITEM_W; // видно ~3 карточки
        const target =
          CASE_WIN_INDEX * CASE_ITEM_W - (viewportW - CASE_ITEM_W) / 2 + jitter;
        setCaseOffset(-target);
      });
    });

    // применяем результат после остановки ленты (4.5s transition)
    setTimeout(() => {
      game.applyShopRoll(res.item!);
      setShopResult(res.item!);
      setCaseRolling(false);
    }, 4700);
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
                  {RARITY_LABELS[item.rarity]} · ставка{" "}
                  {item.betMinMod >= 0 ? `+${item.betMinMod}` : item.betMinMod}/
                  {item.betMaxMod >= 0 ? `+${item.betMaxMod}` : item.betMaxMod}
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
                <ItemTooltip itemKey={key} unlocked={unlocked} />
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>🎒 Инвентарь</h2>
        {Object.keys(game.inventory).length === 0 && (
          <p className={styles.hint}>
            Пусто. Открывай кейсы в магазине — предметы только оттуда.
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
            >
              <div className={styles.cardImg}>
                <ItemVisual itemKey={key} size={56} />
              </div>
              <div className={styles.cardTitle}>{ITEMS[key].label}</div>
              <div className={styles.cardRarity}>×{count}</div>
              <ItemTooltip
                itemKey={key}
                unlocked={game.unlockedRecipes.includes(key)}
              />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>🎰 Сборка автомата</h2>
        <p className={styles.hint}>
          Лента из {ECONOMY.reelMin}–{ECONOMY.reelMax} предметов, сборка стоит{" "}
          {ECONOMY.buildCost} монет. Предметы остаются у тебя, но сгорают, если
          автомат сломается (HP = 0). Текущая лента:{" "}
          {game.reel.map((k) => ITEMS[k].label).join(", ")}
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
          Собрать автомат ({draft.length}/{ECONOMY.reelMax}) —{" "}
          {ECONOMY.buildCost} 💰
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section>
        <h2>🛒 Магазин</h2>
        <p className={styles.hint}>
          Кейс за {ECONOMY.shopRollCost} монет — случайный предмет в коллекцию.
          Редкие падают реже.
        </p>

        {(caseRolling || caseItems.length > 0) && (
          <div className={styles.caseViewport}>
            <div className={styles.caseMarker}></div>
            <div
              className={styles.caseStrip}
              style={{
                transform: `translateX(${caseOffset}px)`,
                transition: caseRolling
                  ? "transform 4.5s cubic-bezier(0.08, 0.6, 0.08, 1)"
                  : "none",
              }}
            >
              {caseItems.map((key, i) => (
                <div
                  key={i}
                  className={`${styles.caseItem} ${
                    styles["rarity_" + ITEMS[key].rarity]
                  }`}
                >
                  <ItemVisual itemKey={key} size={48} />
                  <span className={styles.caseItemLabel}>
                    {ITEMS[key].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={styles.buildBtn}
          onClick={handleShopRoll}
          disabled={game.balance < ECONOMY.shopRollCost || caseRolling}
        >
          {caseRolling
            ? "Крутится…"
            : `🎲 Открыть кейс (${ECONOMY.shopRollCost})`}
        </button>
        {shopResult && !caseRolling && (
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
