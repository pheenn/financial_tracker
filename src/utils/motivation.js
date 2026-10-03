export const getMotivation = (days) => {
  if (days === 1) return "Every journey begins with a single step. Great start!";
  if (days === 2) return "Two days down! Your willpower is growing stronger.";
  if (days === 3) return "Three days! The urges might be there, but so is your strength.";
  if (days === 7) return "One whole week! Be proud of this massive milestone.";
  if (days === 10) return "Double digits! You are literally rewiring your brain.";
  if (days === 14) return "Two weeks! Look how much money and peace you've saved.";
  if (days === 30) return "A whole month! You are an inspiration. Keep going.";
  if (days % 10 === 0) return `${days} days clean! You are a master of your own mind now.`;
  return `Day ${days} clean. You are investing in your future peace! Keep it up.`;
};
