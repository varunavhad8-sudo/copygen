const PLAN_LIMITS = {
  free: {
    generations: 10,
    brandVoices: 1
  },
  starter: {
    generations: 300,
    brandVoices: 10
  },
  growth: {
    generations: 1000,
    brandVoices: 30
  },
  agency: {
    generations: 3000,
    brandVoices: 100
  }
};

module.exports = { PLAN_LIMITS };
