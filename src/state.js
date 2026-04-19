const STORAGE_KEY = 'decimal-game-v1';

const defaults = {
  totalPoints: 0,
  bestStreak: 0,
  unlocked: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true },
  stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  bestTimes: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
  prefs: { sound: true },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const saved = JSON.parse(raw);
    return {
      ...defaults,
      ...saved,
      unlocked: { ...defaults.unlocked, ...saved.unlocked },
      stars: { ...defaults.stars, ...saved.stars },
      bestTimes: { ...defaults.bestTimes, ...saved.bestTimes },
      prefs: { ...defaults.prefs, ...saved.prefs },
    };
  } catch {
    return { ...defaults };
  }
}

const persisted = load();

// Session-only state
const session = {
  phase: 'splash', // splash | tutorial | practice | scored
  currentLevel: 1,
  tutorialStep: 0,
  practiceLeft: 3,
  streak: 0,
  points: persisted.totalPoints,
  paused: false,
  startTime: null,
  pauseStart: null,
  totalPaused: 0,
  placement: {
    redCols: 0,
    redSqs: 0,
    blueCols: 0,
    blueSqs: 0,
  },
  problem: null,
  gridSize: 0,
};

export const state = { ...persisted, session };

export function save() {
  const toSave = {
    totalPoints: state.session.points,
    bestStreak: state.bestStreak,
    unlocked: state.unlocked,
    stars: state.stars,
    bestTimes: state.bestTimes,
    prefs: state.prefs,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function resetProgress() {
  Object.assign(state, defaults);
  state.session.points = 0;
  state.session.streak = 0;
  save();
}

export function resetPlacement() {
  state.session.placement = { redCols: 0, redSqs: 0, blueCols: 0, blueSqs: 0 };
}

export function totalUsedColumns() {
  const p = state.session.placement;
  return p.redCols + p.blueCols;
}

export function totalUsedSquares() {
  const p = state.session.placement;
  return p.redSqs + p.blueSqs;
}
