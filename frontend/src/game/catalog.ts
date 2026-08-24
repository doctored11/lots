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
  wear: number; // вклад предмета в износ автомата за прокрут (отрицательный = лечит)
  betMinMod: number; // сдвиг минимальной ставки автомата
  betMaxMod: number; // сдвиг максимальной ставки автомата
  values: { 1: RewardValue; 2: RewardValue; 3: RewardValue; 4: RewardValue; 5: RewardValue };
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
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.3 }, 3: { type: "plus", amount: 3 }, 4: { type: "plus", amount: 5 }, 5: { type: "plus", amount: 8 } },
    desc: "Скромный, но падает чаще всех. Три грозди — +3 к ставке.",
  },
  cherry: {
    key: "cherry", label: "Вишня", emoji: "🍒", image: img("cherry"),
    rarity: "common", spinCost: 1,
    wear: 2,
    betMinMod: 5, betMaxMod: 222,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.5 }, 3: { type: "plus", amount: 1.8 }, 4: { type: "plus", amount: 3 }, 5: { type: "plus", amount: 5 } },
    desc: "Вишенка на барабане. Раздвигает ставки (+5/+222), но грызёт прочность (+2 износа).",
  },
  banana: {
    key: "banana", label: "Банан", emoji: "🍌", image: img("banana"),
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: 0, betMaxMod: 10,
    values: { 1: { type: "plus", amount: -1 }, 2: { type: "plus", amount: 0.1 }, 3: { type: "plus", amount: 8 }, 4: { type: "plus", amount: 14 }, 5: { type: "plus", amount: 22 } },
    desc: "Скользкий фрукт: один — минус 1, пара +0.1, тройка +8.",
  },
  mushroom: {
    key: "mushroom", label: "Гриб", emoji: "🍄", image: img("mushrum_v1"),
    rarity: "uncommon", spinCost: 2,
    wear: -1,
    betMinMod: -20, betMaxMod: 30,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 1.8 }, 4: { type: "plus", amount: 3 }, 5: { type: "plus", amount: 5 } },
    desc: "Целебный гриб: восполняет 1 HP автомату за прокрут и снижает мин. ставку (-20).",
  },
  melon: {
    key: "melon", label: "Дыня", emoji: "🍈", image: img("melon"),
    rarity: "uncommon", spinCost: 2,
    wear: 3,
    betMinMod: -10, betMaxMod: 10,
    values: { 1: { type: "multiply", factor: 1.1 }, 2: { type: "plus", amount: 1 }, 3: { type: "plus", amount: 6 }, 4: { type: "plus", amount: 10 }, 5: { type: "plus", amount: 16 } },
    desc: "Арбуз. Одна штука чуть усиливает выигрыш (x1.1), три — +6.",
  },
  clover: {
    key: "clover", label: "Клевер", emoji: "🍀", image: img("clover"),
    rarity: "rare", spinCost: 5,
    wear: 2,
    betMinMod: 50, betMaxMod: 50,
    values: { 1: { type: "multiply", factor: 1.3 }, 2: { type: "multiply", factor: 2.5 }, 3: { type: "plus", amount: 12 }, 4: { type: "plus", amount: 20 }, 5: { type: "plus", amount: 35 } },
    desc: "Счастливый клевер: один x1.3, пара x2.5, тройка +12. Ставки +50/+50.",
  },
  blueBerrie: {
    key: "blueBerrie", label: "Черника", emoji: "🫐", image: img("blueBerrie"),
    rarity: "rare", spinCost: 5,
    wear: 1,
    betMinMod: 10, betMaxMod: 100,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 17.7 }, 4: { type: "plus", amount: 28 }, 5: { type: "plus", amount: 45 } },
    desc: "Редкая черника. Три ягоды — +17.7. Потолок ставки +100.",
  },
  bomb: {
    key: "bomb", label: "Бомба", emoji: "💣", image: img("bomb"),
    rarity: "legendary", spinCost: 10,
    wear: 5,
    betMinMod: 100, betMaxMod: 200,
    values: { 1: { type: "plus", amount: -5 }, 2: { type: "plus", amount: -10 }, 3: { type: "multiply", factor: 8.8 }, 4: { type: "multiply", factor: 14 }, 5: { type: "multiply", factor: 22 } },
    desc: "Опасна! 1 шт -5, пара -10 и тройной износ. Три бомбы: x8.8 и каждая тянет соседей на барабане — их бонус за тройку. Ставки +100/+200, износ +5.",
  },

  // --- новые (эмодзи-плейсхолдеры, картинки будут позже) ---
  lemon: {
    key: "lemon", label: "Лимон", emoji: "🍋",
    rarity: "common", spinCost: 1,
    wear: 1,
    betMinMod: -10, betMaxMod: 10,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 3 }, 4: { type: "plus", amount: 5 }, 5: { type: "plus", amount: 8 } },
    desc: "Кислый, но надёжный. Три лимона — +3.",
  },
  apple: {
    key: "apple", label: "Яблоко", emoji: "🍎",
    rarity: "common", spinCost: 1,
    wear: 0,
    betMinMod: -50, betMaxMod: -10,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.4 }, 3: { type: "plus", amount: 2.6 }, 4: { type: "plus", amount: 4.2 }, 5: { type: "plus", amount: 7 } },
    desc: "Простое яблоко. Сужает ставки (-50/-10) — играть мелко.",
  },
  coin: {
    key: "coin", label: "Монета", emoji: "🪙",
    rarity: "common", spinCost: 2,
    wear: 1,
    betMinMod: -10, betMaxMod: -100,
    values: { 1: { type: "plus", amount: 0.3 }, 2: { type: "plus", amount: 0.7 }, 3: { type: "plus", amount: 4 }, 4: { type: "plus", amount: 7 }, 5: { type: "plus", amount: 12 } },
    desc: "Звонкая монета. Режет макс. ставку (-100).",
  },
  bell: {
    key: "bell", label: "Колокол", emoji: "🔔",
    rarity: "common", spinCost: 2,
    wear: 2,
    betMinMod: 0, betMaxMod: 10,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "plus", amount: 0.8 }, 3: { type: "plus", amount: 4 }, 4: { type: "plus", amount: 7 }, 5: { type: "plus", amount: 12 } },
    desc: "Классика жанра. Три колокола — +4.",
  },
  dice: {
    key: "dice", label: "Кость", emoji: "🎲",
    rarity: "uncommon", spinCost: 3,
    wear: 1,
    betMinMod: 20, betMaxMod: 50,
    values: { 1: { type: "plus", amount: 0.2 }, 2: { type: "multiply", factor: 1.5 }, 3: { type: "plus", amount: 6 }, 4: { type: "plus", amount: 10 }, 5: { type: "plus", amount: 16 } },
    desc: "Игральная кость. Пара множит x1.5.",
  },
  skull: {
    key: "skull", label: "Череп", emoji: "💀",
    rarity: "uncommon", spinCost: 3,
    wear: 0,
    betMinMod: -50, betMaxMod: 300,
    values: { 1: { type: "plus", amount: -0.1 }, 2: { type: "plus", amount: 0 }, 3: { type: "plus", amount: -5 }, 4: { type: "plus", amount: -12 }, 5: { type: "plus", amount: -30 } },
    desc: "Пассивка: мин. ставка -50, макс. +300, износа нет. Но выпадения почти всегда в минус.",
  },
  chili: {
    key: "chili", label: "Перец", emoji: "🌶",
    rarity: "uncommon", spinCost: 3,
    wear: 2,
    betMinMod: 10, betMaxMod: 20,
    values: { 1: { type: "plus", amount: 0.1 }, 2: { type: "plus", amount: 0 }, 3: { type: "plus", amount: 8 }, 4: { type: "plus", amount: 14 }, 5: { type: "plus", amount: 22 } },
    desc: "Острый перец. Пара выжигает свою линию: остальные предметы на линии дают бонус как за два. Три штуки — +8.",
  },
  star: {
    key: "star", label: "Звезда", emoji: "⭐",
    rarity: "rare", spinCost: 6,
    wear: 1,
    betMinMod: 5, betMaxMod: 25,
    values: { 1: { type: "multiply", factor: 1.2 }, 2: { type: "plus", amount: 2 }, 3: { type: "plus", amount: 20 }, 4: { type: "plus", amount: 35 }, 5: { type: "plus", amount: 55 } },
    desc: "Счастливая звезда. Три звезды — +20.",
  },
  gem: {
    key: "gem", label: "Самоцвет", emoji: "💎",
    rarity: "rare", spinCost: 6,
    wear: 3,
    betMinMod: 40, betMaxMod: 330,
    values: { 1: { type: "plus", amount: 1 }, 2: { type: "multiply", factor: 2.5 }, 3: { type: "plus", amount: 10 }, 4: { type: "plus", amount: 18 }, 5: { type: "plus", amount: 30 } },
    desc: "Кристалл: 1 шт +1, пара x2.5, тройка +10. Ставки +40/+330, износ +3.",
  },
  rocket: {
    key: "rocket", label: "Ракета", emoji: "🚀",
    rarity: "rare", spinCost: 7,
    wear: 5,
    betMinMod: 500, betMaxMod: 1000,
    values: { 1: { type: "plus", amount: 0.5 }, 2: { type: "plus", amount: 1.5 }, 3: { type: "plus", amount: 18 }, 4: { type: "plus", amount: 30 }, 5: { type: "plus", amount: 50 } },
    desc: "На луну! Ставки +500/+1000, износ +5. Три ракеты — +18.",
  },
  seven: {
    key: "seven", label: "Семёрка", emoji: "7️⃣",
    rarity: "legendary", spinCost: 12,
    wear: 7,
    betMinMod: 777, betMaxMod: 777,
    values: { 1: { type: "plus", amount: 0.7 }, 2: { type: "multiply", factor: 3 }, 3: { type: "plus", amount: 77 }, 4: { type: "plus", amount: 150 }, 5: { type: "plus", amount: 300 } },
    desc: "Легендарная семёрка. Ставки +777/+777, износ 7 за прокрут. Три семёрки — +77.",
  },
  crown: {
    key: "crown", label: "Корона", emoji: "👑",
    rarity: "legendary", spinCost: 15,
    wear: 4,
    betMinMod: 400, betMaxMod: 450,
    values: { 1: { type: "multiply", factor: 1.5 }, 2: { type: "multiply", factor: 4 }, 3: { type: "plus", amount: 25 }, 4: { type: "plus", amount: 45 }, 5: { type: "plus", amount: 70 } },
    desc: "Королевская корона. Ставки +400/+450. Одна x1.5, пара x4, тройка +25.",
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
  newMachineCost: 1000, // новый автомат вместо сломанного (чинить нельзя)
  shopRollCost: 1000, // цена прокрута магазина (гача)
  buildCost: 200,   // плата за сборку автомата — чтобы не перестраивали часто
  reelMin: 4,
  reelMax: 8,
  baseSpinCost: 5,    // базовая минимальная ставка
  baseBetMax: 20,     // базовая максимальная ставка
  spinDamageBase: 5,  // урон за прокрут: 0..5 + износ
  // покупка дополнительных автоматов: 10к, дальше по экспоненте
  extraMachineBaseCost: 10000,
  extraMachineGrowth: 2,
  // улучшение: +1 лента (макс 5). Первое — 100к + рандом до 300к
  maxReels: 5,
  reelUpgradeBase: 100000,
  reelUpgradeRandom: 200000,
  reelUpgradeGrowth: 2,
  // улучшение макс. HP автомата
  hpUpgradeStep: 50,       // +50 к макс. HP за уровень
  hpUpgradeBaseCost: 5000, // первый уровень 5к, дальше ×1.8
  hpUpgradeGrowth: 1.8,
  startInventory: ["grape", "grape", "cherry", "banana"] as string[],
  startReel: ["grape", "grape", "cherry", "banana"] as string[],
};

