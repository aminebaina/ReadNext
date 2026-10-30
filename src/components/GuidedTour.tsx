import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Sparkles,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  speechText: string;
  actionBefore?: () => void;
  actionAfter?: () => void;
}

interface GuidedTourProps {
  isActive: boolean;
  onClose: () => void;
  onEnsureResults: () => void;
  onEnsureComparison: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isActive,
  onClose,
  onEnsureResults,
  onEnsureComparison,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('US English');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeStepRef = useRef(0);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      targetId: 'tour-header',
      title: 'Welcome to ReadNext',
      speechText:
        "Welcome to ReadNext! ReadNext solves a major classroom challenge: turning reluctant readers' video game and TV show passions into safe, captivating books using Qloo's cultural taste graph.",
    },
    {
      id: 'qloo-architecture',
      targetId: 'tour-qloo-panel',
      title: "Qloo's Cross-Domain Taste Graph",
      speechText:
        "Unlike standard book recommenders that require knowing literature genres, Qloo connects culture across boundaries. It maps the thematic DNA, pacing, and agency of video games directly into literature.",
    },
    {
      id: 'presets',
      targetId: 'tour-presets',
      title: 'Instant One-Click Presets',
      speechText:
        'Judges and educators can test instantly with one-click presets like Minecraft, Roblox plus Pokémon, or Zelda plus Avatar to see immediate cross-domain results in seconds.',
    },
    {
      id: 'age-band',
      targetId: 'tour-age-band',
      title: 'Target Student Age Band',
      speechText:
        "First, educators pick the student's grade level—from primary elementary to middle school and young adults. This activates specific literature genre tags and age boundaries in Qloo.",
    },
    {
      id: 'entity-picker',
      targetId: 'tour-entity-picker',
      title: 'Typed Entity Autocomplete',
      speechText:
        'Next, we add up to four favorite games or television series. Our autocomplete enforces explicit Qloo URN entity types, preventing popular titles from being misidentified as merchandise brands.',
    },
    {
      id: 'short-reads',
      targetId: 'tour-short-reads',
      title: 'Short Reads & Code Safety Gate',
      speechText:
        'Educators can enable the Short Reads filter to strictly limit books under 250 pages for hesitant readers. Our deterministic code gate also immediately blocks any adult or explicit tags.',
    },
    {
      id: 'results-explainability',
      targetId: 'tour-results',
      title: 'Empirical Explainability Scores',
      speechText:
        'Here are the recommended books! Notice the Qloo Taste Graph explainability bars: exact mathematical signal percentages showing how much each game or show contributed, avoiding LLM hallucinations.',
      actionBefore: () => {
        onEnsureResults();
      },
    },
    {
      id: 'taste-graph-bridge',
      targetId: 'tour-taste-graph',
      title: 'Interactive Cultural Taste Bridge',
      speechText:
        "Here, Qloo's multidimensional taste graph visually projects the student's gaming passions directly into literature, mapping implicit thematic DNA like survival agency and world-building.",
      actionBefore: () => {
        onEnsureResults();
      },
    },
    {
      id: 'librarian-notes',
      targetId: 'tour-teacher-note',
      title: 'Gemini Safety Gate & Teacher Notes',
      speechText:
        'Every candidate is verified through our Gemini Flash safety gate, ensuring zero inappropriate themes while providing concise, 25-word educator notes tailored for classroom guidance.',
    },
    {
      id: 'reading-passport',
      targetId: 'tour-reading-passport',
      title: 'Classroom Reading Passport',
      speechText:
        'Educators can immediately generate and print an official Classroom Reading Passport with student goals, checklist stamps, and teacher notes—ready for real-world school distribution.',
    },
    {
      id: 'comparison',
      targetId: 'tour-comparison-toggle',
      title: 'Compare with LLM-Only Baseline',
      speechText:
        "This toggle proves Qloo's superiority side-by-side. While generic LLMs only propose literal franchise spin-offs, Qloo uncovers genuine literary masterpieces with shared narrative spirit like Hatchet and The Wild Robot.",
      actionBefore: () => {
        onEnsureComparison();
      },
    },
    {
      id: 'security',
      targetId: 'tour-security-button',
      title: 'Enterprise Privacy & Compliance',
      speechText:
        'ReadNext runs with zero user accounts, zero cookies, and zero stored Qloo data. All secrets remain strictly server-side, with rate limiting and quota protection. Ready for submission!',
    },
  ];

  activeStepRef.current = currentStepIndex;

  // Find best American English voice
  const getAmericanVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();

    // Prefer high-quality US English voices
    const usVoices = voices.filter(
      (v) => v.lang === 'en-US' || v.lang === 'en_US' || v.lang.startsWith('en')
    );

    const naturalVoices = usVoices.find(
      (v) =>
        v.name.includes('Google') ||
        v.name.includes('Natural') ||
        v.name.includes('Samantha') ||
        v.name.includes('Zira') ||
        v.name.includes('Jenny') ||
        v.name.includes('David') ||
        v.name.includes('Guy')
    );

    return naturalVoices || usVoices[0] || voices[0] || null;
  }, []);

  // Highlight and scroll to active element
  const highlightStepElement = useCallback((targetId: string) => {
    // Remove previous highlights
    document.querySelectorAll('.tour-highlight-spotlight').forEach((el) => {
      el.classList.remove(
        'tour-highlight-spotlight',
        'ring-4',
        'ring-emerald-500',
        'ring-offset-4',
        'rounded-2xl',
        'transition-all',
        'duration-300'
      );
    });

    const elem = document.getElementById(targetId);
    if (elem) {
      elem.classList.add(
        'tour-highlight-spotlight',
        'ring-4',
        'ring-emerald-500',
        'ring-offset-4',
        'rounded-2xl',
        'transition-all',
        'duration-300'
      );
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Speak step
  const speakStep = useCallback(
    (index: number) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      const step = steps[index];
      if (!step) return;

      if (step.actionBefore) {
        step.actionBefore();
      }

      setTimeout(() => {
        highlightStepElement(step.targetId);
      }, 150);

      const utterance = new SpeechSynthesisUtterance(step.speechText);
      const voice = getAmericanVoice();
      if (voice) {
        utterance.voice = voice;
        setSelectedVoiceName(voice.name);
      }
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (step.actionAfter) {
          step.actionAfter();
        }
        // Auto-advance to next step if playing
        if (activeStepRef.current < steps.length - 1) {
          setTimeout(() => {
            setCurrentStepIndex((prev) => prev + 1);
          }, 800);
        } else {
          setIsPlaying(false);
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis notice:', e);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [getAmericanVoice, highlightStepElement, steps]
  );

  // Trigger tour start or step change
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      speakStep(currentStepIndex);
    } else {
      setIsPlaying(false);
      setIsSpeaking(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      document.querySelectorAll('.tour-highlight-spotlight').forEach((el) => {
        el.classList.remove(
          'tour-highlight-spotlight',
          'ring-4',
          'ring-emerald-500',
          'ring-offset-4',
          'rounded-2xl'
        );
      });
    }
  }, [isActive, currentStepIndex, speakStep]);

  // Handle voices loaded event in Chromium/Safari
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = getAmericanVoice();
        if (v) setSelectedVoiceName(v.name);
      };
    }
  }, [getAmericanVoice]);

  if (!isActive) return null;

  const currentStep = steps[currentStepIndex];

  const handlePauseResume = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsSpeaking(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsSpeaking(true);
      } else {
        setIsPlaying(true);
        speakStep(currentStepIndex);
      }
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleExit = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    document.querySelectorAll('.tour-highlight-spotlight').forEach((el) => {
      el.classList.remove(
        'tour-highlight-spotlight',
        'ring-4',
        'ring-emerald-500',
        'ring-offset-4',
        'rounded-2xl'
      );
    });
    onClose();
  };

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-slate-950/95 text-white border-2 border-emerald-500/80 shadow-2xl rounded-2xl p-4 sm:p-5 max-w-2xl w-full backdrop-blur-md transition-all duration-300 space-y-3">
        {/* Header & Indicator */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center">
              <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Interactive Guided Demo
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Wave Icon */}
            <div className="flex items-center gap-1 bg-emerald-950/70 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-[11px] font-mono">
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-emerald-300' : 'text-slate-400'}`} />
              <span className="hidden sm:inline truncate max-w-[120px]">
                {isSpeaking ? 'Narrating (en-US)' : 'Ready'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExit}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Narrator Text Card */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
          "{currentStep.speechText}"
        </p>

        {/* Progress Bar & Interactive Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Progress bar dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-700'
                    : 'w-2 bg-slate-700'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              type="button"
              onClick={handlePauseResume}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              {isSpeaking ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={currentStepIndex === steps.length - 1}
              onClick={handleNext}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleExit}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold transition-colors cursor-pointer ml-1"
            >
              Exit Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
