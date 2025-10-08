export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
};

export const formatHours = (seconds: number): string => {
  return (seconds / 3600).toFixed(2);
};

export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `R ${numAmount.toFixed(2)}`;
};

export const getBudgetStatus = (billing: number, budget: number | string): 'normal' | 'warning' | 'danger' => {
  const numBudget = typeof budget === 'string' ? parseFloat(budget) : budget;
  const percentage = (billing / numBudget) * 100;
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'normal';
};
