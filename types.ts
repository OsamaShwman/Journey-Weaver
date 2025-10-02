
export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export type QuestionType = 'multiple-choice' | 'true-false';

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options: QuizOption[];
}

export interface Landmark {
  id: number;
  name: string;
  title: string;
  description: string;
  aliases?: string[];
  imageUrl: string;
  coords: [number, number];
  iconType: 'monument' | 'nature' | 'water';
  videoUrl?: string | null;
  audioUrl?: string | null;
  quiz?: QuizQuestion[];
  block_navigation?: boolean;
}
