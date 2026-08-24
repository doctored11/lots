// Каталог предметов (лотов) и вся экономика игры v3 — клиентская, без бэкенда.
// Картинки есть только у старых 8 предметов; новые показываются эмодзи-плейсхолдером.

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export type RewardValue =
  | { type: "plus"; amount: number }
  | { type: "multiply"; factor: number };

export interface ItemDef {
  key: string;
  label: string;
  emoji: string; // плейсхолдер, пока нет отрисованной картинки
  image?: string; // путь до png (dist/source/*)
  rarity: Rarity;
  spinCost: number; // вклад предмета в цену прокрута автомата
  wear: number; // вклад предмета в износ автомата за прокрут
  betMinMod: number; // сдвиг минимальной ставки автомата
  betMaxMod: number; // сдвиг максимальной ставки автомата
  values: { 1: RewardValue; 2: RewardValue; 3: RewardValue };
  desc: string; // открывается в книге рецептов после тройки
}

const img = (name: string) => `source/${name}.png`;

export const ITEMS: Record<string, ItemDef> = {
  // --- старые (с картинками) ---
  grape: {
    key: "grape", label: "Виноград", emoji: "🍇", image: img("grape"),
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: 0, betMaxMod: 5,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.3 }, 3: { type: "plus", amount: 5.5 } },
    desc: "Скромный, но падает чаще всех. Три грозди — +5.5 к ставке.",
  },
  cherry: {
    key: "cherry", label: "Вишня", emoji: "🍒", image: img("cherry"),
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: 0, betMaxMod: 5,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.5 }, 3: { type: "plus", amount: 2.2 } },
    desc: "Вишенка на барабане. Уже одна даёт +0.2, три — +2.2.",
  },
  banana: {
    key: "banana", label: "Банан", emoji: "🍌", image: img("banana"),
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: 0, betMaxMod: 8,
    values: { 1: { type: "plus", amount: 0.0 }, 2: { type: "plus", amount: 0.5 }, 3: { type: "plus", amount: 10 } },
    desc: "Скользкий фрукт: пара даёт +0.5, тройка — целых +10.",
  },
  mushroom: {
    key: "mushroom", label: "Гриб", emoji: "🍄", image: img("mushrum_v1"),
    rarity: "uncommon", spinCost: 2,
    wear: 0,
    betMinMod: 0, betMaxMod: 10,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 4 } },
    desc: "Лесной гриб. Три штуки дают +4 к ставке.",
  },
  melon: {
    key: "melon", label: "Дыня", emoji: "🍈", image: img("melon"),
    rarity: "uncommon", spinCost: 2,
    wear: 0,
    betMinMod: 0, betMaxMod: 12,
    values: { 1: { type: "plus", amount: 0.0 }, 2: { type: "plus", amount: 0.2 }, 3: { type: "plus", amount: 7.7 } },
    desc: "Сочная дыня. Одна почти ничего не стоит, но три — это +7.7.",
  },
  clover: {
    key: "clover", label: "Клевер", emoji: "🍀", image: img("clover"),
    rarity: "rare", spinCost: 5,
    wear: 1,
    betMinMod: 2, betMaxMod: 18,
    values: { 1: { type: "multiply", factor: 1.3 }, 2: { type: "multiply", factor: 2 }, 3: { type: "plus", amount: 12 } },
    desc: "Счастливый клевер. Уже один множит ставку, а три приносят +12 сверху.",
  },
  blueBerrie: {
    key: "blueBerrie", label: "Черника", emoji: "🫐", image: img("blueBerrie"),
    rarity: "rare", spinCost: 5,
    wear: 1,
    betMinMod: 2, betMaxMod: 20,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.5 }, 3: { type: "plus", amount: 16.6 } },
    desc: "Редкая черника. Три ягоды — +16.6 к ставке.",
  },
  bomb: {
    key: "bomb", label: "Бомба", emoji: "💣", image: img("bomb"),
    rarity: "legendary", spinCost: 10,
    wear: 2,
    betMinMod: -5, betMaxMod: 50,
    values: { 1: { type: "plus", amount: 0.3 }, 2: { type: "plus", amount: 0.8 }, 3: { type: "multiply", factor: 8.8 } },
    desc: "Сердце автомата. Три бомбы взрывают выигрыш до ×8.8.",
  },

  // --- новые (эмодзи-плейсхолдеры, картинки будут позже) ---
  lemon: {
    key: "lemon", label: "Лимон", emoji: "🍋",
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: -1, betMaxMod: 4,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 3 } },
    desc: "Кислый, но надёжный. Три лимона — +3 к ставке.",
  },
  apple: {
    key: "apple", label: "Яблоко", emoji: "🍎",
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: 0, betMaxMod: 4,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 2.6 } },
    desc: "Простое яблоко. Одно уже даёт +0.2.",
  },
  coin: {
    key: "coin", label: "Монета", emoji: "🪙",
    rarity: "common", spinCost: 2,
    wear: 0,
    betMinMod: 1, betMaxMod: 10,
    values: { 1: { type: "plus", amount: 0.3 }, 2: { type: "plus", amount: 0.7 }, 3: { type: "plus", amount: 4 } },
    desc: "Звонкая монета. Дороже фруктов, но и отдача выше.",
  },
  bell: {
    key: "bell", label: "Колокол", emoji: "🔔",
    rarity: "common", spinCost: 2,
    wear: 0,
    betMinMod: 1, betMaxMod: 8,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.8 }, 3: { type: "plus", amount: 5 } },
    desc: "Классика жанра. Три колокола звенят на +5.",
  },
  dice: {
    key: "dice", label: "Кость", emoji: "🎲",
    rarity: "uncommon", spinCost: 3,
    wear: 1,
    betMinMod: 2, betMaxMod: 15,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "multiply", factor: 1.5 }, 3: { type: "plus", amount: 6 } },
    desc: "Игральная кость. Пара множит ставку на ×1.5.",
  },
  skull: {
    key: "skull", label: "Череп", emoji: "💀",
    rarity: "uncommon", spinCost: 3,
    wear: 1,
    betMinMod: -2, betMaxMod: 20,
    values: { 1: { type: "plus", amount: 0.0 }, 2: { type: "plus", amount: 1.0 }, 3: { type: "plus", amount: 9 } },
    desc: "Опасный символ. Одна штука пустая, зато тройка — +9.",
  },
  chili: {
    key: "chili", label: "Перец", emoji: "🌶",
    rarity: "uncommon", spinCost: 3,
    wear: 1,
    betMinMod: 1, betMaxMod: 12,
    values: { 1: { type: "plus", amount: 0.3 }, 2: { type: "plus", amount: 0.6 }, 3: { type: "multiply", factor: 3 } },
    desc: "Острый перец. Три штуки утраивают выигрыш.",
  },
  star: {
    key: "star", label: "Звезда", emoji: "⭐",
    rarity: "rare", spinCost: 6,
    wear: 1,
    betMinMod: 3, betMaxMod: 25,
    values: { 1: { type: "multiply", factor: 1.2 }, 2: { type: "plus", amount: 2 }, 3: { type: "plus", amount: 20 } },
    desc: "Счастливая звезда. Три звезды — +20 к ставке.",
  },
  gem: {
    key: "gem", label: "Самоцвет", emoji: "💎",
    rarity: "rare", spinCost: 6,
    wear: 1,
    betMinMod: 3, betMaxMod: 30,
    values: { 1: { type: "plus", amount: 0.4 }, 2: { type: "multiply", factor: 2.5 }, 3: { type: "multiply", factor: 5 } },
    desc: "Драгоценность. Пара множит ×2.5, тройка — ×5.",
  },
  rocket: {
    key: "rocket", label: "Ракета", emoji: "🚀",
    rarity: "rare", spinCost: 7,
    wear: 1,
    betMinMod: 4, betMaxMod: 30,
    values: { 1: { type: "plus", amount: 0.5 }, 2: { type: "plus", amount: 1.5 }, 3: { type: "plus", amount: 25 } },
    desc: "На луну! Три ракеты — +25 к ставке.",
  },
  seven: {
    key: "seven", label: "Семёрка", emoji: "7️⃣",
    rarity: "legendary", spinCost: 12,
    wear: 2,
    betMinMod: 5, betMaxMod: 40,
    values: { 1: { type: "plus", amount: 0.7 }, 2: { type: "multiply", factor: 3 }, 3: { type: "plus", amount: 77 } },
    desc: "Легендарная семёрка. Три семёрки — +77. Джекпот классики.",
  },
  crown: {
    key: "crown", label: "Корона", emoji: "👑",
    rarity: "legendary", spinCost: 15,
    wear: 2,
    betMinMod: 8, betMaxMod: 60,
    values: { 1: { type: "multiply", factor: 1.5 }, 2: { type: "multiply", factor: 4 }, 3: { type: "multiply", factor: 12 } },
    desc: "Королевская корона. Даже одна множит ставку ×1.5, тройка — ×12.",
  },
};

