import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlayerContext } from "../../../PlayerContext";
import { useGameAPI } from "../../../api/useLotsAPI";
import { REWARDS } from "../../constants/drumConstants";
import {
  ITEM_RARITY,
  RARITY_LABELS,
  ITEM_LABELS,
  RECIPE_DESCRIPTIONS,
  formatRewards,
  Rarity,
} from "../../constants/itemMeta";
import styles from "./workshopPage.module.css";

type ItemKey = keyof typeof REWARDS;

interface InventoryEntry {
  item: ItemKey;
  count: number;
  rarity: Rarity;
}

interface BookEntry {
  item: ItemKey;
  rarity: Rarity;
  unlocked: boolean;
}

export function WorkshopPage() {
  const player = useContext(PlayerContext);
  const { getInventory, getRecipeBook, buildMachine, shopRoll } = useGameAPI();

  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [book, setBook] = useState<BookEntry[]>([]);
  const [draft, setDraft] = useState<ItemKey[]>([]);
  const [message, setMessage] = useState("");
  const [shopResult, setShopResult] = useState<ItemKey | null>(null);
  const [shopRolling, setShopRolling] = useState(false);

  const chatId = player?.chatId;

  const loadData = async () => {
    if (!chatId) return;
    const [invResp, bookResp] = await Promise.all([
      getInventory(chatId),
      getRecipeBook(chatId),
    ]);
    if (invResp.success) setInventory(invResp.data);
    if (bookResp.success) setBook(bookResp.data);
  };

  useEffect(() => {
    loadData();
  }, [chatId]);

  const invCount = (item: ItemKey) =>
    inventory.find((e) => e.item === item)?.count ?? 0;

  const draftCount = (item: ItemKey) => draft.filter((d) => d === item).length;

  const addToDraft = (item: ItemKey) => {
    if (draft.length >= 8) return;
    if (draftCount(item) >= invCount(item)) return;
    setDraft([...draft, item]);
  };

  const removeFromDraft = (index: number) => {
    setDraft(draft.filter((_, i) => i !== index));
  };

  const handleBuild = async () => {
    if (!chatId || draft.length < 4) return;
    const resp = await buildMachine(chatId, draft);
    if (resp.success) {
      setMessage("✅ Автомат собран! Новая лента установлена.");
      setDraft([]);
      await loadData();
    } else {
      setMessage("❌ " + (resp.error || "Ошибка сборки"));
    }
  };

  const handleShopRoll = async () => {
    if (!chatId || !player || shopRolling) return;
    setShopRolling(true);
    setShopResult(null);
    const resp = await shopRoll(chatId, player.balance);
    if (resp.success) {
      player.setBalance(resp.data.newBalance);
      setShopResult(resp.data.item as ItemKey);
      await loadData();
    } else {
      setMessage("❌ " + (resp.error || "Ошибка прокрута магазина"));
    }
    setShopRolling(false);
  };

  const allItems = Object.keys(REWARDS) as ItemKey[];

  return (
    <div className={styles.workshop}>
      <div className={styles.topBar}>
        <Link to="/lots" className={styles.backLink}>
          ← к автомату
        </Link>
        <Link to="/" className={styles.backLink}>
          ⌂ на главную
        </Link>
      </div>
      <h1>🔧 Мастерская</h1>

      <section>
        <h2>📖 Книга рецептов</h2>
        <p className={styles.hint}>
          Описание открывается, когда на барабанах выпадает три одинаковых
          предмета.
        </p>
        <div className={styles.grid}>
          {allItems.map((item) => {
            const entry = book.find((b) => b.item === item);
            const unlocked = entry?.unlocked ?? false;
            const rarity = ITEM_RARITY[item];
            return (
              <div
                key={item}
                className={`${styles.card} ${styles["rarity_" + rarity]} ${
                  unlocked ? "" : styles.locked
                }`}
              >
                <img
                  src={REWARDS[item].image}
                  alt={ITEM_LABELS[item]}
                  className={styles.cardImg}
                />
                <div className={styles.cardTitle}>
                  {unlocked ? ITEM_LABELS[item] : "???"}
                </div>
                <div className={styles.cardRarity}>{RARITY_LABELS[rarity]}</div>
                <div className={styles.cardDesc}>
                  {unlocked
                    ? RECIPE_DESCRIPTIONS[item]
                    : "Выбей три таких подряд, чтобы узнать свойства."}
                </div>
                {unlocked && (
                  <div className={styles.cardRewards}>
                    {formatRewards(item)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>🎒 Инвентарь</h2>
        {inventory.length === 0 && (
          <p className={styles.hint}>
            Пусто. Крути автомат — предметы падают за каждый спин.
          </p>
        )}
        <div className={styles.grid}>
          {inventory.map(({ item, count, rarity }) => (
            <button
              key={item}
              className={`${styles.card} ${styles.invCard} ${
                styles["rarity_" + rarity]
              }`}
              onClick={() => addToDraft(item)}
              disabled={draftCount(item) >= count || draft.length >= 8}
              title="Нажми, чтобы добавить в ленту"
            >
              <img
                src={REWARDS[item].image}
                alt={ITEM_LABELS[item]}
                className={styles.cardImg}
              />
              <div className={styles.cardTitle}>{ITEM_LABELS[item]}</div>
              <div className={styles.cardRarity}>×{count}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>🎰 Сборка автомата</h2>
        <p className={styles.hint}>
          Лента из 4–8 предметов. Предметы расходуются. Автомат крутится
          только из твоих предметов.
        </p>
        <div className={styles.draftLine}>
          {draft.length === 0 && (
            <span className={styles.hint}>
              Кликай по предметам инвентаря…
            </span>
          )}
          {draft.map((item, i) => (
            <img
              key={i}
              src={REWARDS[item].image}
              alt={ITEM_LABELS[item]}
              className={styles.draftImg}
              onClick={() => removeFromDraft(i)}
              title="Нажми, чтобы убрать"
            />
          ))}
        </div>
        <button
          className={styles.buildBtn}
          disabled={draft.length < 4}
          onClick={handleBuild}
        >
          Собрать автомат ({draft.length}/8)
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section>
        <h2>🛒 Магазин</h2>
        <p className={styles.hint}>
          Прокрут за 1000 монет — случайный предмет в коллекцию. Редкие
          падают реже.
        </p>
        <button
          className={styles.buildBtn}
          onClick={handleShopRoll}
          disabled={shopRolling || !player || player.balance < 1000}
        >
          {shopRolling ? "Крутится…" : "🎲 Крутануть (1000)"}
        </button>
        {shopResult && (
          <div
            className={`${styles.shopResult} ${
              styles["rarity_" + ITEM_RARITY[shopResult]]
            }`}
          >
            Выпал:
            <img
              src={REWARDS[shopResult].image}
              alt={ITEM_LABELS[shopResult]}
              className={styles.dropImg}
            />
            {ITEM_LABELS[shopResult]} ({RARITY_LABELS[ITEM_RARITY[shopResult]]})
          </div>
        )}
      </section>
    </div>
  );
}
