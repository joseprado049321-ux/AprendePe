export type RewardType = 'oro' | 'esmeralda' | 'xpMultiplier' | 'streakProtector' | 'none';

export interface RewardDrop {
  type: RewardType;
  amount: number;
}

export function calculateDrop(): RewardDrop {
  const rand = Math.random() * 100; // 0 to 100

  // 60%: Oro (10 to 30)
  if (rand < 60) {
    return {
      type: 'oro',
      amount: Math.floor(Math.random() * 21) + 10 
    };
  } 
  // 30%: Esmeralda (1 to 3)
  else if (rand < 90) {
    return {
      type: 'esmeralda',
      amount: Math.floor(Math.random() * 3) + 1
    };
  } 
  // 10%: Item Especial (1)
  else {
    const isMultiplier = Math.random() > 0.5;
    return {
      type: isMultiplier ? 'xpMultiplier' : 'streakProtector',
      amount: 1
    };
  }
}
