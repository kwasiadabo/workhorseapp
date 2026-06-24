import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenOnboarding, markOnboardingSeen } from '../onboarding';

describe('hasSeenOnboarding / markOnboardingSeen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('treats a user as having seen onboarding when there is no userId', () => {
    // Guards the call sites that run before auth has resolved a user id.
    expect(hasSeenOnboarding(undefined)).toBe(true);
  });

  it('returns false for a user who has never been marked', () => {
    expect(hasSeenOnboarding('user-1')).toBe(false);
  });

  it('returns true after markOnboardingSeen has been called for that user', () => {
    markOnboardingSeen('user-1');
    expect(hasSeenOnboarding('user-1')).toBe(true);
  });

  it('tracks each user independently', () => {
    markOnboardingSeen('user-1');
    expect(hasSeenOnboarding('user-1')).toBe(true);
    expect(hasSeenOnboarding('user-2')).toBe(false);
  });

  it('markOnboardingSeen is a no-op when there is no userId', () => {
    expect(() => markOnboardingSeen(undefined)).not.toThrow();
  });
});
