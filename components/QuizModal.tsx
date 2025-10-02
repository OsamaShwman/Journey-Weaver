import React, { useState, useEffect } from 'react';
import type { QuizQuestion } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  questions: QuizQuestion[];
  onComplete: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, questions, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      document.body.style.overflow = 'hidden';
      setCurrentQ(0);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setScore(0);
      setShowResults(false);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !questions || questions.length === 0) return null;

  const question = questions[currentQ];
  const correctOptionIndex = question.options.findIndex(o => o.isCorrect);

  const handleOptionSelect = (index: number) => {
    if (!isAnswered) {
      setSelectedOptionIndex(index);
    }
  };

  const checkAnswer = () => {
    if (selectedOptionIndex === null) return;
    setIsAnswered(true);
    if (selectedOptionIndex === correctOptionIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOptionIndex(null);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setShowResults(true);
    }
  };

  const renderOptions = () => {
    return question.options.map((option, index) => {
      let optionClasses = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-lg ';
      let resultIndicator = null;

      if (isAnswered) {
        if (index === correctOptionIndex) {
          optionClasses += 'bg-green-500/20 border-green-500 text-green-200 cursor-default';
          resultIndicator = <span className="font-bold text-green-400 ml-2">Correct!</span>;
        } else if (index === selectedOptionIndex) {
          optionClasses += 'bg-red-500/20 border-red-500 text-red-200 cursor-default';
          resultIndicator = <span className="font-bold text-red-400 ml-2">Incorrect</span>;
        } else {
          optionClasses += 'bg-gray-800/50 border-gray-700 text-gray-300 cursor-default opacity-60';
        }
      } else {
        if (selectedOptionIndex === index) {
          optionClasses += 'bg-yellow-500/20 border-yellow-500 text-yellow-200';
        } else {
          optionClasses += 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/70 hover:border-gray-600';
        }
      }

      return (
        <li key={index}>
          <button onClick={() => handleOptionSelect(index)} disabled={isAnswered} className={optionClasses}>
            <div className="flex items-center justify-between">
              <span>{option.text}</span>
              {resultIndicator}
            </div>
          </button>
        </li>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-2xl p-8 m-4 bg-gray-900 border border-white/10 rounded-lg shadow-xl text-white">
        {!showResults ? (
          <>
            <div className="mb-6">
              <p className="text-sm font-bold tracking-wider text-yellow-500 uppercase">Quiz Challenge</p>
              <h2 className="text-3xl font-bold mt-2">{question.question}</h2>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-4">
                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
              </div>
            </div>
            <ul className="space-y-4">
              {renderOptions()}
            </ul>
            <div className="mt-8 flex justify-end">
              {!isAnswered ? (
                <button
                  onClick={checkAnswer}
                  disabled={selectedOptionIndex === null}
                  className="px-6 py-3 text-lg font-semibold text-gray-900 transition-colors bg-yellow-500 rounded-md hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 text-lg font-semibold text-gray-900 transition-colors bg-yellow-500 rounded-md hover:bg-yellow-400"
                >
                  {currentQ < questions.length - 1 ? 'Next Question' : 'Show Results'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-yellow-400">Quiz Complete!</h2>
            <p className="mt-4 text-xl text-gray-300">
              You scored <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{questions.length}</span>.
            </p>
            <p className="mt-2 text-gray-400">
              {score === questions.length ? "Perfect score! You're a true expert." : score > questions.length / 2 ? "Great job! You know your stuff." : "A good start! Keep exploring to learn more."}
            </p>
            <div className="mt-10 flex justify-center">
              <button
                onClick={onComplete}
                className="px-8 py-4 text-xl font-semibold text-gray-900 transition-colors bg-yellow-500 rounded-md hover:bg-yellow-400"
              >
                Continue Your Journey
              </button>
            </div>
          </div>
        )}
      </div>
       <style>{`
            @keyframes fade-in-fast {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in-fast {
                animation: fade-in-fast 0.3s ease-in-out;
            }
        `}</style>
    </div>
  );
};

export default QuizModal;