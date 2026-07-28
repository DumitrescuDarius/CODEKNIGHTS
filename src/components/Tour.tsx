import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Check } from "lucide-react";

export type TourStep = {
  target: string; // DOM ID of the target element
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void; // Optional action to trigger when arriving at this step
  disableNext?: boolean;
  nextOnClickTarget?: boolean;
  advanceOnEvent?: string;
  allowInteraction?: boolean | "full-screen";
};

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  isDemo?: boolean;
}

export const Tour: React.FC<TourProps> = ({ steps, isOpen, onClose, isDemo }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetRadius, setTargetRadius] = useState<number>(8);
  const lastRectRef = React.useRef<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    
    const step = steps[currentStepIndex];
    const el = document.querySelector(step.target);
    
    if (el) {
      const rect = el.getBoundingClientRect();
      const prev = lastRectRef.current;
      if (!prev || Math.abs(prev.left - rect.left) > 1 || Math.abs(prev.top - rect.top) > 1 || Math.abs(prev.width - rect.width) > 1 || Math.abs(prev.height - rect.height) > 1) {
        lastRectRef.current = rect;
        setTargetRect(rect);
        
        const computedStyle = window.getComputedStyle(el);
        let radius = parseInt(computedStyle.borderRadius) || 8;
        if (computedStyle.borderRadius.includes('%')) {
           const percent = parseFloat(computedStyle.borderRadius);
           radius = (Math.max(rect.width, rect.height) * percent) / 100;
        }
        setTargetRadius(radius);
      }
    } else {
      setTargetRect(null);
      lastRectRef.current = null;
    }
  }, [isOpen, steps, currentStepIndex]);

  useEffect(() => {
    if (isOpen && steps.length > 0) {
      const el = document.querySelector(steps[currentStepIndex].target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        setTimeout(() => {
          const retryEl = document.querySelector(steps[currentStepIndex].target);
          if (retryEl) retryEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 300);
      }
    }
  }, [currentStepIndex, isOpen, steps]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      let animationFrameId: number;
      const loop = () => {
        updateRect();
        animationFrameId = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [currentStepIndex, isOpen, updateRect]);

  useEffect(() => {
    if (isOpen && steps[currentStepIndex]?.action) {
      steps[currentStepIndex].action!();
    }
  }, [currentStepIndex, isOpen, steps]);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;
    const step = steps[currentStepIndex];
    if (step && step.advanceOnEvent) {
      const handleAdvance = () => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(i => i + 1);
        } else {
          onClose();
        }
      };
      window.addEventListener(step.advanceOnEvent, handleAdvance);
      return () => window.removeEventListener(step.advanceOnEvent, handleAdvance);
    }
  }, [currentStepIndex, isOpen, steps, onClose]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStepIndex];
  const isLast = currentStepIndex === steps.length - 1;

  // Calculate popover position
  let popoverTop = "50%";
  let popoverLeft = "50%";
  let transform = "translate(-50%, -50%)";

  if (targetRect && typeof window !== "undefined") {
    const margin = 15;
    const preferredPos = step.position || "bottom";
    const popoverWidth = Math.min(350, window.innerWidth * 0.9);
    const popoverHeightEst = 220; // Estimated max height
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    const positions = [preferredPos, "bottom", "top", "right", "left"].filter((v, i, a) => a.indexOf(v) === i);

    let bestTop = 0;
    let bestLeft = 0;
    let minOverlap = Infinity;

    for (const p of positions) {
      let t = 0;
      let l = 0;
      if (p === "bottom") {
        t = targetRect.bottom + margin;
        l = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
      } else if (p === "top") {
        t = targetRect.top - margin - popoverHeightEst;
        l = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
      } else if (p === "right") {
        t = targetRect.top + targetRect.height / 2 - popoverHeightEst / 2;
        l = targetRect.right + margin;
      } else if (p === "left") {
        t = targetRect.top + targetRect.height / 2 - popoverHeightEst / 2;
        l = targetRect.left - margin - popoverWidth;
      }

      // Clamp to viewport
      l = Math.max(10, Math.min(l, ww - popoverWidth - 10));
      t = Math.max(10, Math.min(t, wh - popoverHeightEst - 10));

      // Calculate overlap with targetRect
      const overlapX = Math.max(0, Math.min(l + popoverWidth, targetRect.right) - Math.max(l, targetRect.left));
      const overlapY = Math.max(0, Math.min(t + popoverHeightEst, targetRect.bottom) - Math.max(t, targetRect.top));
      const overlap = overlapX * overlapY;

      if (overlap < minOverlap) {
        minOverlap = overlap;
        bestTop = t;
        bestLeft = l;
        if (overlap === 0) break; // Found perfect position without overlap
      }
    }

    popoverTop = `${bestTop}px`;
    popoverLeft = `${bestLeft}px`;
    transform = "none";
  }

  return (
    <>
      <div 
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          pointerEvents: step.allowInteraction ? "none" : "auto",
        }}
        onClick={(e) => {
           if (step.nextOnClickTarget && targetRect) {
               const { clientX, clientY } = e;
               if (clientX >= targetRect.left && clientX <= targetRect.right && clientY >= targetRect.top && clientY <= targetRect.bottom) {
                   if (!isLast) setCurrentStepIndex(i => i + 1);
                   else onClose();
                   
                   const el = document.querySelector(step.target) as HTMLElement;
                   if (el) el.click();
                   return;
               }
           }
           if (!step.allowInteraction) e.stopPropagation();
        }}
      >
        {step.allowInteraction === true && targetRect && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: targetRect.top, pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
            <div style={{ position: 'absolute', top: targetRect.bottom, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
            <div style={{ position: 'absolute', top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height, pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
            <div style={{ position: 'absolute', top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height, pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
          </>
        )}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backdropFilter: step.allowInteraction === "full-screen" ? "none" : (isDemo ? "blur(1px)" : "blur(4px)"),
          WebkitBackdropFilter: step.allowInteraction === "full-screen" ? "none" : (isDemo ? "blur(1px)" : "blur(4px)"),
          mask: step.allowInteraction === "full-screen" ? "none" : "url(#tour-mask)",
          WebkitMask: step.allowInteraction === "full-screen" ? "none" : "url(#tour-mask)",
          pointerEvents: "none"
        }} />
        {step.allowInteraction !== "full-screen" && (
        <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={false}
                  animate={{
                    x: targetRect.left - 5,
                    y: targetRect.top - 5,
                    width: targetRect.width + 10,
                    height: targetRect.height + 10,
                    rx: targetRadius + 2,
                    ry: targetRadius + 2
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill={isDemo ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.85)"} mask="url(#tour-mask)" />
        </svg>
        )}
        
        {targetRect && step.nextOnClickTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              top: targetRect.top - 5,
              left: targetRect.left - 5,
              width: targetRect.width + 10,
              height: targetRect.height + 10,
              borderRadius: targetRadius + 2,
              background: 'var(--accent)',
              pointerEvents: 'none',
              zIndex: 10,
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            top: popoverTop,
            left: popoverLeft,
            transform: transform,
            zIndex: 10000,
            background: "rgba(10,10,10,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--accent)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            width: "350px",
            maxWidth: "90vw",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            color: "#ffffff",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            <X size={16} />
          </button>
          
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>
              {step.title}
            </h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              {step.content}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              {currentStepIndex + 1} of {steps.length}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {currentStepIndex > 0 && (
                <button
                  onClick={() => setCurrentStepIndex(i => i - 1)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.8)",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  Back
                </button>
              )}
              {!step.disableNext && (
                <button
                  onClick={() => {
                    if (isLast) onClose();
                    else setCurrentStepIndex(i => i + 1);
                  }}
                  style={{
                    background: "var(--accent)",
                    color: "#000000",
                    border: "none",
                    padding: "0.4rem 1rem",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                >
                  {isLast ? (
                    <>Finish <Check size={14} /></>
                  ) : (
                    <>Next <ChevronRight size={14} /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
