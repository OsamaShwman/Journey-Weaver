import type { Landmark, QuizQuestion, QuizOption } from '../types';

// Interactive-Location-Builder data format
interface BuilderLocation {
  id: string;
  title: string;
  country: string;
  description: string;
  image: string;
  video: string | null;
  audio: string | null;
  coordinates: [number, number];
  questions?: BuilderQuestion[];
  block_navigation?: boolean;
}

interface BuilderQuestion {
  id: string;
  text: string;
  type: 'short_answer' | 'true_false' | 'multiple_choice';
  options?: string[];
  answer: string;
}

/**
 * Transforms a quiz question from Interactive-Location-Builder format to Journey-Weaver format
 */
const transformQuestion = (question: BuilderQuestion): QuizQuestion | null => {
  // Handle true/false questions
  if (question.type === 'true_false') {
    const correctAnswer = question.answer.toLowerCase();
    return {
      question: question.text,
      type: 'true-false',
      options: [
        { text: 'True', isCorrect: correctAnswer === 'true' },
        { text: 'False', isCorrect: correctAnswer === 'false' },
      ],
    };
  }

  // Handle multiple choice questions
  if (question.type === 'multiple_choice' && question.options) {
    return {
      question: question.text,
      type: 'multiple-choice',
      options: question.options.map((optionText): QuizOption => ({
        text: optionText,
        isCorrect: optionText === question.answer,
      })),
    };
  }

  // Skip short_answer questions as Journey-Weaver doesn't support them
  return null;
};

/**
 * Transforms location data from Interactive-Location-Builder format to Journey-Weaver format
 */
export const transformBuilderDataToLandmarks = (builderData: BuilderLocation[]): Landmark[] => {
  return builderData.map((location, index): Landmark => {
    // Transform quiz questions
    let quiz: QuizQuestion[] | undefined = undefined;
    if (location.questions && location.questions.length > 0) {
      const transformedQuestions = location.questions
        .map(transformQuestion)
        .filter((q): q is QuizQuestion => q !== null);

      if (transformedQuestions.length > 0) {
        quiz = transformedQuestions;
      }
    }

    return {
      id: index + 1, // Use 1-based index for ID
      name: location.title,
      title: location.title,
      description: location.description,
      aliases: [location.country], // Store country as an alias
      imageUrl: location.image || 'https://via.placeholder.com/800x600?text=No+Image',
      coords: location.coordinates,
      iconType: 'monument', // Default icon type
      videoUrl: location.video,
      audioUrl: location.audio,
      quiz: quiz,
      block_navigation: location.block_navigation,
    };
  });
};
