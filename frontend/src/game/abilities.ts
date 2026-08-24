// Обилки лотов — отдельный модуль, по классу на обилку.
// Чтобы добавить новую: наследуешь Ability, пишешь apply() и регистрируешь в ABILITIES.
// Расчёт спина сам их подхватывает — движок трогать не надо.

import { ITEMS, reelNeighbors } from "./catalog";

// что известно об одном прокруте
export interface SpinContext {
  reel: string[];        // лента автомата
  combination: number[]; // индексы выпавших позиций на барабанах
  results: string[];     // выпавшие ключи предметов
}

// накапливаемый результат: обилки пишут сюда
export interface WinBreakdown {
  plus: number;       // сумма всех "+"
  multiply: number;   // произведение всех "×"
  damageMult: number; // множитель урона автомату за этот прокрут
  notes: string[];    // человекочитаемые заметки (для UI/логов)
}

export function emptyBreakdown(): WinBreakdown {
  return { plus: 0, multiply: 1, damageMult: 1, notes: [] };
}

export abstract class Ability {
  // ключ лота-носителя обилки (бомба, перец...)
  constructor(public readonly itemKey: string) {}
  // сколько экземпляров лота на линии активирует обилку
  abstract readonly triggerCount: number;

  matches(ctx: SpinContext): boolean {
    return (
      ctx.results.filter((r) => r === this.itemKey).length === this.triggerCount
    );
  }

  abstract apply(bd: WinBreakdown, ctx: SpinContext): void;
}

// награда одного лота за count экземпляров пишется в breakdown
export function addReward(bd: WinBreakdown, itemKey: string, count: 1 | 2 | 3) {
  const reward = ITEMS[itemKey]?.values[count];
  if (!reward) return;
  if (reward.type === "plus") bd.plus += reward.amount;
  else bd.multiply *= reward.factor;
}

// --- обилка бомбы: три бомбы тянут соседей сверху/снизу на каждом барабане,
// каждый сосед даёт свой потенциал за тройку
export class BombChainAbility extends Ability {
  readonly triggerCount = 3;
  apply(bd: WinBreakdown, ctx: SpinContext) {
    ctx.combination.forEach((idx) => {
      reelNeighbors(ctx.reel, idx).forEach((neighbor) => {
        addReward(bd, neighbor, 3);
      });
    });
    bd.notes.push("💣 бомбы потянули соседей сверху/снизу");
  }
}

// --- обилка бомбы: пара бомб — тройной износ за прокрут
export class BombPairDamageAbility extends Ability {
  readonly triggerCount = 2;
  apply(bd: WinBreakdown) {
    bd.damageMult *= 3;
    bd.notes.push("💣💣 пара бомб: тройной износ");
  }
}

// --- обилка перца: два перца выжигают свою линию — сами ничего не дают,
// зато каждый другой предмет на линии даёт бонус как за два
export class PepperBurnAbility extends Ability {
  readonly triggerCount = 2;
  apply(bd: WinBreakdown, ctx: SpinContext) {
    ctx.results.forEach((r) => {
      if (r === this.itemKey) return; // перец сгорел
      addReward(bd, r, 2); // остальные — бонус как за два
    });
    bd.notes.push("🌶🌶 перец выжег линию: остальные дают бонус за два");
  }
}

// реестр обилок — сюда добавляются новые
export const ABILITIES: Ability[] = [
  new BombChainAbility("bomb"),
  new BombPairDamageAbility("bomb"),
  new PepperBurnAbility("chili"),
];

// полный расчёт прокрута: базовые награды + обилки.
// Написан так, чтобы в будущем принимать несколько лент/автоматов —
// SpinContext расширяется, движок не меняется.
export function evaluateSpin(
  bet: number,
  results: string[],
  reel: string[],
  combination: number[]
): { win: number; damageMult: number; notes: string[] } {
  const bd = emptyBreakdown();

  // базовые награды по количеству одинаковых
  const counts: Record<string, number> = {};
  results.forEach((s) => {
    counts[s] = (counts[s] || 0) + 1;
  });
  Object.entries(counts).forEach(([symbol, count]) => {
    addReward(bd, symbol, count as 1 | 2 | 3);
  });

  // обилки
  const ctx: SpinContext = { reel, combination, results };
  for (const ability of ABILITIES) {
    if (ability.matches(ctx)) ability.apply(bd, ctx);
  }

  const win = Math.max(0, Math.floor(bet * (bd.plus || 1) * bd.multiply));
  return { win, damageMult: bd.damageMult, notes: bd.notes };
}
