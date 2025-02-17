import { describe, it, expect } from 'vitest';
import { isToday, isConsecutiveDay, formatDate } from '../../../utils/dateUtils';

describe('dateUtils', () => {
  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isConsecutiveDay', () => {
    it('should return true for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isConsecutiveDay(today, yesterday)).toBe(true);
    });
  });
}); 