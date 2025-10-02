

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Landmark } from '../types';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';

interface GeminiChatProps {
  landmark: Landmark;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const suggestedQuestions = (landmarkName: string) => [
  `Tell me a fun fact about ${landmarkName}.`,
  `What is the history of this place?`,
  `Why is this place famous?`,
];

const GeminiChat: React.FC<GeminiChatProps> = ({ landmark }) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Clear conversation when landmark changes
  useEffect(() => {
    setConversation([]);
    setQuestion('');
    setError(null);
  }, [landmark]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading, error]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: messageText };
    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: messageText,
        config: {
          systemInstruction: `You are an expert and friendly tour guide for Jordan. The user is asking about the landmark "${landmark.name}". Answer their question concisely and helpfully.`,
        }
      });

      let fullResponse = '';
      setConversation(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if(chunkText) {
            fullResponse += chunkText;
            setConversation(prev => {
                const newConversation = [...prev];
                const lastMessage = newConversation[newConversation.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.text = fullResponse;
                }
                return newConversation;
            });
        }
      }

    } catch (err) {
      console.error("Gemini API error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Sorry, I couldn't get an answer. ${errorMessage}`);
      // Clean up the placeholder if the API call fails
      setConversation(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'model' && lastMessage.text === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSend = () => {
    sendMessage(question);
    setQuestion('');
  };

  return (
    <div className="pt-2">
      <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-3">
        Ask a Question
      </h3>
      <div className="bg-black/20 rounded-lg p-3 max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-yellow-500/80 text-gray-900 font-medium' : 'bg-gray-700/60 text-gray-300'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && conversation[conversation.length - 1]?.role !== 'model' && (
          <div className="flex justify-start">
             <div className="bg-gray-700/60 text-gray-300 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
            </div>
          </div>
        )}
        {error && (
            <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-lg bg-red-900/70 border border-red-700/80 text-red-200">
                    <p className="text-sm font-semibold">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        )}
        <div ref={conversationEndRef} />
      </div>

      {/* Suggested Questions */}
      {conversation.length === 0 && !isLoading && !error && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions(landmark.name).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => sendMessage(suggestion)}
              className="px-3 py-1 text-sm text-gray-300 bg-gray-700/60 rounded-full hover:bg-gray-600/80 transition-colors"
              aria-label={`Ask: ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-3 flex items-center space-x-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask about ${landmark.name}...`}
          className="flex-grow w-full px-3 py-2 text-sm bg-black/30 text-white/90 placeholder-gray-500 border border-white/10 rounded-md focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-all"
          disabled={isLoading}
          aria-label="Ask a question about the current landmark"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !question.trim()}
          className="flex-shrink-0 p-2 text-white transition-colors bg-yellow-600 rounded-md hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          aria-label="Send question"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default GeminiChat;