// --- генератор имён автоматов: прилагательное + животное + 3 цифры ---
const MACHINE_ADJ = [
  "Гневный", "Сонный", "Хитрый", "Дерзкий", "Пьяный", "Космический",
  "Злой", "Добрый", "Шальной", "Ленивый", "Голодный", "Сумасшедший",
];
const MACHINE_ANIMAL = [
  "Барсук", "Енот", "Капибара", "Выдра", "Панда", "Ленивец",
  "Тапир", "Ёж", "Крот", "Сурок", "Лис", "Хорёк",
];

export function generateMachineName(): string {
  const adj = MACHINE_ADJ[getRandomInt(0, MACHINE_ADJ.length - 1)];
  const animal = MACHINE_ANIMAL[getRandomInt(0, MACHINE_ANIMAL.length - 1)];
  const num = getRandomInt(100, 999);
  return `${adj} ${animal}-${num}`;
}

// случайный цвет корпуса автомата
export function generateMachineColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[getRandomInt(0, 15)];
  return color + "f0";
}

// цена следующего дополнительного автомата (по экспоненте от уже имеющихся)
export function extraMachineCost(ownedCount: number): number {
  return ECONOMY.extraMachineBaseCost * Math.pow(ECONOMY.extraMachineGrowth, ownedCount - 1);
}

