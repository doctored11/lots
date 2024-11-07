interface RewardValuePlus {
    type: "plus";
    amount: number;
  }
  
  interface RewardValueMultiply {
    type: "multiply";
    factor: number;
  }
  
  type RewardValue = RewardValuePlus | RewardValueMultiply;
  
  interface Reward {
    image: string;
    values: {
      1: RewardValue;
      2: RewardValue;
      3: RewardValue;
    };
  }
  
  interface Rewards {
    bomb: Reward;
    clover: Reward;
    grape: Reward;
    mushroom: Reward;
  }
  
  export const REWARDS: Rewards = {
    bomb: {
      image: "../source/bomb.png",
      values: {
        1: { type: "plus", amount: 3 },
        2: { type: "plus", amount: 8 },
        3: { type: "plus", amount: 88 }
      }
    },
    clover: {
      image: "../source/clover.png",
      values: {
        1: { type: "multiply", factor: 2 },
        2: { type: "multiply", factor: 6 },
        3: { type: "plus", amount: 600 }
      }
    },
    grape: {
      image: "../source/grape.png",
      values: {
        1: { type: "plus", amount: 1 },
        2: { type: "plus", amount: 2 },
        3: { type: "plus", amount: 100 }
      }
    },
    mushroom: {
      image: "../source/mushrum_v1.png",
      values: {
        1: { type: "plus", amount: 1 },
        2: { type: "plus", amount: 4 },
        3: { type: "plus", amount: 40 }
      }
    }
  };
  