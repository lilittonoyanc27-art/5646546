import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  X,
  RotateCcw,
  ArrowRight,
  Play,
  Trophy,
  Clock,
  HelpCircle,
  Palette,
  CloudSun,
  Hash,
  Flame,
  Award,
  AlertCircle,
  ChevronLeft,
  Zap,
  Headphones,
  CheckCircle2,
  BookmarkCheck,
  ListRestart,
} from 'lucide-react';

import { Question, GameMode, UserStats } from './types';
import {
  ROUND_INFO,
  MAIN_QUESTIONS,
  BUILDER_QUESTIONS,
  ERROR_QUESTIONS,
  LISTENING_QUESTIONS,
} from './questions';
import {
  playClick,
  playCorrect,
  playIncorrect,
  playTick,
  playVictory,
  setSoundEnabled,
  getSoundEnabled,
} from './sound';
import { speakSpanish, isSpeechSupported } from './speech';
import {
  loadUserStats,
  saveUserStats,
  recordRoundCompletion,
  removeMistake,
  resetProgress,
} from './storage';
import { ClockSvg } from './ClockSvg';
import { WeatherSvg } from './WeatherSvg';
import { SentenceBuilder } from './SentenceBuilder';

export default function App() {
  // Application State
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [currentMode, setCurrentMode] = useState<GameMode | 'menu'>('menu');
  const [activeRound, setActiveRound] = useState<number>(1);
  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentMistakes, setCurrentMistakes] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Rapid Mode Timer State
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Builder Mode State
  const [builderIndex, setBuilderIndex] = useState<number>(0);

  // Sync sound setting on mount
  useEffect(() => {
    setSoundEnabled(stats.soundEnabled);
  }, [stats.soundEnabled]);

  const toggleSound = () => {
    const next = !stats.soundEnabled;
    setSoundEnabled(next);
    const updated = { ...stats, soundEnabled: next };
    setStats(updated);
    saveUserStats(updated);
    if (next) playClick();
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    await speakSpanish(text, stats.speechRate);
    setIsSpeaking(false);
  };

  // Shuffle helper
  const shuffleArray = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  // Helper to start game
  const startGame = (mode: GameMode, roundNum: number = 1) => {
    playClick();
    setCurrentMode(mode);
    setActiveRound(roundNum);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentScore(0);
    setCurrentMistakes([]);
    setStreak(0);
    setShowResults(false);
    setBuilderIndex(0);

    let list: Question[] = [];

    if (mode === 'round') {
      const filtered = MAIN_QUESTIONS.filter((q) => q.round === roundNum);
      list = shuffleArray(filtered).map((q) => shuffleQuestionOptions(q));
    } else if (mode === 'all') {
      list = shuffleArray(MAIN_QUESTIONS).map((q) => shuffleQuestionOptions(q));
    } else if (mode === 'rapid') {
      // 10 random questions from all main
      list = shuffleArray(MAIN_QUESTIONS).slice(0, 10).map((q) => shuffleQuestionOptions(q));
      setTimeLeft(15);
    } else if (mode === 'listen') {
      list = shuffleArray(LISTENING_QUESTIONS).map((q) => shuffleQuestionOptions(q));
    } else if (mode === 'error') {
      list = shuffleArray(ERROR_QUESTIONS).map((q) => shuffleQuestionOptions(q));
    } else if (mode === 'final') {
      // 15 comprehensive mixed questions
      list = shuffleArray(MAIN_QUESTIONS).slice(0, 15).map((q) => shuffleQuestionOptions(q));
    } else if (mode === 'errors_review') {
      const mistakeSet = new Set(stats.mistakeIds);
      const allPossible = [...MAIN_QUESTIONS, ...ERROR_QUESTIONS, ...LISTENING_QUESTIONS];
      const filtered = allPossible.filter((q) => mistakeSet.has(q.id));
      list = shuffleArray(filtered).map((q) => shuffleQuestionOptions(q));
    }

    setQuestionList(list);

    // Auto-pronounce if listening mode
    if (mode === 'listen' && list.length > 0 && list[0].speechText) {
      setTimeout(() => {
        handleSpeak(list[0].speechText!);
      }, 400);
    }
  };

  // Shuffle options while keeping correctIndex accurate
  const shuffleQuestionOptions = (q: Question): Question => {
    const originalCorrectText = q.options[q.correctIndex];
    const shuffledOptions = shuffleArray(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);
    return {
      ...q,
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
    };
  };

  const currentQuestion = questionList[currentIndex];

  // Timer effect for rapid mode
  useEffect(() => {
    if (currentMode === 'rapid' && !isAnswered && !showResults && questionList.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeExpired();
            return 0;
          }
          if (prev <= 4) {
            playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentMode, currentIndex, isAnswered, showResults, questionList]);

  const handleTimeExpired = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    playIncorrect();
    setStreak(0);
    if (currentQuestion) {
      setCurrentMistakes((prev) => [...prev, currentQuestion.id]);
    }
  };

  // Option selection
  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQuestion) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;

    if (isCorrect) {
      playCorrect();
      setCurrentScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);

      // If user was re-answering a mistake, remove it
      if (stats.mistakeIds.includes(currentQuestion.id)) {
        const updated = removeMistake(currentQuestion.id);
        setStats(updated);
      }

      // Automatically speak the correct Spanish text/explanation phrase
      if (currentQuestion.speechText) {
        handleSpeak(currentQuestion.speechText);
      }
    } else {
      playIncorrect();
      setStreak(0);
      setCurrentMistakes((prev) => [...prev, currentQuestion.id]);
    }
  };

  // Next question or finish
  const handleNextQuestion = () => {
    playClick();
    if (currentIndex + 1 < questionList.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);

      // Auto-pronounce in listening mode
      const nextQ = questionList[nextIdx];
      if (currentMode === 'listen' && nextQ?.speechText) {
        setTimeout(() => {
          handleSpeak(nextQ.speechText!);
        }, 300);
      }
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setShowResults(true);
    const maxScore = questionList.length * 10;
    const roundNumber = currentMode === 'round' ? activeRound : 99;

    const updated = recordRoundCompletion(
      roundNumber,
      currentScore,
      maxScore,
      currentMistakes
    );
    setStats(updated);

    if (currentScore >= maxScore * 0.7) {
      playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#2563eb', '#facc15', '#f97316'],
      });
    }
  };

  // Sentence Builder completion handler
  const handleBuilderQuestionComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      playCorrect();
      setCurrentScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);
    } else {
      playIncorrect();
      setStreak(0);
    }
  };

  const handleNextBuilder = () => {
    playClick();
    if (builderIndex + 1 < BUILDER_QUESTIONS.length) {
      setBuilderIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
      playVictory();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#2563eb', '#facc15', '#f97316'],
      });
    }
  };

  // Color mapping helper for visual cards
  const getColorStyle = (hex?: string) => {
    if (!hex) return {};
    return { backgroundColor: hex };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50/40 to-amber-50/30 text-slate-800 flex flex-col font-sans">
      {/* ======================================================== */}
      {/* TOP HEADER */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              playClick();
              setCurrentMode('menu');
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-blue-600 to-amber-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg tracking-tighter">¡V!</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg text-blue-950 tracking-tight">
                  ¡Vamos a jugar!
                </span>
                <span className="hidden sm:inline-flex text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  A1–A2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Испанская интерактивная викторина
              </p>
            </div>
          </div>

          {/* Action Counters & Sound */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            {streak > 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-bold animate-pulse">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>{streak} подряд!</span>
              </div>
            )}

            {/* Mistakes Practice Button */}
            {stats.mistakeIds.length > 0 && currentMode === 'menu' && (
              <button
                onClick={() => startGame('errors_review')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Ошибки:</span> {stats.mistakeIds.length}
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              aria-label="Переключить звук"
              className={`p-2 rounded-lg border transition-colors ${
                stats.soundEnabled
                  ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {stats.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTAINER */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* VIEW 1: HOME MENU */}
        {/* ======================================================== */}
        {currentMode === 'menu' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-600 to-sky-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-semibold tracking-wide text-white">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Уровень A1–A2 · Изучение испанского с русского
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Изучай испанский с азартом и удовольствием
                </h1>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  60 проверенных заданий по числам, погоде, цветам, роду, времени и вопросам с озвучкой носителя речи.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => startGame('round', 1)}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-slate-900" />
                    Начать с 1 раунда
                  </button>
                  <button
                    onClick={() => startGame('all')}
                    className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm rounded-xl border border-white/30 backdrop-blur-sm transition-all"
                  >
                    Все 60 вопросов подряд
                  </button>
                </div>
              </div>

              {/* Decorative accent background shapes */}
              <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute right-12 top-6 opacity-20 pointer-events-none hidden md:block">
                <span className="text-9xl font-black">ES</span>
              </div>
            </div>

            {/* Special Game Modes Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Дополнительные игровые режимы
                  </h2>
                  <p className="text-xs text-slate-500">
                    Динамичные тренировки на слух, логику, время и построение фраз
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Rapid Mode */}
                <button
                  onClick={() => startGame('rapid')}
                  className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-2xl shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Modo rápido
                    </div>
                    <div className="text-xs font-semibold text-amber-600 mb-1">
                      Быстрый раунд
                    </div>
                    <div className="text-xs text-slate-500">
                      10 случайных вопросов, 15 секунд на каждый
                    </div>
                  </div>
                </button>

                {/* Listening Mode */}
                <button
                  onClick={() => startGame('listen')}
                  className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-2xl shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-sky-100 text-sky-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Escucha y responde
                    </div>
                    <div className="text-xs font-semibold text-sky-600 mb-1">
                      Слушай и отвечай
                    </div>
                    <div className="text-xs text-slate-500">
                      Слушай испанскую речь и выбирай верный смысл
                    </div>
                  </div>
                </button>

                {/* Error Finder Mode */}
                <button
                  onClick={() => startGame('error')}
                  className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-2xl shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Encuentra el error
                    </div>
                    <div className="text-xs font-semibold text-rose-600 mb-1">
                      Найди ошибку
                    </div>
                    <div className="text-xs text-slate-500">
                      Определи и исправь грамматическую неточность
                    </div>
                  </div>
                </button>

                {/* Sentence Builder */}
                <button
                  onClick={() => {
                    playClick();
                    setCurrentMode('builder');
                    setBuilderIndex(0);
                    setCurrentScore(0);
                    setShowResults(false);
                  }}
                  className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-2xl shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-105 transition-transform">
                    <ListRestart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Construye la frase
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mb-1">
                      Собери предложение
                    </div>
                    <div className="text-xs text-slate-500">
                      Расставь слова в правильном порядке
                    </div>
                  </div>
                </button>

                {/* Final Challenge */}
                <button
                  onClick={() => startGame('final')}
                  className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-2xl shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-orange-100 text-orange-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Desafío final
                    </div>
                    <div className="text-xs font-semibold text-orange-600 mb-1">
                      Финальное испытание
                    </div>
                    <div className="text-xs text-slate-500">
                      15 смешанных вопросов по всем 6 темам
                    </div>
                  </div>
                </button>

                {/* Repeat Mistakes */}
                <button
                  onClick={() => startGame('errors_review')}
                  disabled={stats.mistakeIds.length === 0}
                  className={`p-4 border rounded-2xl shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer ${
                    stats.mistakeIds.length > 0
                      ? 'bg-white hover:bg-sky-50/50 border-slate-200/80 hover:border-sky-300'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
                    <BookmarkCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Repetir errores
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 mb-1">
                      Работа над ошибками
                    </div>
                    <div className="text-xs text-slate-500">
                      {stats.mistakeIds.length > 0
                        ? `В копилке: ${stats.mistakeIds.length} вопросов`
                        : 'Ошибок пока нет, отличный результат!'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* The 6 Core Rounds */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  6 основных тематических раундов
                </h2>
                <p className="text-xs text-slate-500">
                  По 10 проверочных вопросов в каждом раунде (всего 60 заданий)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROUND_INFO.map((r) => {
                  const saved = stats.roundScores[r.round];
                  return (
                    <div
                      key={r.round}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        {/* Round Header & Number */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md">
                            Раунд {r.round}
                          </span>
                          {saved && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Рекорд: {saved.score} / {saved.maxScore}
                            </span>
                          )}
                        </div>

                        {/* Round Titles */}
                        <h3 className="font-bold text-lg text-slate-900 leading-snug">
                          {r.titleEs}
                        </h3>
                        <p className="text-xs font-semibold text-sky-700 mb-2">
                          {r.titleRu}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          {r.descRu}
                        </p>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={() => startGame('round', r.round)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Jugar — Играть
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: QUIZ ENGINE (STANDARD, RAPID, LISTEN, ERROR, FINAL) */}
        {/* ======================================================== */}
        {currentMode !== 'menu' && currentMode !== 'builder' && !showResults && currentQuestion && (
          <div className="max-w-2xl mx-auto w-full space-y-4 animate-fadeIn">
            {/* Top Navigation Bar in Game */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <button
                onClick={() => {
                  playClick();
                  setCurrentMode('menu');
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Меню
              </button>

              <div className="text-center font-bold text-slate-700">
                {currentMode === 'round' && `Раунд ${activeRound} · `}
                {currentMode === 'rapid' && '⚡ Быстрый раунд · '}
                {currentMode === 'listen' && '🎧 Аудио · '}
                {currentMode === 'error' && '🔍 Поиск ошибки · '}
                {currentMode === 'final' && '🏆 Финал · '}
                Вопрос {currentIndex + 1} из {questionList.length}
              </div>

              <div className="font-bold text-blue-600">
                {currentScore} баллов
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-blue-600 to-amber-400 transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / questionList.length) * 100}%`,
                }}
              />
            </div>

            {/* Rapid Mode Timer Bar */}
            {currentMode === 'rapid' && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-orange-500 animate-spin" />
                  Осталось времени:
                </div>
                <div
                  className={`font-mono font-extrabold text-sm ${
                    timeLeft <= 5 ? 'text-rose-600 animate-bounce' : 'text-amber-800'
                  }`}
                >
                  {timeLeft} сек
                </div>
              </div>
            )}

            {/* Question Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 space-y-6">
              {/* Question Header & Speech Button */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
                    {currentQuestion.categoryEs}
                  </span>

                  <button
                    onClick={() =>
                      handleSpeak(currentQuestion.speechText || currentQuestion.questionEs)
                    }
                    disabled={isSpeaking}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-blue-600' : ''}`} />
                    Escuchar
                  </button>
                </div>

                {/* Spanish Question */}
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                  {currentQuestion.questionEs}
                </h2>

                {/* Russian Translation beneath */}
                <p className="text-sm sm:text-base text-slate-500 font-medium">
                  {currentQuestion.questionRu}
                </p>
              </div>

              {/* Visual Aids (Clocks, Weather, Colors) */}
              {currentQuestion.clockTime && (
                <div className="flex justify-center py-2">
                  <ClockSvg
                    hours={currentQuestion.clockTime.hours}
                    minutes={currentQuestion.clockTime.minutes}
                    size={170}
                  />
                </div>
              )}

              {currentQuestion.weatherType && (
                <div className="flex justify-center py-2">
                  <WeatherSvg type={currentQuestion.weatherType} size={110} />
                </div>
              )}

              {currentQuestion.colorHex && (
                <div className="flex justify-center py-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                    <div
                      className="w-16 h-16 rounded-xl border-2 border-white shadow-md"
                      style={getColorStyle(currentQuestion.colorHex)}
                    />
                    <div className="text-xs text-slate-500 font-medium max-w-[160px]">
                      Образец цвета для определения в вопросе
                    </div>
                  </div>
                </div>
              )}

              {/* Options Grid (4 choices) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let btnStyle =
                    'bg-slate-50/80 hover:bg-sky-50/70 border-slate-200 hover:border-sky-300 text-slate-800';

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle =
                        'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30';
                    } else if (isSelected) {
                      btnStyle =
                        'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/30';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={`relative p-4 rounded-2xl border text-left font-semibold transition-all duration-200 active:scale-98 flex items-center gap-3 ${btnStyle} cursor-pointer disabled:cursor-default`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isAnswered && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isAnswered && isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base flex-1">{opt}</span>

                      {isAnswered && isCorrect && (
                        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <X className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Feedback Banner (Appears after answer) */}
              {isAnswered && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    selectedOption === currentQuestion.correctIndex
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                      {selectedOption === currentQuestion.correctIndex ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ¡Correcto! (+10 puntos)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                          {selectedOption === null
                            ? '¡Tiempo agotado! — Время вышло'
                            : '¡Incorrecto! — Неверно'}
                        </>
                      )}
                    </span>

                    <button
                      onClick={() =>
                        handleSpeak(
                          currentQuestion.speechText ||
                            currentQuestion.options[currentQuestion.correctIndex]
                        )
                      }
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-colors flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                      Послушать
                    </button>
                  </div>

                  {/* Russian explanation */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {currentQuestion.explanationRu}
                  </p>

                  {/* Spanish explanation */}
                  <p className="text-xs text-slate-500 italic">
                    {currentQuestion.explanationEs}
                  </p>
                </div>
              )}

              {/* Next Question Button */}
              {isAnswered && (
                <div className="pt-2">
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-amber-500 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-base rounded-2xl shadow-md shadow-blue-500/20 transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentIndex + 1 < questionList.length
                        ? 'Siguiente pregunta — Следующий вопрос'
                        : 'Ver resultados — Посмотреть результаты'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: SENTENCE BUILDER MODE */}
        {/* ======================================================== */}
        {currentMode === 'builder' && !showResults && (
          <div className="max-w-2xl mx-auto w-full space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <button
                onClick={() => {
                  playClick();
                  setCurrentMode('menu');
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Меню
              </button>

              <div className="font-bold text-slate-700">
                Сборка предложений · Задание {builderIndex + 1} из {BUILDER_QUESTIONS.length}
              </div>

              <div className="font-bold text-blue-600">
                {currentScore} баллов
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 space-y-6">
              <SentenceBuilder
                questionEs={BUILDER_QUESTIONS[builderIndex].questionEs}
                questionRu={BUILDER_QUESTIONS[builderIndex].questionRu}
                words={BUILDER_QUESTIONS[builderIndex].words}
                targetSentence={BUILDER_QUESTIONS[builderIndex].targetSentence}
                explanationEs={BUILDER_QUESTIONS[builderIndex].explanationEs}
                explanationRu={BUILDER_QUESTIONS[builderIndex].explanationRu}
                onComplete={handleBuilderQuestionComplete}
                onSpeak={handleSpeak}
              />

              <div className="pt-2">
                <button
                  onClick={handleNextBuilder}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-amber-500 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-base rounded-2xl shadow-md shadow-blue-500/20 transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>
                    {builderIndex + 1 < BUILDER_QUESTIONS.length
                      ? 'Siguiente frase — Следующее предложение'
                      : 'Ver resultados — Завершить упражнение'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: RESULTS SCREEN */}
        {/* ======================================================== */}
        {showResults && (
          <div className="max-w-xl mx-auto w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/10 space-y-6 text-center animate-fadeIn">
            {/* Trophy Icon */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-600">
                Результаты раунда
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {currentScore >= (questionList.length || 7) * 8
                  ? '¡Excelente trabajo! — Отличная работа!'
                  : currentScore >= (questionList.length || 7) * 5
                  ? '¡Muy bien! — Очень хорошо!'
                  : '¡Buen intento! — Хорошая попытка!'}
              </h2>
              <p className="text-sm text-slate-500">
                Практика делает мастера. Повторяйте раунды для закрепления!
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div>
                <div className="text-2xl font-black text-blue-600">
                  {currentScore}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Баллы
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">
                  {currentScore / 10}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Верно
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-rose-600">
                  {currentMistakes.length}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Ошибки
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  if (currentMode === 'builder') {
                    setBuilderIndex(0);
                    setCurrentScore(0);
                    setShowResults(false);
                  } else if (currentMode !== 'menu') {
                    startGame(currentMode, activeRound);
                  }
                }}
                className="w-full py-3 px-5 bg-gradient-to-r from-sky-500 via-blue-600 to-amber-500 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Jugar otra vez — Играть снова
              </button>

              {currentMistakes.length > 0 && currentMode !== 'errors_review' && (
                <button
                  onClick={() => startGame('errors_review')}
                  className="w-full py-2.5 px-5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Повторить только ошибки ({currentMistakes.length})
                </button>
              )}

              <button
                onClick={() => {
                  playClick();
                  setCurrentMode('menu');
                }}
                className="w-full py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Вернуться в главное меню
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* FOOTER */}
      {/* ======================================================== */}
      <footer className="mt-auto border-t border-sky-100/80 bg-white/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ¡Vamos a jugar! · Испанский язык для русскоговорящих студентов (A1–A2)
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>60 заданий</span>
            <span>·</span>
            <span>Аудио es-ES</span>
            <span>·</span>
            <span>Синтез речи</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