// цена улучшения ленты для уровня (с 3 лент — базовый автомат)
export function reelUpgradeCost(currentReels: number, rng: () => number = Math.random): number {
  if (currentReels >= ECONOMY.maxReels) return Infinity;
  const level = currentReels - 2; // 3 ленты = уровень 1
  const base = ECONOMY.reelUpgradeBase + Math.floor(rng() * ECONOMY.reelUpgradeRandom);
  return Math.floor(base * Math.pow(ECONOMY.reelUpgradeGrowth, level - 1));
}

// цена улучшения HP для уровня
export function hpUpgradeCost(hpLevel: number): number {
  return Math.floor(ECONOMY.hpUpgradeBaseCost * Math.pow(ECONOMY.hpUpgradeGrowth, hpLevel));
}

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

// выигрыш по выпавшим символам: сначала суммируются "+", потом перемножаются "×"
// (минусы и деления тоже работают на ставку, но итог не уходит ниже нуля:
//  максимум что теряется — сама ставка, списанная при нажатии на рычаг)
// bonusTriples — предметы, засчитанные как тройки (механика бомбы: соседние ряды)
export function calculateWinnings(
  bet: number,
  results: string[],
  bonusTriples: string[] = []
): number {
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

  // бонусные предметы считаются как их награда за тройку
  bonusTriples.forEach((symbol) => {
    const reward = ITEMS[symbol]?.values[3];
    if (!reward) return;
    if (reward.type === "plus") totalPlus += reward.amount;
    else totalMultiply *= reward.factor;
  });

  const win = Math.floor(bet * (totalPlus || 1) * totalMultiply);
  return Math.max(0, win); // выигрыш не бывает отрицательным
}

