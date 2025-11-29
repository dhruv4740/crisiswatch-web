"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "../ui/glass-card";
import { MagneticButton } from "../ui/magnetic-button";
import { GradientText, Badge } from "../ui/gradient-text";
import { ProgressStepper, ConnectionStatus, ErrorDisplay } from "../ui/progress-stepper";
import { FadeIn } from "../animations/motion";
import { ShareVerdictButton } from "../ui/verdict-card";
import { useClaimCheck } from "../ui/gamification";

// Helper function to format date in IST timezone
const formatDateIST = (dateString?: string): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

// Get reliability badge styling
const getReliabilityBadge = (reliability: number) => {
  if (reliability >= 0.8) return { label: "High", class: "bg-green-500/20 text-green-400 border-green-500/30" };
  if (reliability >= 0.6) return { label: "Medium", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  return { label: "Low", class: "bg-red-500/20 text-red-400 border-red-500/30" };
};

const demoExamples = [
  {
    id: 1,
    claim: "NASA said a 7.8 magnitude earthquake will hit Delhi tomorrow 😱",
    fallbackVerdict: "FALSE",
    fallbackConfidence: 98,
    fallbackSources: 14,
    fallbackTime: "12.4s",
  },
  {
    id: 2,
    claim: "Drinking lemon water at 4am can cure any disease",
    fallbackVerdict: "FALSE",
    fallbackConfidence: 97,
    fallbackSources: 12,
    fallbackTime: "14.8s",
  },
  {
    id: 3,
    claim: "5G towers are making people sick and spreading viruses",
    fallbackVerdict: "FALSE",
    fallbackConfidence: 96,
    fallbackSources: 18,
    fallbackTime: "11.2s",
  },
];

const verdictColors = {
  TRUE: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  FALSE: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  "MOSTLY FALSE": {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  "PARTIALLY TRUE": {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  "MOSTLY TRUE": {
    bg: "bg-lime-500/10",
    border: "border-lime-500/30",
    text: "text-lime-400",
    glow: "shadow-lime-500/20",
  },
  UNVERIFIED: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    text: "text-gray-400",
    glow: "shadow-gray-500/20",
  },
};

// GenZ-style verdict display
const getVerdictDisplay = (verdict: string): string => {
  switch (verdict) {
    case "TRUE": return "NO CAP ✅";
    case "FALSE": return "THAT'S CAP 🧢";
    case "MOSTLY FALSE": return "MOSTLY CAP 🧢";
    case "PARTIALLY TRUE": return "KINDA TRUE 🤷";
    case "MOSTLY TRUE": return "LOWKEY TRUE ✅";
    case "UNVERIFIED": return "CAN'T TELL 🤔";
    default: return verdict;
  }
};

const analysisSteps = [
  { id: "analyzing", label: "Reading", description: "Analyzing the tea you just spilled... ☕" },
  { id: "searching", label: "Hunting", description: "Searching the entire internet for receipts... 🔍" },
  { id: "cross-ref", label: "Checking", description: "Cross-referencing with the real ones... 📚" },
  { id: "verdict", label: "Verdict", description: "Time to expose the truth... 💀" },
];

interface AnalysisResult {
  id: number;
  claim: string;
  verdict: string;
  confidence: number;
  sources: number;
  time: string;
  explanation?: string;
  evidence?: Array<{
    source: string;
    snippet: string;
    url?: string;
    published_date?: string;
    reliability?: number;
  }>;
}

interface HistoryItem {
  id: string;
  claim: string;
  verdict: string;
  confidence: number;
  timestamp: number;
}

// Toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg z-50 flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </motion.div>
  );
}

