import {
  formatTime,
  hoursToSeconds,
  secondsToHours,
  calculateElapsed,
  isLongRunningSession,
} from '../time';

describe('time domain functions', () => {
  describe('formatTime', () => {
    it('should format seconds as HH:MM:SS', () => {
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(3661)).toBe('01:01:01');
      expect(formatTime(7325)).toBe('02:02:05');
    });

    it('should pad single digits with zeros', () => {
      expect(formatTime(65)).toBe('00:01:05');
    });
  });

  describe('hoursToSeconds', () => {
    it('should convert hours to seconds', () => {
      expect(hoursToSeconds(1)).toBe(3600);
      expect(hoursToSeconds(2.5)).toBe(9000);
      expect(hoursToSeconds(0.5)).toBe(1800);
    });

    it('should floor the result', () => {
      expect(hoursToSeconds(1.999999)).toBe(7199);
    });
  });

  describe('secondsToHours', () => {
    it('should convert seconds to hours', () => {
      expect(secondsToHours(3600)).toBe(1);
      expect(secondsToHours(7200)).toBe(2);
      expect(secondsToHours(1800)).toBe(0.5);
    });
  });

  describe('calculateElapsed', () => {
    it('should calculate elapsed time in seconds', () => {
      const start = 1000000;
      const end = 1005000;
      expect(calculateElapsed(start, end)).toBe(5);
    });

    it('should floor the result', () => {
      const start = 1000000;
      const end = 1005999;
      expect(calculateElapsed(start, end)).toBe(5);
    });
  });

  describe('isLongRunningSession', () => {
    it('should return true for sessions >= 8 hours', () => {
      const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
      expect(isLongRunningSession(eightHoursAgo)).toBe(true);
    });

    it('should return false for sessions < 8 hours', () => {
      const sevenHoursAgo = Date.now() - 7 * 60 * 60 * 1000;
      expect(isLongRunningSession(sevenHoursAgo)).toBe(false);
    });

    it('should use custom threshold', () => {
      const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000;
      expect(isLongRunningSession(fiveHoursAgo, 4)).toBe(true);
      expect(isLongRunningSession(fiveHoursAgo, 6)).toBe(false);
    });
  });
});
