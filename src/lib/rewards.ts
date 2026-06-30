export type RewardType = 'oro' | 'esmeralda' | 'rubi' | 'diamante' | 'xpMultiplier' | 'streakProtector' | 'none';

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
  // 25%: Esmeralda (5 to 15)
  else if (rand < 85) {
    return {
      type: 'esmeralda',
      amount: Math.floor(Math.random() * 11) + 5
    };
  } 
  // 10%: Rubi o Diamante (1 to 5)
  else if (rand < 95) {
    const isRubi = Math.random() > 0.5;
    return {
      type: isRubi ? 'rubi' : 'diamante',
      amount: Math.floor(Math.random() * 5) + 1
    };
  } 
  // 5%: Item Especial (1)
  else {
    const isMultiplier = Math.random() > 0.5;
    return {
      type: isMultiplier ? 'xpMultiplier' : 'streakProtector',
      amount: 1
    };
  }
}
