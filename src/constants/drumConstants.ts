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
    melon:Reward;
    cherry:Reward;
    banana:Reward;
    blueBerrie:Reward;
  }
  
  export const REWARDS: Rewards = {
    bomb: {
      image: "../source/bomb.png",
      values: {
        1: { type: "plus", amount: 0.3 },
        2: { type: "plus", amount: 0.8 },
        3: { type: "plus", amount: 8.8 }
      }
    },
    clover: {
      image: "../source/clover.png",
      values: {
        1: { type: "multiply", factor: 3 },
        2: { type: "multiply", factor: 7 },
        3: { type: "plus", amount: 60 }
      }
    },
    grape: {
      image: "../source/grape.png",
      values: {
        1: { type: "plus", amount: 0.1 },
        2: { type: "plus", amount: 0.2 },
        3: { type: "plus", amount: 5.5 }
      }
    },
    mushroom: {
      image: "../source/mushrum_v1.png",
      values: {
        1: { type: "plus", amount: 0.1 },
        2: { type: "plus", amount: 0.4 },
        3: { type: "plus", amount: 4 }
      }
    },
    melon: {
      image: "../source/melon.png",
      values: {
        1: { type: "plus", amount: 0.0 },
        2: { type: "plus", amount: 0.2 },
        3: { type: "plus", amount: 7.7 }
      }
    },
    cherry: {
      image: "../source/cherry.png",
      values: {
        1: { type: "plus", amount: 0.4 },
        2: { type: "plus", amount: 0.8 },
        3: { type: "plus", amount: 2.2 }
      }
    },
    banana: {
      image: "../source/banana.png",
      values: {
        1: { type: "plus", amount: 0.0 },
        2: { type: "plus", amount: 0.5 },
        3: { type: "plus", amount: 10 }
      }
    },
    blueBerrie: {
      image: "../source/blueBerrie.png",
      values: {
        1: { type: "plus", amount: 0.1 },
        2: { type: "plus", amount: 0.5 },
        3: { type: "plus", amount: 16.6 }
      }
    },
  };
  

  export const DRUM_CHANCES ={
    
    bomb: {
     priority:2,
     maxCount:1
    },
    clover: {
     priority:3,
     maxCount:2
    },
    grape: {
     priority:10,
     maxCount:3
    },
    mushroom: {
      priority:6,
      maxCount:4
    },
    melon: {
     priority:6,
     maxCount:2
    },
    cherry: {
     priority:4,
     maxCount:2
    },
    banana: {
      priority:4,
      maxCount:2
    },
    blueBerrie: {
      priority:1,
      maxCount:1
    },
  }