export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
  const oneDayInMs = 86400000; // 24 * 60 * 60 * 1000
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return diff <= oneDayInMs && date1.toDateString() !== date2.toDateString();
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
}; 