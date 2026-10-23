import {
  BASE_TIME_OPTIONS,
  TIME_OPTIONS,
} from '@/screens/settings/notifications';

describe('Notification Time Options', () => {
  it('generates 48 standard half-hour intervals in BASE_TIME_OPTIONS', () => {
    expect(BASE_TIME_OPTIONS).toHaveLength(48);
    expect(BASE_TIME_OPTIONS[0]).toBe('12:00 AM');
    expect(BASE_TIME_OPTIONS[1]).toBe('12:30 AM');
    expect(BASE_TIME_OPTIONS[47]).toBe('11:30 PM');
  });

  it('includes 11:59 PM in TIME_OPTIONS to allow restoring end-of-day default', () => {
    expect(TIME_OPTIONS).toHaveLength(49);
    expect(TIME_OPTIONS).toContain('11:59 PM');
  });

  it('places 11:59 PM at the end of the day options directly following 11:30 PM', () => {
    const idx1130 = TIME_OPTIONS.indexOf('11:30 PM');
    const idx1159 = TIME_OPTIONS.indexOf('11:59 PM');

    expect(idx1130).toBe(47);
    expect(idx1159).toBe(48);
    expect(idx1159).toBe(idx1130 + 1);
  });

  it('supports selecting and restoring 11:59 PM default end time', () => {
    let prefs = {
      startTime: '12:00 AM',
      endTime: '11:59 PM',
    };

    // User changes end time
    prefs = { ...prefs, endTime: '5:00 PM' };
    expect(prefs.endTime).toBe('5:00 PM');

    // User restores 11:59 PM from TIME_OPTIONS
    const targetOption = TIME_OPTIONS.find(opt => opt === '11:59 PM');
    expect(targetOption).toBeDefined();

    prefs = { ...prefs, endTime: targetOption! };
    expect(prefs.endTime).toBe('11:59 PM');
  });
});
