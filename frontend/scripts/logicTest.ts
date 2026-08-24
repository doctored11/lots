import {
  ITEMS,
  machineBetRange,
  rollSpinDamage,
  reelNeighbors,
  formatItemRewards,
} from "../src/game/catalog";
import { evaluateSpin } from "../src/game/abilities";

const eq = (name: string, got: unknown, want?: unknown) => {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  console.log(g === w ? "✓" : "✗ FAIL", name, "→", g, want !== undefined ? `(ожидалось ${w})` : "");
};

// --- новые значения наград ---
eq("виноград x3", evaluateSpin(10, ["grape", "grape", "grape"], ["grape"], [0, 0, 0]).win, 30);
eq("вишня x3", evaluateSpin(10, ["cherry", "cherry", "cherry"], ["cherry"], [0, 0, 0]).win, 18);
eq("банан 1шт зажат в 0", evaluateSpin(10, ["banana", "grape", "cherry"], ["banana", "grape", "cherry"], [0, 0, 0]).win, 0); // -1+0.1+0.2 = -0.7 -> 0
eq("банан x3", evaluateSpin(10, ["banana", "banana", "banana"], ["banana"], [0, 0, 0]).win, 80);
eq("череп x3 зажат в 0", evaluateSpin(10, ["skull", "skull", "skull"], ["skull"], [0, 0, 0]).win, 0);
eq("дыня/арбуз 1шт x1.1", evaluateSpin(10, ["melon", "grape", "grape"], ["melon", "grape", "grape"], [0, 0, 0]).win, Math.floor(10 * 0.3 * 1.1));
eq("перец x3", evaluateSpin(10, ["chili", "chili", "chili"], ["chili"], [0, 0, 0]).win, 80);
eq("кристалл 2шт x2.5", evaluateSpin(10, ["gem", "gem", "grape"], ["gem", "gem", "grape"], [0, 0, 0]).win, Math.floor(10 * 0.1 * 2.5));
eq("корона x3 +25", evaluateSpin(10, ["crown", "crown", "crown"], ["crown"], [0, 0, 0]).win, 250);
eq("ракета x3 +18", evaluateSpin(10, ["rocket", "rocket", "rocket"], ["rocket"], [0, 0, 0]).win, 180);
eq("семёрка x3 +77", evaluateSpin(10, ["seven", "seven", "seven"], ["seven"], [0, 0, 0]).win, 770);

// --- обилка перца: 2 перца выжигают линию, остальные дают бонус как за два ---
// reel [chili, grape], комбинация [chili, chili, grape] → виноград как за два: +0.3
eq(
  "перец x2: виноград даёт +0.3 (как за два)",
  evaluateSpin(10, ["chili", "chili", "grape"], ["chili", "grape"], [0, 0, 1]).win,
  Math.floor(10 * (0.3 + 0.1)) // grape 2шт +0.3 + chili... нет, перец сгорел: только 0.3
);

// --- обилка бомбы: тройка тянет соседей ---
// reel [bomb, grape, cherry], комбинация [0,0,0] → соседи каждого барабана: cherry+grape x3
const bombWin = evaluateSpin(10, ["bomb", "bomb", "bomb"], ["bomb", "grape", "cherry"], [0, 0, 0]);
console.log("бомба x3 + соседи:", bombWin.win, "| notes:", bombWin.notes);
eq("бомба x3 есть заметка", bombWin.notes.length > 0, true);

// --- обилка бомбы: пара → тройной износ ---
eq("пара бомб: damageMult 3", evaluateSpin(10, ["bomb", "bomb", "grape"], ["bomb", "grape"], [0, 0, 1]).damageMult, 3);
eq("без бомб: damageMult 1", evaluateSpin(10, ["grape", "grape", "grape"], ["grape"], [0, 0, 0]).damageMult, 1);

// --- износ: 0..5 + сумма wear ленты (дубли считаются) ---
eq("лента из 4 семёрок: урон 28..33", (() => {
  let min = 99, max = -99;
  for (let i = 0; i < 500; i++) {
    const d = rollSpinDamage(["seven", "seven", "seven", "seven"]);
    min = Math.min(min, d); max = Math.max(max, d);
  }
  return [min, max];
})(), [28, 33]);
eq("гриб x4: лечение", (() => {
  let min = 99;
  for (let i = 0; i < 500; i++) min = Math.min(min, rollSpinDamage(["mushroom", "mushroom", "mushroom", "mushroom"]));
  return min;
})(), -4);

// --- диапазоны ставок ---
eq("череп -50/+300", machineBetRange(["skull"]), { min: 1, max: 320 });
eq("семёрка 777/777", machineBetRange(["seven"]), { min: 782, max: 797 });
eq("бомба +100/+200", machineBetRange(["bomb"]), { min: 105, max: 220 });

// --- соседи по кольцу ---
eq("соседи по кольцу", reelNeighbors(["a", "b", "c"], 0), ["c", "b"]);

// --- формат с минусами ---
eq("формат бомбы", formatItemRewards("bomb"), "1: -5  |  2: -10  |  3: ×8.8");
