import { describe, it, expect } from 'vitest';
import { isWorkEmail, PERSONAL_EMAIL_DOMAINS, ALLOWED_PERSONAL_EMAILS } from '../utils/authValidation';

describe('isWorkEmail', () => {
  it('returns true for valid email addresses', () => {
    expect(isWorkEmail('user@company.com')).toBe(true);
    expect(isWorkEmail('hello@agency.io')).toBe(true);
  });

  it('returns false for empty/invalid inputs', () => {
    expect(isWorkEmail('')).toBe(false);
    expect(isWorkEmail(null)).toBe(false);
    expect(isWorkEmail('notanemail')).toBe(false);
    expect(isWorkEmail(undefined)).toBe(false);
  });

  it('returns true for any email with @ (relaxed mode)', () => {
    // Currently relaxed to accept all providers
    expect(isWorkEmail('user@gmail.com')).toBe(true);
  });
});

describe('PERSONAL_EMAIL_DOMAINS', () => {
  it('contains expected common personal domains', () => {
    expect(PERSONAL_EMAIL_DOMAINS).toContain('gmail.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('yahoo.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('hotmail.com');
    expect(PERSONAL_EMAIL_DOMAINS).toContain('outlook.com');
  });

  it('is a non-empty array', () => {
    expect(Array.isArray(PERSONAL_EMAIL_DOMAINS)).toBe(true);
    expect(PERSONAL_EMAIL_DOMAINS.length).toBeGreaterThan(0);
  });
});

describe('ALLOWED_PERSONAL_EMAILS', () => {
  it('is an array', () => {
    expect(Array.isArray(ALLOWED_PERSONAL_EMAILS)).toBe(true);
  });
});
