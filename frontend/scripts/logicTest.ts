import { ITEMS, calculateWinnings, machineBetRange, rollSpinDamage, reelNeighbors, formatItemRewards } from '../src/game/catalog';

const eq = (name: string, got: unknown, want?: unknown) =>
  console.log(
    JSON.stringify(got) === JSON.stringify(want) ? "✓" : "✗ FAIL",
    name,
    "→",
    got,
    want !== undefined ? `(ожидалось ${want})` : ""
  );

// --- новые значения наград ---
eq("банан 1шт (зажат в 0)", calculateWinnings(10, ["banana", "grape", "cherry"]), 0);
eq("банан 3шт", calculateWinnings(10, ["banana", "banana", "banana"]), 100);
eq("череп 3шт (зажат в 0)", calculateWinnings(10, ["skull", "skull", "skull"]), 0);
eq("дыня 1шт x0.8", calculateWinnings(10, ["melon", "grape", "grape"]), Math.floor(10 * 0.3 * 0.8));
eq("перец 3шт +8", calculateWinnings(10, ["chili", "chili", "chili"]), 80);
eq("самоцвет 2шт x2.5", calculateWinnings(10, ["gem", "gem", "grape"]), Math.floor(10 * 0.1 * 2.5));
eq("корона 3шт +25", calculateWinnings(10, ["crown", "crown", "crown"]), 250);
eq("бомба 1шт -5 (зажат в 0)", calculateWinnings(10, ["bomb", "grape", "cherry"]), 0);
eq("бомба 2шт -10 (зажат в 0)", calculateWinnings(10, ["bomb", "bomb", "grape"]), 0);

// --- бомба: тройка тянет соседей ---
// лента [bomb, grape, cherry] — у каждого барабана соседи bomb-образные
// reel=[bomb(0), grape(1), cherry(2)], комбинация [0,0,0] → соседи (cherry,grape) x3
eq(
  "бомба x3 + соседи (cherry/grape по тройке каждый)",
  calculateWinnings(10, ["bomb", "bomb", "bomb"], ["cherry", "grape", "cherry", "grape", "cherry", "grape"]),
  Math.floor(10 * 8.8 * (2.2 * 3 + 5.5 * 3))
);
// (totalPlus||1): 8.8 — это множитель, соседи: 3x cherry тройка (+2.2), 3x grape тройка (+5.5) → плюс=23.1, множ=8.8 → 10*23.1*8.8=2032.8→2032

// --- диапазоны ставок ---
eq("череп: мин -5", machineBetRange(["skull"]).min, 1); // 5-5=0 → зажато в 1
eq("череп: макс +30", machineBetRange(["skull"]).max, 50);
eq("корона: макс +90", machineBetRange(["crown"]).max, 110);
eq("самоцвет: +8/-10", machineBetRange(["gem"]), { min: 13, max: 10 }); // min>max → max зажат в min

// --- износ/лечение ---
eq("гриб лечит: урон может быть < 0", (() => {
  // много прогонов, лента из 4 грибов: 0..5 -4 → от -4 до 1
  let min = 99, max = -99;
  for (let i = 0; i < 500; i++) {
    const d = rollSpinDamage(0, ["mushroom", "mushroom", "mushroom", "mushroom"]);
    min = Math.min(min, d); max = Math.max(max, d);
  }
  return [min, max];
})(), [-4, 1]);
eq("семёрка: урон 5..10", (() => {
  let min = 99, max = -99;
  for (let i = 0; i < 500; i++) {
    const d = rollSpinDamage(0, ["seven"]);
    min = Math.min(min, d); max = Math.max(max, d);
  }
  return [min, max];
})(), [5, 10]);

// --- соседи по кольцу ---
eq("соседи по кольцу", reelNeighbors(["a", "b", "c"], 0), ["c", "b"]);

// --- формат с минусами ---
eq("формат бомбы", formatItemRewards("bomb"), "1: -5  |  2: -10  |  3: ×8.8");

eq("бомба 2шт + виноград x3 остаётся в плюсе", calculateWinnings(10, ["bomb", "bomb", "grape"], ["grape","grape","grape","grape","grape","grape"]), Math.floor(10 * (-10 + 0.1 + 5.5*6)));