export const ALL_ITEM_KEYS = Object.keys(ITEMS);

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Обычный",
  uncommon: "Необычный",
  rare: "Редкий",
  legendary: "Легендарный",
};

// --- экономика (все числа крутятся тут) ---

export const ECONOMY = {
  startBalance: 500,
  startHp: 100,
  maxHp: 100,
  repairCost: 50,     // цена ремонта
  repairAmount: 10,   // +HP за ремонт
  shopRollCost: 1000, // цена прокрута магазина (гача)
  buildCost: 200,   // плата за сборку автомата — чтобы не перестраивали часто
  reelMin: 4,
  reelMax: 8,
  baseSpinCost: 5,    // базовая минимальная ставка
  baseBetMax: 20,     // базовая максимальная ставка
  spinDamageBase: 5,  // урон за прокрут: 0..5 + износ
  wearEverySpins: 25, // каждые N прокрутов +1 к износу
  spinDamageCap: 12,
  startInventory: ["grape", "grape", "cherry", "banana"] as string[],
  startReel: ["grape", "grape", "cherry", "banana"] as string[],
};

// случайный редкий предмет в стартовый набор
export function rollStarterRare(): string {
  const rares = Object.values(ITEMS)
    .filter((i) => i.rarity === "rare")
    .map((i) => i.key);
  return rares[getRandomInt(0, rares.length - 1)];
}