// соседи по барабану: предметы выше и ниже выпавшего (лента закольцована)
export function reelNeighbors(reel: string[], index: number): string[] {
  const len = reel.length;
  return [reel[(index - 1 + len) % len], reel[(index + 1) % len]];
}

// износ за прокрут: рандом 0..5 + гарантированный износ всех лотов ленты
// (включая дубли; предметы с отрицательным износом лечат)
export function rollSpinDamage(reel: string[] = []): number {
  const itemsWear = reel.reduce((sum, key) => sum + (ITEMS[key]?.wear ?? 0), 0);
  return getRandomInt(0, ECONOMY.spinDamageBase) + itemsWear;
}

// случайный предмет (гача магазина)
export function rollItemDrop(): string {
  const pool: string[] = [];
  Object.values(ITEMS).forEach((item) => {
    for (let i = 0; i < RARITY_DROP_WEIGHT[item.rarity]; i++) pool.push(item.key);
  });
  return pool[getRandomInt(0, pool.length - 1)];
}

// строка наград для книги рецептов: "1: +0.1 | 2: +0.3 | 3: +5.5"
// "+N" — добавка к ставке, "×N" — множитель ставки
export function formatItemRewards(key: string): string {
  const values = ITEMS[key]?.values;
  if (!values) return "";
  return ([1, 2, 3] as const)
    .map((count) => {
      const v = values[count];
      const text =
        v.type === "plus"
          ? v.amount < 0
            ? `${v.amount}` // минус уже в числе
            : `+${v.amount}`
          : `×${v.factor}`;
      return `${count}: ${text}`;
    })
    .join("  |  ");
}
