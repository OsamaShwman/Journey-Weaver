

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { MapHandles } from './components/Map';
import Sidebar from './components/Sidebar';
import { INTRO_LANDMARK, FALLBACK_LANDMARKS } from './constants';
import type { Landmark, QuizQuestion, QuizOption, QuestionType } from './types';
import AddLandmarkModal from './components/AddLandmarkModal';
import QuizModal from './components/QuizModal';
import UploadIcon from './components/icons/UploadIcon';
import ChevronLeftIcon from './components/icons/ChevronLeftIcon';
import ChevronRightIcon from './components/icons/ChevronRightIcon';
import { getURLParams, hasRequiredParams } from './utils/urlParams';
import { transformBuilderDataToLandmarks } from './utils/dataTransform';

// Define the dataset access method on the window object for TypeScript
declare global {
  interface Window {
    le_v2: {
      getDataset: (name: string) => Promise<{
        readAll: () => Promise<Array<{[key: string]: any}>>;
      }>;
    };
  }
}

const isValidQuizQuestionArray = (data: any): data is QuizQuestion[] => {
  if (!Array.isArray(data)) {
    return false;
  }
  return data.every(q => {
    if (typeof q !== 'object' || q === null) return false;
    if (typeof q.question !== 'string' || !q.question.trim()) return false;
    if (q.type !== 'multiple-choice' && q.type !== 'true-false') return false;
    if (!Array.isArray(q.options)) return false;
    return q.options.every(o => 
      typeof o === 'object' && o !== null &&
      typeof o.text === 'string' &&
      typeof o.isCorrect === 'boolean'
    );
  });
};

const normalizeKeys = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(normalizeKeys);

  return Object.keys(obj).reduce((acc, key) => {
    const newKey = key.charAt(0).toLowerCase() + key.slice(1);
    acc[newKey] = normalizeKeys(obj[key]);
    return acc;
  }, {} as {[key: string]: any});
}

const parseAndValidateQuiz = (quizData: any): QuizQuestion[] | undefined => {
  if (!quizData) {
    return undefined;
  }

  let parsedQuiz = quizData;
  if (typeof parsedQuiz === 'string') {
    if (parsedQuiz.trim().startsWith('[') && parsedQuiz.trim().endsWith(']')) {
      try {
        parsedQuiz = JSON.parse(parsedQuiz);
      } catch (e) {
        console.warn("Failed to parse quiz data string:", quizData, e);
        return undefined;
      }
    } else {
        console.warn("Quiz data is a non-JSON string, skipping:", quizData);
        return undefined;
    }
  }

  // Normalize the object keys to be more forgiving of JSON format variations (e.g. "Question" vs "question")
  const normalizedQuiz = normalizeKeys(parsedQuiz);

  if (isValidQuizQuestionArray(normalizedQuiz) && normalizedQuiz.length > 0) {
    return normalizedQuiz;
  }
  
  if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
    console.warn("Invalid quiz data structure found. Original:", parsedQuiz, "Normalized:", normalizedQuiz);
  }
  
  return undefined;
};

// Transforms quiz data from the user-uploaded format to the application's internal format.
const transformUploadedQuiz = (questions: any[]): QuizQuestion[] | undefined => {
    if (!Array.isArray(questions)) return undefined;

    const transformed = questions.map((q: any): QuizQuestion | null => {
        if (!q || typeof q.text !== 'string' || !q.type || typeof q.answer === 'undefined') {
            return null;
        }

        let options: QuizOption[] = [];
        const questionType = String(q.type).toLowerCase();
        const answer = String(q.answer).trim();

        let internalType: QuestionType | null = null;
        
        if (questionType === 'multiple_choice') {
             internalType = 'multiple-choice';
             if (!Array.isArray(q.options)) return null;
             options = q.options.map((opt: any) => ({
                 text: String(opt).trim(),
                 isCorrect: String(opt).trim() === answer
             }));
        } else if (questionType === 'true_false') {
            internalType = 'true-false';
            const answerBool = answer.toLowerCase() === 'true';
            options = [
                { text: 'True', isCorrect: answerBool },
                { text: 'False', isCorrect: !answerBool }
            ];
        } else {
            return null; // Unsupported type
        }

        return {
            question: q.text,
            type: internalType,
            options,
        };
    }).filter((q): q is QuizQuestion => q !== null);

    return transformed.length > 0 ? transformed : undefined;
}


