// todo вынести в константы числа

const REWARDS = {
    bomb: { values: { 1: { type: 'plus', amount: 0.3 }, 2: { type: 'plus', amount: 0.8 }, 3: { type: 'multiply', factor: 8.8 } } },
    clover: { values: { 1: { type: 'multiply', factor: 3 }, 2: { type: 'multiply', factor: 7 }, 3: { type: "plus", amount: 72 } } },
    grape: { values: { 1: { type: 'plus', amount: 0.1 }, 2: { type: 'plus', amount: 0.2 }, 3: { type: 'plus', amount: 5.5 } } },
    mushroom: { values: { 1: { type: 'plus', amount: 0.1 }, 2: { type: 'plus', amount: 0.4 }, 3: { type: "plus", amount: 4 } } },
    melon: {
        values: {
            1: { type: "plus", amount: 0.0 },
            2: { type: "plus", amount: 0.2 },
            3: { type: "plus", amount: 7.7 }
        }
    },
    cherry: {
        values: {
            1: { type: "plus", amount: 0.4 },
            2: { type: "plus", amount: 0.8 },
            3: { type: "plus", amount: 2.2 }
        }
    },
    banana: {
        values: {
            1: { type: "plus", amount: 0.0 },
            2: { type: "plus", amount: 0.5 },
            3: { type: "plus", amount: 10 }
        }
    },
    blueBerrie: {
        values: {
            1: { type: "plus", amount: 0.1 },
            2: { type: "plus", amount: 0.5 },
            3: { type: "plus", amount: 16.6 }
        }
    },
};



function calculateWinnings(bet, results) {
    let totalPlus = 0;
    let totalMultiply = 1;

    const counts = results.reduce((acc, symbol) => {
        acc[symbol] = (acc[symbol] || 0) + 1;
        return acc;
    }, {});

    Object.entries(counts).forEach(([symbol, count]) => {
        const rewardKey = symbol;
        console.log("rewardKey", rewardKey, REWARDS[rewardKey]?.values)
        const rewardValues = REWARDS[rewardKey]?.values;
        const reward = rewardValues?.[count];

        if (!reward) return;

        if (reward.type === 'plus') {
            totalPlus += reward.amount;
        } else if (reward.type === 'multiply') {
            totalMultiply *= reward.factor;
        }
    });

    return Math.floor(bet * (totalPlus || 1) * totalMultiply); //было ceil
}




function generateNewReel() {
    const DRUM_CHANCES = {
        bomb: {
            priority: 2,
            maxCount: 1
        },
        clover: {
            priority: 3,
            maxCount: 2
        },
        grape: {
            priority: 10,
            maxCount: 3
        },
        mushroom: {
            priority: 6,
            maxCount: 4
        },
        melon: {
            priority: 6,
            maxCount: 2
        },
        cherry: {
            priority: 4,
            maxCount: 2
        },
        banana: {
            priority: 4,
            maxCount: 2
        },
        blueBerrie: {
            priority: 1,
            maxCount: 1
        },
    };

    const newReel = [];
    const weightedItems = [];

    Object.entries(DRUM_CHANCES).forEach(([item, { priority, maxCount }]) => {
        for (let i = 0; i < priority; i++) {
            weightedItems.push(item);
        }
    });

    weightedItems.sort(() => Math.random() - 0.5);

    const itemCount = {};
    Object.keys(DRUM_CHANCES).forEach(key => {
        itemCount[key] = 0;
    });

    const elCount = getRandomInt(5, 8);
    while (newReel.length < elCount) {
        const randomIndex = getRandomInt(0, weightedItems.length - 1);
        const selectedItem = weightedItems[randomIndex];

        if (itemCount[selectedItem] < DRUM_CHANCES[selectedItem].maxCount) {
            newReel.push(selectedItem);
            itemCount[selectedItem] = (itemCount[selectedItem] || 0) + 1;
        }
    }
    console.log("колесико обновлено, ", elCount, newReel);
    return newReel;

}

function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color + 'f0'; 
}



function generateRandomBetStep() {
    return getRandomInt(2, 10) * 5;
}

function generateRandomLives() {
    // return getRandomInt(30, 100);
    return getRandomInt(5, 10);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
module.exports = { calculateWinnings, generateRandomColor, generateRandomBetStep, generateRandomLives, generateNewReel };
