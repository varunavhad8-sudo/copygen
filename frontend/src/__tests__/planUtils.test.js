import { describe, it, expect } from 'vitest';

// ── Plan limit helpers (inline logic that mirrors server-side) ────────────────
const PLAN_LIMITS = {
  free:    { generations: 10,   brandVoices: 1  },
  starter: { generations: 300,  brandVoices: 10 },
  growth:  { generations: 1000, brandVoices: 30 },
  agency:  { generations: 3000, brandVoices: 100 },
};

const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;
const isAtGenerationLimit = (used, plan) => used >= getPlanLimits(plan).generations;
const isPaidPlan = (plan) => ['starter', 'growth', 'agency'].includes(plan);
const formatPlanLabel = (plan) => plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free';

describe('getPlanLimits', () => {
  it('returns correct limits for each plan', () => {
    expect(getPlanLimits('free').generations).toBe(10);
    expect(getPlanLimits('starter').generations).toBe(300);
    expect(getPlanLimits('growth').generations).toBe(1000);
    expect(getPlanLimits('agency').generations).toBe(3000);
  });

  it('returns free limits for unknown plan', () => {
    expect(getPlanLimits('unknown').generations).toBe(10);
    expect(getPlanLimits(null).generations).toBe(10);
  });
});

describe('isAtGenerationLimit', () => {
  it('returns true when user has used all generations', () => {
    expect(isAtGenerationLimit(10, 'free')).toBe(true);
    expect(isAtGenerationLimit(300, 'starter')).toBe(true);
  });

  it('returns false when user has remaining generations', () => {
    expect(isAtGenerationLimit(5, 'free')).toBe(false);
    expect(isAtGenerationLimit(0, 'starter')).toBe(false);
  });

  it('returns true when over the limit', () => {
    expect(isAtGenerationLimit(999, 'free')).toBe(true);
  });
});

describe('isPaidPlan', () => {
  it('returns true for paid plans', () => {
    expect(isPaidPlan('starter')).toBe(true);
    expect(isPaidPlan('growth')).toBe(true);
    expect(isPaidPlan('agency')).toBe(true);
  });

  it('returns false for free plan', () => {
    expect(isPaidPlan('free')).toBe(false);
    expect(isPaidPlan('')).toBe(false);
    expect(isPaidPlan(null)).toBe(false);
  });
});

describe('formatPlanLabel', () => {
  it('capitalizes plan name correctly', () => {
    expect(formatPlanLabel('free')).toBe('Free');
    expect(formatPlanLabel('starter')).toBe('Starter');
    expect(formatPlanLabel('agency')).toBe('Agency');
  });

  it('handles null/undefined', () => {
    expect(formatPlanLabel(null)).toBe('Free');
    expect(formatPlanLabel(undefined)).toBe('Free');
  });
});