const App: React.FC = () => {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [baseLandmarks, setBaseLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0); // For map camera target
  const [sidebarIndex, setSidebarIndex] = useState(0); // For sidebar content
  const [animationClass, setAnimationClass] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; coords: [number, number] | null }>({ isOpen: false, coords: null });
  const [quizModalInfo, setQuizModalInfo] = useState<{ isOpen: boolean; questions: QuizQuestion[] | null; onComplete: () => void; }>({ isOpen: false, questions: null, onComplete: () => {} });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mapRef = useRef<MapHandles>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const justAddedLandmarkId = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      let loadedBaseLandmarks: Landmark[] = [];

      // Check for URL params to fetch from API
      const urlParams = getURLParams();
      if (hasRequiredParams(urlParams)) {
        try {
          const response = await fetch(`${urlParams.baseUrl}/organization/space/series/artifact/info/${urlParams.artifactId}/`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${urlParams.token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if ('artifact_data' in data && data.artifact_data) {
              try {
                const parsedData = JSON.parse(data.artifact_data);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                  // Transform the data from Interactive-Location-Builder format
                  const transformedLandmarks = transformBuilderDataToLandmarks(parsedData);
                  // Add intro landmark at the beginning
                  loadedBaseLandmarks = [INTRO_LANDMARK, ...transformedLandmarks];
                  setBaseLandmarks(loadedBaseLandmarks);
                  setLandmarks(loadedBaseLandmarks);
                  setIsLoading(false);
                  return; // Exit early, API data loaded successfully
                }
              } catch (parseError) {
                console.error('Failed to parse artifact_data:', parseError);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch artifact data from API:', error);
        }
      }

      // Fallback to dataset API or default landmarks
      if (window.le_v2?.getDataset) {
        try {
          const dataset = await window.le_v2.getDataset('locations');
          const items = await dataset.readAll();
          
          if (items && items.length > 0) {
            const formattedLandmarks: Landmark[] = items
              .map((item, index): Landmark | null => {
                let processedCoords: [number, number] | null = null;
                const rawCoords = item.coordinates;

                if (Array.isArray(rawCoords) && rawCoords.length === 2) {
                  // Ensure values are not null before converting, as Number(null) is 0.
                  if (rawCoords[0] !== null && rawCoords[1] !== null) {
                    const lat = Number(rawCoords[0]);
                    const lon = Number(rawCoords[1]);
                    
                    // isFinite also catches NaN from invalid Number() conversions like Number('foo')
                    if (isFinite(lat) && isFinite(lon)) {
                      processedCoords = [lat, lon];
                    }
                  }
                }

                if (!processedCoords) {
                    console.warn('Skipping landmark with invalid coordinates:', item);
                    return null;
                }

                // Check for quiz data under common alternative keys
                const quizData = item.quiz || item.Quiz || item.questions;
                const quiz = parseAndValidateQuiz(quizData);

                return {
                  id: index + 1,
                  name: item.city as string,
                  title: (item.city as string).toUpperCase(),
                  description: item.description as string,
                  imageUrl: item.image as string,
                  coords: processedCoords,
                  iconType: 'monument',
                  videoUrl: item.video as string | null,
                  audioUrl: item.audio as string | null,
                  quiz,
                  block_navigation: !!item.block_navigation,
                };
              })
              .filter((landmark): landmark is Landmark => landmark !== null); // Filter out invalid entries

            loadedBaseLandmarks = [INTRO_LANDMARK, ...formattedLandmarks];
          } else {
            loadedBaseLandmarks = [...FALLBACK_LANDMARKS];
          }
        } catch (error) {
          console.error("Failed to fetch landmarks from dataset, using fallback data:", error);
          loadedBaseLandmarks = [...FALLBACK_LANDMARKS];
        }
      } else {
        console.warn("Dataset API not found, using fallback data.");
        loadedBaseLandmarks = [...FALLBACK_LANDMARKS];
      }
      setBaseLandmarks(loadedBaseLandmarks);

      try {
        const customLandmarksJSON = localStorage.getItem('locations');
        let combinedLandmarks = [...loadedBaseLandmarks];

        if (customLandmarksJSON) {
          const loadedCustom = JSON.parse(customLandmarksJSON);
          if (Array.isArray(loadedCustom)) {
            const sanitizedCustom = loadedCustom.map((item: any): Landmark | null => {
              if (typeof item !== 'object' || item === null) return null;

              let processedCoords: [number, number] | null = null;
              const rawCoords = item.coords;

              if (Array.isArray(rawCoords) && rawCoords.length === 2) {
                if (rawCoords[0] !== null && rawCoords[1] !== null) {
                  const lat = Number(rawCoords[0]);
                  const lon = Number(rawCoords[1]);
                  if (isFinite(lat) && isFinite(lon)) {
                    processedCoords = [lat, lon];
                  }
                }
              }

              if (!processedCoords) return null;
              
              const name = item.name;
              if (typeof name !== 'string' || !name.trim()) return null;

              return {
                id: typeof item.id === 'number' ? item.id : Date.now(),
                name: name,
                title: item.title || name.toUpperCase(),
                description: item.description || '',
                imageUrl: item.imageUrl || `https://picsum.photos/seed/${item.id || name}/1200/800`,
                coords: processedCoords,
                iconType: ['monument', 'nature', 'water'].includes(item.iconType) ? item.iconType : 'monument',
                videoUrl: item.videoUrl || null,
                audioUrl: item.audioUrl || null,
                quiz: parseAndValidateQuiz(item.quiz),
                block_navigation: !!item.block_navigation,
              };
            }).filter((l): l is Landmark => l !== null);
            
            combinedLandmarks = [...loadedBaseLandmarks, ...sanitizedCustom];
          }
        }
        setLandmarks(combinedLandmarks);
      } catch (error) {
        console.error("Failed to load custom landmarks from localStorage:", error);
        setLandmarks(loadedBaseLandmarks); // Fallback to base landmarks
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (justAddedLandmarkId.current && landmarks.length > 0) {
        const newIndex = landmarks.findIndex(l => l.id === justAddedLandmarkId.current);
        if (newIndex !== -1) {
            setActiveIndex(newIndex);
            setSidebarIndex(newIndex);
            justAddedLandmarkId.current = null;
        }
    }
  }, [landmarks]);

  const handleNext = useCallback(() => {
    if (isTransitioning || landmarks.length === 0) return;
    
    const currentLandmark = landmarks[sidebarIndex];

    const transition = () => {
      setIsTransitioning(true);
      const nextIndex = (sidebarIndex + 1) % landmarks.length;
      const slideDuration = 400; 

      // 1. Start slide-out animation on sidebar AND start map travel
      setAnimationClass('animate-slide-out-left-full');
      setActiveIndex(nextIndex);

      // 2. After slide-out is done, swap sidebar content and slide it in
      setTimeout(() => {
        setSidebarIndex(nextIndex);
        setAnimationClass('animate-slide-in-right-full');
      }, slideDuration);

      // 3. Clean up animation state after the slide-in is complete
      setTimeout(() => {
        setAnimationClass('');
        setIsTransitioning(false);
      }, slideDuration * 2);
    };

    if (currentLandmark && currentLandmark.id !== 0 && currentLandmark.quiz && currentLandmark.quiz.length > 0 && currentLandmark.block_navigation) {
        setQuizModalInfo({
            isOpen: true,
            questions: currentLandmark.quiz,
            onComplete: () => {
                setQuizModalInfo({ isOpen: false, questions: null, onComplete: () => {} });
                transition();
            }
        });
    } else {
        transition();
    }
  }, [isTransitioning, sidebarIndex, landmarks]);

  const handlePrev = useCallback(() => {
    if (isTransitioning || landmarks.length === 0) return;

    setIsTransitioning(true);
    const nextIndex = (sidebarIndex - 1 + landmarks.length) % landmarks.length;
    const slideDuration = 400;

    setAnimationClass('animate-slide-out-right-full');
    setActiveIndex(nextIndex);

    setTimeout(() => {
      setSidebarIndex(nextIndex);
      setAnimationClass('animate-slide-in-left-full');
    }, slideDuration);

    setTimeout(() => {
      setAnimationClass('');
      setIsTransitioning(false);
    }, slideDuration * 2);
  }, [isTransitioning, sidebarIndex, landmarks.length]);

  const handleSelectLandmark = useCallback((id: number) => {
    if (isTransitioning) return;
    const index = landmarks.findIndex((landmark) => landmark.id === id);
    if (index !== -1 && index !== sidebarIndex) {
      setIsTransitioning(true);
      setAnimationClass('animate-fade-out');
      
      setTimeout(() => {
        setActiveIndex(index);
        setSidebarIndex(index);
        setAnimationClass('animate-fade-in-fast');
      }, 300); // fade out duration
      
      setTimeout(() => {
        setIsTransitioning(false);
        setAnimationClass('');
      }, 600); // fade out + fade in
    }
  }, [landmarks, isTransitioning, sidebarIndex]);

  const handleMapClick = useCallback((coords: [number, number]) => {
    // Add by map click functionality is disabled as its trigger has been removed.
  }, []);
  
  const handleSaveLandmark = useCallback((newLandmarkData: Omit<Landmark, 'id' | 'coords'>) => {
    if (!modalInfo.coords) return;
    
    const newLandmark: Landmark = {
      id: Date.now(),
      coords: modalInfo.coords,
      ...newLandmarkData,
    };

    justAddedLandmarkId.current = newLandmark.id;
    setLandmarks(prev => [...prev, newLandmark]);

    try {
      const currentCustom = JSON.parse(localStorage.getItem('locations') || '[]');
      const newCustom = [...currentCustom, newLandmark];
      localStorage.setItem('locations', JSON.stringify(newCustom));
    } catch (err) {
      console.error("Failed to save custom landmark to localStorage:", err);
    }
    
    setModalInfo({ isOpen: false, coords: null });
  }, [modalInfo.coords]);

  const handleCloseModal = useCallback(() => {
    setModalInfo({ isOpen: false, coords: null });
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
    // HACK: Leaflet sometimes doesn't update its size correctly when its container changes.
    // This timeout gives the CSS transition time to start, then invalidates the map size.
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) {
              throw new Error("File could not be read.");
            }
            const loadedData = JSON.parse(text);
            
            if (!Array.isArray(loadedData)) {
              throw new Error("Invalid data format. The JSON file must contain an array of landmarks.");
            }

            // Process items one by one, filtering out invalid ones. This is more robust.
            const newLandmarks: Landmark[] = loadedData.map((item: any, index: number): Landmark | null => {
                // Check for basic object structure
                if (typeof item !== 'object' || item === null) {
                    console.warn('Skipping non-object item from uploaded file:', item);
                    return null;
                }

                // Get and validate name, falling back to title if name/city are missing.
                const name = item.name || item.city || item.title;
                if (typeof name !== 'string' || !name.trim()) {
                    console.warn('Skipping uploaded landmark with invalid name:', item);
                    return null;
                }

                // Get and validate coordinates
                let processedCoords: [number, number] | null = null;
                const rawCoords = item.coords || item.coordinates;
                if (Array.isArray(rawCoords) && rawCoords.length === 2) {
                  if (rawCoords[0] !== null && rawCoords[1] !== null) {
                    const lat = Number(rawCoords[0]);
                    const lon = Number(rawCoords[1]);
                    if (isFinite(lat) && isFinite(lon)) {
                        processedCoords = [lat, lon];
                    }
                  }
                }
                
                if (!processedCoords) {
                    console.warn('Skipping uploaded landmark with invalid coordinates:', item);
                    return null;
                }
                
                let quiz: QuizQuestion[] | undefined;

                // Handle the new quiz format first
                if (item.questions) {
                    quiz = transformUploadedQuiz(item.questions);
                }

                // Fallback to the old format if the new one isn't present or is invalid
                if (!quiz) {
                    const quizData = item.quiz || item.Quiz; // Note: do not re-check item.questions
                    quiz = parseAndValidateQuiz(quizData);
                }

                // Reconstruct the landmark object to ensure it's valid and complete
                return {
                    id: item.id && typeof item.id === 'number' ? item.id : Date.now() + index,
                    name: name,
                    title: item.title || name.toUpperCase(),
                    description: item.description || '',
                    imageUrl: item.imageUrl || item.image || `https://picsum.photos/seed/${Date.now() + index}/1200/800`,
                    coords: processedCoords,
                    iconType: ['monument', 'nature', 'water'].includes(item.iconType) ? item.iconType : 'monument',
                    videoUrl: item.videoUrl || item.video || null,
                    audioUrl: item.audioUrl || item.audio || null,
                    quiz,
                    block_navigation: !!item.block_navigation,
                };
            }).filter((landmark): landmark is Landmark => landmark !== null);

            if (newLandmarks.length === 0) {
                alert("The uploaded JSON file contains no valid landmarks. Please ensure each landmark has a 'name', 'city', or 'title', and valid 'coordinates'.");
                return;
            }

            setLandmarks([INTRO_LANDMARK, ...newLandmarks]);
            // Go directly to the first landmark of the new tour
            // instead of resetting to the intro screen.
            setActiveIndex(1); 
            setSidebarIndex(1);
            
        } catch (err) {
            console.error("Error processing JSON file:", err);
            alert(`Could not load landmarks. Please check if the file is a valid JSON.\nError: ${(err as Error).message}`);
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.onerror = () => {
        alert('An error occurred while reading the file.');
    };
    reader.readAsText(file);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
        <h1 className="text-xl font-bold tracking-wider text-white/90">LOADING JOURNEY...</h1>
      </div>
    );
  }

  const currentSidebarLandmark = landmarks[sidebarIndex];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-white">
      <Map 
        ref={mapRef}
        landmarks={landmarks} 
        activeIndex={activeIndex} 
        onSelectLandmark={handleSelectLandmark}
        onMapClick={handleMapClick}
      />

      <header className="absolute top-0 left-0 z-20 flex items-center justify-between w-full p-4 bg-gradient-to-b from-black/70 to-transparent">
        <h1 className="text-xl font-bold tracking-wider text-white/90">Map</h1>
      </header>
      
      {/* Sidebar container */}
      <div className={`absolute top-0 right-0 z-30 h-full w-[450px] max-w-full transform transition-transform duration-500 ease-in-out ${isSidebarCollapsed ? 'translate-x-full' : 'translate-x-0'} ${animationClass}`}>
        {currentSidebarLandmark && (
          <Sidebar
            key={currentSidebarLandmark.id}
            landmark={currentSidebarLandmark}
            onNext={handleNext}
            onPrev={handlePrev}
            isTransitioning={isTransitioning}
          />
        )}
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={handleToggleSidebar}
        className={`absolute top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 transition-all duration-500 ease-in-out bg-gray-800/50 text-white/70 hover:bg-yellow-500/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
          isSidebarCollapsed 
          ? 'right-0 rounded-l-md' 
          : 'right-[450px] rounded-l-md'
        }`}
        aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
      >
        {isSidebarCollapsed ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
      </button>

      <AddLandmarkModal 
        isOpen={modalInfo.isOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLandmark}
      />

      <QuizModal 
        isOpen={quizModalInfo.isOpen}
        questions={quizModalInfo.questions || []}
        onComplete={quizModalInfo.onComplete}
      />

      {/* Floating Action Button for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="application/json"
        aria-hidden="true"
      />
      <button
        onClick={handleUploadClick}
        className="absolute z-20 flex items-center justify-center w-14 h-14 p-3 text-gray-900 transition-all duration-300 ease-in-out bg-yellow-500 rounded-full shadow-lg bottom-4 left-4 hover:bg-yellow-400 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-yellow-300"
        aria-label="Upload a tour from a JSON file"
        title="Upload a tour from a JSON file"
      >
        <UploadIcon className="w-full h-full" />
      </button>

      <style>{`
            /* New animation keyframes for full sidebar transitions */
            @keyframes slide-out-left-full {
                from { transform: translateX(0); }
                to { transform: translateX(-100vw); }
            }
            .animate-slide-out-left-full {
                animation: slide-out-left-full 0.4s ease-in forwards;
            }

            @keyframes slide-in-right-full {
                from { transform: translateX(100vw); }
                to { transform: translateX(0); }
            }
            .animate-slide-in-right-full {
                animation: slide-in-right-full 0.4s ease-out forwards;
            }

            @keyframes slide-out-right-full {
                from { transform: translateX(0); }
                to { transform: translateX(100vw); }
            }
            .animate-slide-out-right-full {
                animation: slide-out-right-full 0.4s ease-in forwards;
            }

            @keyframes slide-in-left-full {
                from { transform: translateX(-100vw); }
                to { transform: translateX(0); }
            }
            .animate-slide-in-left-full {
                animation: slide-in-left-full 0.4s ease-out forwards;
            }

            /* Fading animations for landmark selection */
            @keyframes fade-in-fast {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            .animate-fade-in-fast {
                animation: fade-in-fast 0.3s ease-in-out forwards;
            }
            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .animate-fade-out {
                animation: fade-out 0.3s ease-in-out forwards;
            }
        `}</style>

    </div>
  );
};

export default App;