// вес дропа по редкости
const RARITY_DROP_WEIGHT: Record<Rarity, number> = {
  common: 50,
  uncommon: 28,
  rare: 16,
  legendary: 6,
};

// --- чистая логика ---

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// диапазон ставки конкретной ленты: база + модификаторы предметов
export function machineBetRange(reel: string[]): { min: number; max: number } {
  let min = ECONOMY.baseSpinCost;
  let max = ECONOMY.baseBetMax;
  reel.forEach((key) => {
    const item = ITEMS[key];
    if (!item) return;
    min += item.betMinMod;
    max += item.betMaxMod;
  });
  min = Math.max(1, min);
  max = Math.max(min, max);
  return { min, max };
}

// минимальная цена прокрута (ставка по умолчанию = минимум диапазона)
export function machineSpinCost(reel: string[]): number {
  return machineBetRange(reel).min;
}

// выигрыш по выпавшим символам (та же формула, что была на бэкенде)
export function calculateWinnings(bet: number, results: string[]): number {
  let totalPlus = 0;
  let totalMultiply = 1;

  const counts: Record<string, number> = {};
  results.forEach((s) => {
    counts[s] = (counts[s] || 0) + 1;
  });

  Object.entries(counts).forEach(([symbol, count]) => {
    const reward = ITEMS[symbol]?.values[count as 1 | 2 | 3];
    if (!reward) return;
    if (reward.type === "plus") totalPlus += reward.amount;
    else totalMultiply *= reward.factor;
  });

  return Math.floor(bet * (totalPlus || 1) * totalMultiply);
}

// урон автомату за прокрут: 0..5 + износ от предметов ленты + растущий износ
export function rollSpinDamage(spinsDone: number, reel: string[] = []): number {
  const itemsWear = reel.reduce((sum, key) => sum + (ITEMS[key]?.wear ?? 0), 0);
  const wear = Math.floor(spinsDone / ECONOMY.wearEverySpins);
  return Math.min(
    ECONOMY.spinDamageCap,
    getRandomInt(0, ECONOMY.spinDamageBase) + itemsWear + wear
  );
}

// случайный предмет (дроп за спин / гача магазина)
export function rollItemDrop(): string {
  const pool: string[] = [];
  Object.values(ITEMS).forEach((item) => {
    for (let i = 0; i < RARITY_DROP_WEIGHT[item.rarity]; i++) pool.push(item.key);
  });
  return pool[getRandomInt(0, pool.length - 1)];
}

// строка наград для книги рецептов: "1: +0.1 · 2: +0.3 · 3: +5.5"
// "+N" — добавка к ставке, "×N" — множитель ставки
export function formatItemRewards(key: string): string {
  const values = ITEMS[key]?.values;
  if (!values) return "";
  return ([1, 2, 3] as const)
    .map((count) => {
      const v = values[count];
      const text = v.type === "plus" ? `+${v.amount}` : `×${v.factor}`;
      return `${count}: ${text}`;
    })
    .join(" · ");
}
