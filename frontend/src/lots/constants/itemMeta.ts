
  import { REWARDS } from "./drumConstants";

  // редкость предметов (совпадает с бэкендом gameLogic.ITEM_RARITY)
  export type Rarity = "common" | "uncommon" | "rare" | "legendary";

  export const ITEM_RARITY: Record<keyof typeof REWARDS, Rarity> = {
    grape: "common",
    cherry: "common",
    mushroom: "uncommon",
    melon: "uncommon",
    banana: "uncommon",
    clover: "rare",
    blueBerrie: "rare",
    bomb: "legendary",
  };

  export const RARITY_LABELS: Record<Rarity, string> = {
    common: "Обычный",
    uncommon: "Необычный",
    rare: "Редкий",
    legendary: "Легендарный",
  };

  // отображаемые названия предметов
  export const ITEM_LABELS: Record<keyof typeof REWARDS, string> = {
    bomb: "Бомба",
    clover: "Клевер",
    grape: "Виноград",
    mushroom: "Гриб",
    melon: "Дыня",
    cherry: "Вишня",
    banana: "Банан",
    blueBerrie: "Черника",
  };

  // описания из книги рецептов — видны только после тройки одинаковых
  export const RECIPE_DESCRIPTIONS: Record<keyof typeof REWARDS, string> = {
    bomb: "Сердце автомата. Три бомбы взрывают выигрыш до x8.8 — автомат такое переживает с трудом.",
    clover: "Счастливый клевер. Уже один-два множат ставку, а три приносят +72 сверху.",
    grape: "Обычный виноград. Скромный, но падает чаще всех. Три грозди — +5.5 к ставке.",
    mushroom: "Лесной гриб. Три штуки дают +4 к ставке. Грибник одобряет.",
    melon: "Сочная дыня. Одна почти ничего не стоит, но три — это +7.7.",
    cherry: "Вишенка на барабане. Уже одна даёт +0.4, три — +2.2.",
    banana: "Банан. Скользкий фрукт: пара даёт +0.5, тройка — целых +10.",
    blueBerrie: "Редкая черника. Три ягоды — +16.6 к ставке. Охотники за ягодами понимают.",
  };
