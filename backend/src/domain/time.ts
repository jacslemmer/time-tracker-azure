// Pure time calculation functions

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
};

export const hoursToSeconds = (hours: number): number =>
  Math.floor(hours * 3600);

export const secondsToHours = (seconds: number): number =>
  seconds / 3600;

export const calculateElapsed = (startTime: number, endTime: number): number =>
  Math.floor((endTime - startTime) / 1000);

export const getCurrentTimestamp = (): number => Date.now();

export const isLongRunningSession = (
  startTime: number,
  thresholdHours: number = 8
): boolean => {
  const elapsedMs = Date.now() - startTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  return elapsedHours >= thresholdHours;
};
