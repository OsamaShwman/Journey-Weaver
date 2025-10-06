import { getURLParams } from './urlParams';

export interface QuizAnswer {
  questionIndex: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizSubmissionData {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  answers: QuizAnswer[];
  completedAt: string;
}

/**
 * Submit quiz results to the API
 */
export const submitQuizResults = async (submissionData: QuizSubmissionData): Promise<boolean> => {
  const urlParams = getURLParams();

  // Check if we have the required parameters
  if (!urlParams.token || !urlParams.artifactId || !urlParams.baseUrl) {
    console.warn('Missing required URL parameters for quiz submission');
    return false;
  }

  try {
    const content = JSON.stringify(submissionData);

    const response = await fetch(
      `${urlParams.baseUrl}/organization/results/artifact/${urlParams.artifactId}/submission/`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${urlParams.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifacts: parseInt(urlParams.artifactId),
          content: content,
          status: 'submitted',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Quiz results submitted successfully');
    return true;
  } catch (error) {
    console.error('Failed to submit quiz results:', error);
    return false;
  }
};
