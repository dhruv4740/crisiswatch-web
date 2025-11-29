"use client";

import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VerdictCardProps {
  claim: string;
  verdict: string;
  confidence: number;
  sources: number;
  evidence?: Array<{
    source: string;
    snippet?: string;
  }>;
  onClose?: () => void;
}

const verdictConfig: Record<string, { label: string; emoji: string; color: string; bgGradient: string }> = {
  TRUE: { 
    label: "NO CAP", 
    emoji: "✅", 
    color: "#22c55e",
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)"
  },
  FALSE: { 
    label: "THAT'S CAP", 
    emoji: "🧢", 
    color: "#ef4444",
    bgGradient: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)"
  },
  MOSTLY_FALSE: { 
    label: "MOSTLY CAP", 
    emoji: "🧢", 
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, #7c2d12 0%, #431407 100%)"
  },
  MOSTLY_TRUE: { 
    label: "LOWKEY TRUE", 
    emoji: "✅", 
    color: "#84cc16",
    bgGradient: "linear-gradient(135deg, #365314 0%, #1a2e05 100%)"
  },
  MIXED: { 
    label: "IT'S COMPLICATED", 
    emoji: "🤷", 
    color: "#eab308",
    bgGradient: "linear-gradient(135deg, #713f12 0%, #422006 100%)"
  },
  UNVERIFIABLE: { 
    label: "CAN'T TELL", 
    emoji: "🤔", 
    color: "#6b7280",
    bgGradient: "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
  },
};

export function VerdictCard({ claim, verdict, confidence, sources, evidence, onClose }: VerdictCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  
  const config = verdictConfig[verdict.toUpperCase().replace(/ /g, "_")] || verdictConfig.UNVERIFIABLE;
  
  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Instagram/Twitter friendly: 1200x630 (1.91:1 ratio)
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f0d0a");
    gradient.addColorStop(0.5, "#1a1714");
    gradient.addColorStop(1, "#0d0c0a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle grid pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Glow effect behind verdict
    const glowGradient = ctx.createRadialGradient(width / 2, 180, 0, width / 2, 180, 300);
    glowGradient.addColorStop(0, config.color + "40");
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Verdict badge
    const badgeWidth = 400;
    const badgeHeight = 80;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = 80;
    
    ctx.fillStyle = config.color + "30";
    ctx.strokeStyle = config.color + "60";
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 40);
    ctx.fill();
    ctx.stroke();
    
    // Verdict text
    ctx.fillStyle = config.color;
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${config.emoji} ${config.label}`, width / 2, badgeY + badgeHeight / 2);
    
    // Claim text (with word wrap)
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px system-ui, -apple-system, sans-serif";
    const claimLines = wrapText(ctx, `"${claim}"`, width - 160);
    const claimStartY = 220;
    claimLines.slice(0, 4).forEach((line, index) => {
      ctx.fillText(line, width / 2, claimStartY + index * 36);
    });
    if (claimLines.length > 4) {
      ctx.fillText("...", width / 2, claimStartY + 4 * 36);
    }
    
    // Stats section
    const statsY = 420;
    const statsWidth = 180;
    const statsGap = 40;
    const totalStatsWidth = statsWidth * 3 + statsGap * 2;
    const statsStartX = (width - totalStatsWidth) / 2;
    
    // Confidence stat
    drawStatBox(ctx, statsStartX, statsY, statsWidth, `${confidence}%`, "Confidence", config.color);
    
    // Sources stat
    drawStatBox(ctx, statsStartX + statsWidth + statsGap, statsY, statsWidth, sources.toString(), "Sources", "#6366f1");
    
    // Verdict stat
    const verdictShort = verdict === "TRUE" ? "✓" : verdict === "FALSE" ? "✗" : "?";
    drawStatBox(ctx, statsStartX + (statsWidth + statsGap) * 2, statsY, statsWidth, verdictShort, "Verdict", config.color);
    
    // Top sources (if available)
    if (evidence && evidence.length > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "14px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      const sourcesText = evidence.slice(0, 3).map(e => e.source).join(" • ");
      ctx.fillText(sourcesText, width / 2, 540);
    }
    
    // Branding
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🧢 Fact or Cap", width / 2, height - 40);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.fillText("factorcap.vercel.app", width / 2, height - 18);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  }, [claim, verdict, confidence, sources, evidence, config]);
  
  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
      // Fallback: download the image
      await handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factorcap-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleShareTwitter = async () => {
    const verdictEmoji = verdict === "TRUE" ? "✅" : verdict === "FALSE" ? "🧢" : "🤔";
    const text = encodeURIComponent(
      `${verdictEmoji} ${config.label}!\n\n"${claim.slice(0, 100)}${claim.length > 100 ? "..." : ""}"\n\n` +
      `${confidence}% confidence • ${sources} sources\n\n` +
      `Checked with Fact or Cap 🧢`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative max-w-2xl w-full bg-dark-900 rounded-2xl border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-white mb-4">Share Your Result</h3>
        
        {/* Preview card */}
        <div 
          className="relative aspect-[1.91/1] rounded-xl overflow-hidden mb-6"
          style={{ background: config.bgGradient }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div 
              className="px-6 py-2 rounded-full mb-4 border"
              style={{ 
                backgroundColor: config.color + "30",
                borderColor: config.color + "60"
              }}
            >
              <span className="text-lg font-bold" style={{ color: config.color }}>
                {config.emoji} {config.label}
              </span>
            </div>
            <p className="text-white text-sm md:text-base mb-4 line-clamp-3">"{claim}"</p>
            <div className="flex gap-6 text-white/80 text-sm">
              <span>{confidence}% confidence</span>
              <span>•</span>
              <span>{sources} sources</span>
            </div>
          </div>
          <div className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-xs">
            🧢 Fact or Cap
          </div>
        </div>
        
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            onClick={handleCopyImage}
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span className="text-xs text-white/80">
              {showCopied ? "Copied!" : "Copy Image"}
            </span>
          </motion.button>
          
          <motion.button
            onClick={handleDownload}
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-xs text-white/80">Download</span>
          </motion.button>
          
          <motion.button
            onClick={handleShareTwitter}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/30 transition-colors"
          >
            <svg className="w-6 h-6 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-xs text-[#1DA1F2]">Share on X</span>
          </motion.button>
        </div>
        
        {isGenerating && (
          <div className="absolute inset-0 bg-dark-900/80 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-3 text-white">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating image...
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Helper functions for canvas drawing
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function drawStatBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, value: string, label: string, color: string) {
  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(ctx, x, y, width, 70, 12);
  ctx.fill();
  
  // Value
  ctx.fillStyle = color;
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(value, x + width / 2, y + 32);
  
  // Label
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillText(label, x + width / 2, y + 54);
}

// Export a simple share button that can be used in live-demo
export function ShareVerdictButton({ 
  result, 
  className = "" 
}: { 
  result: {
    claim: string;
    verdict: string;
    confidence: number;
    sources: number;
    evidence?: Array<{ source: string; snippet?: string }>;
  };
  className?: string;
}) {
  const [showCard, setShowCard] = useState(false);
  
  return (
    <>
      <motion.button
        onClick={() => setShowCard(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-primary-300 hover:border-primary-500/50 transition-all text-sm font-medium ${className}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Create Card
      </motion.button>
      
      <AnimatePresence>
        {showCard && (
          <VerdictCard
            claim={result.claim}
            verdict={result.verdict}
            confidence={result.confidence}
            sources={result.sources}
            evidence={result.evidence}
            onClose={() => setShowCard(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