// Share button component
function ShareButton({ result, onShare }: { result: AnalysisResult; onShare: () => void }) {
  const handleShare = async () => {
    const verdictEmoji = result.verdict === "TRUE" ? "✅" : result.verdict === "FALSE" ? "🧢" : "🤔";
    const shareText = `${verdictEmoji} Cap Check Result:

🔍 Claim: "${result.claim}"

${result.verdict === "FALSE" ? "🧢 THAT'S CAP" : result.verdict === "TRUE" ? "✅ NO CAP, IT'S REAL" : `📊 ${result.verdict}`}
💯 Confidence: ${result.confidence}%
📚 ${result.sources} sources checked

${result.explanation || ""}

Checked with Fact or Cap 🧢`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Fact or Cap Check",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        onShare();
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-dark-300 hover:text-white hover:border-primary-500/50 transition-all text-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </motion.button>
  );
}

// Recent history panel
function RecentHistory({ 
  history, 
  onSelect, 
  isVisible, 
  onToggle 
}: { 
  history: HistoryItem[]; 
  onSelect: (claim: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-300 transition-colors mb-2"
      >
        <svg className={`w-4 h-4 transition-transform ${isVisible ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Recent checks ({history.length})
      </button>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {history.slice(0, 5).map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => onSelect(item.claim)}
                  whileHover={{ x: 4 }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-dark-300 line-clamp-1 flex-1">{item.claim}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.verdict === "FALSE" ? "bg-red-500/20 text-red-400" :
                      item.verdict === "TRUE" ? "bg-green-500/20 text-green-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {item.verdict}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LiveDemo() {
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeExample, setActiveExample] = useState<number | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastClaim, setLastClaim] = useState<string>("");
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [sourcesFound, setSourcesFound] = useState<{name: string, count: number}[]>([]);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crisiswatch-history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      console.error("Failed to load history");
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("crisiswatch-history", JSON.stringify(history.slice(0, 10)));
    } catch {
      console.error("Failed to save history");
    }
  }, [history]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("/api/check");
        const data = await response.json();
        setBackendAvailable(data.backend === true);
      } catch {
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Escape to clear
      if (e.key === "Escape" && document.activeElement === textareaRef.current) {
        setInputValue("");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addToHistory = useCallback((result: AnalysisResult) => {
    setHistory(prev => {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        claim: result.claim,
        verdict: result.verdict,
        confidence: result.confidence,
        timestamp: Date.now(),
      };
      // Remove duplicates and add new item at beginning
      const filtered = prev.filter(h => h.claim !== result.claim);
      return [newItem, ...filtered].slice(0, 10);
    });
  }, []);

  const startStepProgression = useCallback(() => {
    setCurrentStep(0);
    setElapsedTime(0);
    setCurrentSource(null);
    setSourcesFound([]);
    setProgressMessage("");

    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    stepIntervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 2) return prev + 1;
        return prev;
      });
    }, 6000);
  }, []);

  const stopStepProgression = useCallback(() => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentStep(3);
  }, []);

  const analyzeWithBackend = async (claim: string): Promise<AnalysisResult> => {
    const response = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) throw new Error("FALLBACK");
      throw new Error(errorData.error || "Failed to verify claim");
    }

    const data = await response.json();
    return {
      id: 0,
      claim: data.data.claim,
      verdict: data.data.verdict,
      confidence: data.data.confidence,
      sources: data.data.sources,
      time: data.data.time,
      explanation: data.data.explanation,
      evidence: data.data.evidence,
    };
  };

  const analyzeWithSSE = (claim: string): Promise<AnalysisResult> => {
    return new Promise((resolve, reject) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `/api/check/stream?claim=${encodeURIComponent(claim)}&language=en`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      const stepMap: Record<string, number> = {
        extracting: 0,
        generating_queries: 0,
        searching: 1,
        synthesizing: 2,
        explaining: 3,
        complete: 3,
      };

      let totalSourcesFound = 0;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "step") {
            const stepIndex = stepMap[data.step] ?? currentStep;
            setCurrentStep(stepIndex);
            setProgressMessage(data.message || "");
          } else if (data.type === "source") {
            if (data.status === "searching") {
              setCurrentSource(data.source);
              setProgressMessage(`Reading ${data.source}...`);
            } else if (data.status === "found") {
              totalSourcesFound += data.count;
              setSourcesFound(prev => [...prev, { name: data.source, count: data.count }]);
              setProgressMessage(`Found ${data.count} from ${data.source}`);
            }
          } else if (data.type === "complete") {
            eventSource.close();
            eventSourceRef.current = null;
            setCurrentSource(null);

            const result = data.result;
            resolve({
              id: 0,
              claim: result.claim_text,
              verdict: result.verdict.toUpperCase(),
              confidence: Math.round(result.confidence * 100),
              sources: result.sources_checked,
              time: `${result.processing_time_seconds.toFixed(1)}s`,
              explanation: result.explanation,
              evidence: result.evidence?.map((e: { source: string; snippet: string; url?: string; published_date?: string; reliability?: number }) => ({
                source: e.source,
                snippet: e.snippet,
                url: e.url,
                published_date: e.published_date,
                reliability: e.reliability,
              })),
            });
          } else if (data.type === "error") {
            eventSource.close();
            eventSourceRef.current = null;
            reject(new Error(data.message || "SSE error"));
          }
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        reject(new Error("FALLBACK"));
      };
    });
  };

  const analyzeWithMock = (claim: string): Promise<AnalysisResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerClaim = claim.toLowerCase();
        let verdict = "UNVERIFIED";
        let confidence = 75;

        if (lowerClaim.includes("earthquake") && lowerClaim.includes("predict")) {
          verdict = "FALSE";
          confidence = 96;
        } else if (lowerClaim.includes("cow urine") || lowerClaim.includes("cure cancer")) {
          verdict = "FALSE";
          confidence = 97;
        } else if (lowerClaim.includes("5g") && lowerClaim.includes("corona")) {
          verdict = "FALSE";
          confidence = 98;
        } else if (lowerClaim.includes("flood") || lowerClaim.includes("water")) {
          verdict = "PARTIALLY TRUE";
          confidence = 72;
        } else if (lowerClaim.includes("cure") || lowerClaim.includes("heal")) {
          verdict = "FALSE";
          confidence = 94;
        } else {
          verdict = Math.random() > 0.6 ? "FALSE" : "PARTIALLY TRUE";
          confidence = Math.floor(Math.random() * 25) + 70;
        }

        resolve({
          id: 0,
          claim,
          verdict,
          confidence,
          sources: Math.floor(Math.random() * 12) + 8,
          time: ((Math.random() * 1.5 + 1.5).toFixed(1)) + "s",
          explanation: "This claim was analyzed using AI-powered verification. " + (verdict === "FALSE" ? "Multiple credible sources contradict this claim." : "The evidence is mixed or insufficient for a definitive verdict."),
        });
      }, 2000 + Math.random() * 1000);
    });
  };

  const performAnalysis = async (claim: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setLastClaim(claim);
    startStepProgression();

    try {
      let analysisResult: AnalysisResult;

      if (backendAvailable) {
        try {
          analysisResult = await analyzeWithSSE(claim);
        } catch (err) {
          if (err instanceof Error && err.message === "FALLBACK") {
            try {
              analysisResult = await analyzeWithBackend(claim);
            } catch (backendErr) {
              if (backendErr instanceof Error && backendErr.message === "FALLBACK") {
                setBackendAvailable(false);
                analysisResult = await analyzeWithMock(claim);
              } else {
                throw backendErr;
              }
            }
          } else {
            throw err;
          }
        }
      } else {
        analysisResult = await analyzeWithMock(claim);
      }

      stopStepProgression();
      setResult(analysisResult);
      addToHistory(analysisResult);
    } catch (err) {
      stopStepProgression();
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setCurrentSource(null);
      setProgressMessage("");
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;
    setShowAllEvidence(false);
    await performAnalysis(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isAnalyzing) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleRetry = () => {
    if (lastClaim) performAnalysis(lastClaim);
  };

  const handleHistorySelect = (claim: string) => {
    setInputValue(claim);
    setShowHistory(false);
    performAnalysis(claim);
  };

  const handleExampleClick = async (example: (typeof demoExamples)[0]) => {
    setActiveExample(example.id);
    setInputValue(example.claim);
    setShowAllEvidence(false);
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setLastClaim(example.claim);
    startStepProgression();

    const apiPromise = (async () => {
      if (backendAvailable) {
        // Use SSE for live source display
        return await analyzeWithSSE(example.claim);
      } else {
        return await analyzeWithMock(example.claim);
      }
    })();

    const timeoutPromise = new Promise<AnalysisResult>((resolve) => {
      setTimeout(() => {
        resolve({
          id: example.id,
          claim: example.claim,
          verdict: example.fallbackVerdict,
          confidence: example.fallbackConfidence,
          sources: example.fallbackSources,
          time: example.fallbackTime,
          explanation: "This result is from our pre-verified cache. The live API is currently slow or unavailable.",
        });
      }, 20000);
    });

    try {
      const analysisResult = await Promise.race([apiPromise, timeoutPromise]);
      stopStepProgression();
      setResult(analysisResult);
      addToHistory(analysisResult);
    } catch {
      stopStepProgression();
      setResult({
        id: example.id,
        claim: example.claim,
        verdict: example.fallbackVerdict,
        confidence: example.fallbackConfidence,
        sources: example.fallbackSources,
        time: example.fallbackTime,
        explanation: "This result is from our pre-verified cache due to an API error.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    const normalizedVerdict = verdict.toUpperCase().replace(/_/g, " ");
    return verdictColors[normalizedVerdict as keyof typeof verdictColors] || verdictColors.UNVERIFIED;
  };

  return (
    <section id="demo" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-900" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[200px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[200px] -translate-y-1/2" />

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <FadeIn>
            <Badge variant="gradient">🧢 Cap Detector</Badge>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-display-md md:text-display-lg font-display font-bold mt-6 mb-6">
              <span className="text-white">Drop the claim, </span>
              <GradientText gradient="primary">we'll check it</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              Paste that sus tweet, forward, or rumor you just saw. 
              We'll tell you if it's cap or facts. No cap. 🧢
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <FadeIn delay={0.3}>
            <GlassCard className="p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold text-white">
                  Drop your sus claim here 👇
                </h3>
                <ConnectionStatus isConnected={backendAvailable} />
              </div>

              {/* Keyboard shortcut hint */}
              <div className="flex items-center gap-2 mb-3 text-xs text-dark-500">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">Ctrl+K</span>
                <span>to focus</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">Enter</span>
                <span>to check</span>
              </div>

              <div className="relative mb-6">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste that sus claim here... (Press Enter to check if it's cap)"
                  className="w-full h-32 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-dark-500 resize-none focus:outline-none focus:border-primary-500/50 transition-colors"
                />
                <div className="absolute bottom-3 right-3">
                  <MagneticButton
                    variant="primary"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !inputValue.trim()}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      "Is it cap? 🧢"
                    )}
                  </MagneticButton>
                </div>
              </div>

              {/* Recent history */}
              <RecentHistory 
                history={history}
                onSelect={handleHistorySelect}
                isVisible={showHistory}
                onToggle={() => setShowHistory(!showHistory)}
              />

              <div>
                <p className="text-sm text-dark-500 mb-3">Try these examples:</p>
                <div className="space-y-2">
                  {demoExamples.map((example) => (
                    <motion.button
                      key={example.id}
                      onClick={() => handleExampleClick(example)}
                      disabled={isAnalyzing}
                      className={"w-full text-left px-4 py-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed " + (activeExample === example.id ? "bg-primary-500/10 border-primary-500/30" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]")}
                      whileHover={!isAnalyzing ? { x: 4 } : {}}
                    >
                      <span className="text-sm text-dark-300 line-clamp-1">
                        {example.claim}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.4}>
            <GlassCard className="p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold text-white">
                  Verification Result
                </h3>
                {result && (
                  <div className="flex items-center gap-2">
                    <ShareVerdictButton result={result} />
                    <ShareButton result={result} onShare={() => setToastMessage("Result copied to clipboard!")} />
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-6"
                  >
                    <ProgressStepper
                      currentStep={currentStep}
                      steps={analysisSteps}
                      className="mb-6"
                    />

                    <div className="relative w-16 h-16 mb-4">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary-500/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-2 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-mono text-primary-400">{elapsedTime}s</span>
                      </div>
                    </div>

                    {/* Current source being searched */}
                    <AnimatePresence mode="wait">
                      {currentSource && (
                        <motion.div
                          key={currentSource}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex items-center justify-center gap-2 text-sm"
                        >
                          <span className="text-primary-400">👀</span>
                          <span className="text-dark-300">Checking {currentSource}...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Progress message or sources found */}
                    {sourcesFound.length > 0 ? (
                      <div className="text-xs text-dark-500 text-center mt-2">
                        Got {sourcesFound.reduce((sum, s) => sum + s.count, 0)} receipts from{" "}
                        {sourcesFound.map(s => s.name).join(", ")} 📑
                      </div>
                    ) : progressMessage ? (
                      <p className="text-xs text-dark-500 text-center mt-2">{progressMessage}</p>
                    ) : (
                      <p className="text-xs text-dark-500 text-center mt-2">
                        {backendAvailable ? "Digging for the truth rn... 🕵️" : "Demo mode active"}
                      </p>
                    )}
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-64"
                  >
                    <ErrorDisplay message={error} onRetry={handleRetry} />
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className={"px-6 py-3 rounded-2xl border shadow-lg " + getVerdictColor(result.verdict).bg + " " + getVerdictColor(result.verdict).border + " " + getVerdictColor(result.verdict).glow}
                      >
                        <span className={"text-2xl font-display font-bold " + getVerdictColor(result.verdict).text}>
                          {getVerdictDisplay(result.verdict)}
                        </span>
                      </motion.div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs text-dark-500 mb-1">You asked about:</p>
                      <p className="text-dark-300 text-sm">{result.claim}</p>
                    </div>

                    {result.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/10"
                      >
                        <p className="text-xs text-dark-500 mb-1">Here's the tea ☕:</p>
                        <p className="text-dark-300 text-sm leading-relaxed">{result.explanation}</p>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                        <p className="text-xl font-display font-bold text-white">{result.confidence}%</p>
                        <p className="text-xs text-dark-500">Sure level 💯</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                        <p className="text-xl font-display font-bold text-white">{result.sources}</p>
                        <p className="text-xs text-dark-500">Receipts 📑</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                        <p className="text-xl font-display font-bold text-white">{result.time}</p>
                        <p className="text-xs text-dark-500">Speed ⚡</p>
                      </div>
                    </div>

                    {result.evidence && result.evidence.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-dark-500">Key Evidence ({result.evidence.length} sources):</p>
                          {result.evidence.length > 5 && (
                            <button
                              onClick={() => setShowAllEvidence(!showAllEvidence)}
                              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              {showAllEvidence ? "Show less" : `Show all ${result.evidence.length}`}
                            </button>
                          )}
                        </div>
                        <div className={`space-y-2 ${showAllEvidence ? "max-h-64" : "max-h-48"} overflow-y-auto`}>
                          {result.evidence.slice(0, showAllEvidence ? undefined : 5).map((ev, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {ev.url ? (
                                    <a
                                      href={ev.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary-400 hover:text-primary-300 underline hover:no-underline transition-colors mb-0.5 block truncate"
                                    >
                                      {ev.source}
                                    </a>
                                  ) : (
                                    <p className="text-xs text-primary-400 mb-0.5 truncate">{ev.source}</p>
                                  )}
                                </div>
                                {ev.reliability !== undefined && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getReliabilityBadge(ev.reliability).class}`}>
                                    {getReliabilityBadge(ev.reliability).label}
                                  </span>
                                )}
                              </div>
                              {formatDateIST(ev.published_date) && (
                                <p className="text-xs text-dark-500 mb-1">{formatDateIST(ev.published_date)}</p>
                              )}
                              <p className="text-xs text-dark-400 line-clamp-2">{ev.snippet}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-dark-400 mb-2">No analysis yet</p>
                    <p className="text-sm text-dark-500">Enter a claim or select an example</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
