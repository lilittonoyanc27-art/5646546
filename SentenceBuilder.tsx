import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, Check, Sparkles } from 'lucide-react';

interface SentenceBuilderProps {
  questionEs: string;
  questionRu: string;
  words: string[];
  targetSentence: string;
  explanationEs: string;
  explanationRu: string;
  onComplete: (isCorrect: boolean) => void;
  onSpeak: (text: string) => void;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  questionEs,
  questionRu,
  words,
  targetSentence,
  explanationEs,
  explanationRu,
  onComplete,
  onSpeak,
}) => {
  const [availableWords, setAvailableWords] = useState<{ id: number; text: string }[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ id: number; text: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Shuffle incoming words with unique indices
    const mapped = words.map((w, idx) => ({ id: idx, text: w }));
    const shuffled = [...mapped].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsSubmitted(false);
    setIsCorrect(false);
  }, [words, targetSentence]);

  const handleSelectWord = (item: { id: number; text: string }) => {
    if (isSubmitted) return;
    setAvailableWords((prev) => prev.filter((w) => w.id !== item.id));
    setSelectedWords((prev) => [...prev, item]);
  };

  const handleDeselectWord = (item: { id: number; text: string }) => {
    if (isSubmitted) return;
    setSelectedWords((prev) => prev.filter((w) => w.id !== item.id));
    setAvailableWords((prev) => [...prev, item]);
  };

  const handleReset = () => {
    if (isSubmitted) return;
    const mapped = words.map((w, idx) => ({ id: idx, text: w }));
    setAvailableWords(mapped);
    setSelectedWords([]);
  };

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[¿?¡!.,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const handleCheck = () => {
    if (selectedWords.length === 0 || isSubmitted) return;
    const assembled = selectedWords.map((w) => w.text).join(' ');
    const correct = normalize(assembled) === normalize(targetSentence);
    setIsCorrect(correct);
    setIsSubmitted(true);
    onComplete(correct);
    if (correct) {
      onSpeak(targetSentence);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="text-center space-y-2">
        <div className="text-xs font-semibold tracking-wider text-sky-700 uppercase">
          {questionEs}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800">
          {questionRu}
        </h3>
      </div>

      {/* Construction Zone */}
      <div className="p-4 md:p-6 bg-slate-50/80 border-2 border-dashed border-sky-200 rounded-2xl min-h-[110px] flex flex-wrap items-center justify-center gap-2 transition-colors">
        {selectedWords.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            Нажимайте на слова внизу, чтобы составить предложение...
          </p>
        ) : (
          selectedWords.map((item) => (
            <button
              key={item.id}
              onClick={() => handleDeselectWord(item)}
              disabled={isSubmitted}
              className={`px-4 py-2 text-base md:text-lg font-semibold rounded-xl shadow-xs transition-all active:scale-95 ${
                isSubmitted
                  ? isCorrect
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-rose-500 text-white shadow-rose-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              {item.text}
            </button>
          ))
        )}
      </div>

      {/* Available Word Chips */}
      <div>
        <div className="text-xs font-medium text-slate-500 mb-2.5 text-center">
          Доступные слова (нажмите, чтобы добавить):
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 min-h-[48px]">
          {availableWords.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectWord(item)}
              disabled={isSubmitted}
              className="px-4 py-2 text-base md:text-lg font-medium bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 rounded-xl shadow-xs transition-all transform active:scale-95 hover:-translate-y-0.5"
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      {!isSubmitted && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            disabled={selectedWords.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </button>
          <button
            onClick={handleCheck}
            disabled={selectedWords.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm md:text-base font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Проверить ответ
          </button>
        </div>
      )}

      {/* Explanation banner once submitted */}
      {isSubmitted && (
        <div
          className={`p-4 md:p-5 rounded-2xl border ${
            isCorrect
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold flex items-center gap-1.5 text-base">
              {isCorrect ? (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  ¡Correcto! — Отлично!
                </>
              ) : (
                '¡Incorrecto! — Неверно'
              )}
            </span>
            <button
              onClick={() => onSpeak(targetSentence)}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-600" />
              Escuchar
            </button>
          </div>
          <p className="font-semibold text-slate-800 text-sm md:text-base">
            Правильно: <span className="text-blue-700">{targetSentence}</span>
          </p>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            {explanationRu}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 italic">
            {explanationEs}
          </p>
        </div>
      )}
    </div>
  );
};
