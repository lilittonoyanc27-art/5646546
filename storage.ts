import { UserStats, RoundScore } from './types';

const STORAGE_KEY = 'vamos_a_jugar_stats_v1';

const defaultStats: UserStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  highScore: 0,
  roundScores: {},
  mistakeIds: [],
  soundEnabled: true,
  speechRate: 0.9,
};

export function loadUserStats(): UserStats {
  if (typeof window === 'undefined') return defaultStats;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);
    return {
      ...defaultStats,
      ...parsed,
      roundScores: parsed.roundScores || {},
      mistakeIds: Array.isArray(parsed.mistakeIds) ? parsed.mistakeIds : [],
    };
  } catch {
    return defaultStats;
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Could not save user stats to localStorage', err);
  }
}

export function recordRoundCompletion(
  round: number,
  score: number,
  maxScore: number,
  mistakes: string[]
): UserStats {
  const current = loadUserStats();
  const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  const existingBest = current.roundScores[round]?.score || 0;
  const newScoreObj: RoundScore = {
    score: Math.max(existingBest, score),
    maxScore,
    accuracy,
    timestamp: Date.now(),
  };

  const updatedMistakes = Array.from(new Set([...current.mistakeIds, ...mistakes]));

  const updated: UserStats = {
    ...current,
    highScore: Math.max(current.highScore, score),
    roundScores: {
      ...current.roundScores,
      [round]: newScoreObj,
    },
    mistakeIds: updatedMistakes,
  };

  saveUserStats(updated);
  return updated;
}

export function removeMistake(questionId: string): UserStats {
  const current = loadUserStats();
  const updatedMistakes = current.mistakeIds.filter((id) => id !== questionId);
  const updated: UserStats = {
    ...current,
    mistakeIds: updatedMistakes,
  };
  saveUserStats(updated);
  return updated;
}

export function resetProgress(): UserStats {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return defaultStats;
}
