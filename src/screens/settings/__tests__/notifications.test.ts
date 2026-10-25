import {
  TIME_OPTIONS,
  END_TIME_OPTIONS,
} from '@/screens/settings/notifications';

describe('Notification screen time options (Issue #813)', () => {
  it('generates 48 standard half-hour intervals for TIME_OPTIONS', () => {
    expect(TIME_OPTIONS).toHaveLength(48);
    expect(TIME_OPTIONS[0]).toBe('12:00 AM');
    expect(TIME_OPTIONS[TIME_OPTIONS.length - 1]).toBe('11:30 PM');
    expect(TIME_OPTIONS).not.toContain('11:59 PM');
  });

  it('includes 11:59 PM in END_TIME_OPTIONS so the default quiet hour can be restored', () => {
    expect(END_TIME_OPTIONS).toHaveLength(49);
    expect(END_TIME_OPTIONS[END_TIME_OPTIONS.length - 1]).toBe('11:59 PM');
    expect(END_TIME_OPTIONS).toContain('11:59 PM');
  });

  it('preserves all standard intervals in END_TIME_OPTIONS', () => {
    for (const option of TIME_OPTIONS) {
      expect(END_TIME_OPTIONS).toContain(option);
    }
  });
});
