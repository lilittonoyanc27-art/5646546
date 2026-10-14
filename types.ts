export type QuestionType =
  | 'standard'
  | 'clock'
  | 'color'
  | 'weather'
  | 'builder'
  | 'listening'
  | 'error_spot';

export interface Question {
  id: string;
  round: number; // 1 to 6, or 0 for special modes
  categoryEs: string;
  categoryRu: string;
  questionEs: string;
  questionRu: string;
  options: string[];
  correctIndex: number;
  explanationEs: string;
  explanationRu: string;
  speechText?: string;
  type?: QuestionType;
  // Specific visual aids
  clockTime?: { hours: number; minutes: number; digitalStr?: string };
  colorHex?: string;
  colorOptionsHex?: string[];
  weatherType?: 'sol' | 'lluvia' | 'nieve' | 'viento' | 'nubes' | 'niebla' | 'tormenta';
  scrambleWords?: string[];
  targetSentence?: string;
  incorrectSentence?: string;
}

export type GameMode =
  | 'round'         // Single selected round (1-6)
  | 'all'           // All 6 rounds continuously (60 questions)
  | 'rapid'         // 10 random questions, 15s per question
  | 'listen'        // Audio-first mode
  | 'error'         // Find the error mode
  | 'builder'       // Word chip sentence builder
  | 'final'         // 15-question comprehensive challenge
  | 'errors_review';// Practice only mistakes

export interface RoundScore {
  score: number;
  maxScore: number;
  accuracy: number;
  timestamp: number;
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  highScore: number;
  roundScores: Record<number, RoundScore>;
  mistakeIds: string[];
  soundEnabled: boolean;
  speechRate: number;
}
