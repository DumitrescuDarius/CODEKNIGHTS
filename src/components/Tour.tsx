import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Check } from "lucide-react";

export type TourStep = {
  target: string; // DOM ID of the target element
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void; // Optional action to trigger when arriving at this step
};

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const Tour: React.FC<TourProps> = ({ steps, isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetRadius, setTargetRadius] = useState<number>(8);

  const updateRect = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    
    const step = steps[currentStepIndex];
    
    const extractAndSet = (element: Element) => {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      const computedStyle = window.getComputedStyle(element);
      let radius = parseInt(computedStyle.borderRadius) || 8;
      if (computedStyle.borderRadius.includes('%')) {
         const percent = parseFloat(computedStyle.borderRadius);
         radius = (Math.max(rect.width, rect.height) * percent) / 100;
      }
      setTargetRadius(radius);
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };

    const el = document.querySelector(step.target);
    if (el) {
      extractAndSet(el);
    } else {
      setTimeout(() => {
        const retryEl = document.querySelector(step.target);
        if (retryEl) {
          extractAndSet(retryEl);
        } else {
          setTargetRect(null);
        }
      }, 300);
    }
  }, [isOpen, steps, currentStepIndex]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateRect();
      window.addEventListener("resize", updateRect);
      return () => window.removeEventListener("resize", updateRect);
    }
  }, [currentStepIndex, isOpen, updateRect]);

  useEffect(() => {
    if (isOpen && steps[currentStepIndex]?.action) {
      steps[currentStepIndex].action!();
    }
  }, [currentStepIndex, isOpen, steps]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStepIndex];
  const isLast = currentStepIndex === steps.length - 1;

  // Calculate popover position
  let popoverTop = "50%";
  let popoverLeft = "50%";
  let transform = "translate(-50%, -50%)";

  if (targetRect && typeof window !== "undefined") {
    const margin = 15;
    const pos = step.position || "bottom";
    const popoverWidth = Math.min(350, window.innerWidth * 0.9);
    const popoverHeightEst = 220; // Estimated max height
    
    let top = 0;
    let left = 0;

    if (pos === "bottom") {
      top = targetRect.bottom + margin;
      left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    } else if (pos === "top") {
      top = targetRect.top - margin - popoverHeightEst;
      left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    } else if (pos === "right") {
      top = targetRect.top + targetRect.height / 2 - popoverHeightEst / 2;
      left = targetRect.right + margin;
    } else if (pos === "left") {
      top = targetRect.top + targetRect.height / 2 - popoverHeightEst / 2;
      left = targetRect.left - margin - popoverWidth;
    }

    // Clamp to viewport
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    
    left = Math.max(10, Math.min(left, ww - popoverWidth - 10));
    
    // Y-axis flip and clamp
    if (top + popoverHeightEst > wh - 10) {
       top = Math.max(10, targetRect.top - margin - popoverHeightEst); 
    }
    if (top < 10) {
       top = Math.min(wh - popoverHeightEst - 10, targetRect.bottom + margin); 
    }

    popoverTop = `${top}px`;
    popoverLeft = `${left}px`;
    transform = "none";
  }

  return (
    <>
      <div 
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          pointerEvents: "auto",
        }}
        onClick={(e) => {
           // Prevent clicks outside from doing anything, except if we want to allow clicking the spotlight
           e.stopPropagation();
        }}
      >
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
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask)" />
        </svg>
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
            background: "var(--window)",
            border: "1px solid var(--accent)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            width: "350px",
            maxWidth: "90vw",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            color: "var(--text)",
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
              color: "var(--text-muted)",
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
            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {step.content}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {currentStepIndex + 1} of {steps.length}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {currentStepIndex > 0 && (
                <button
                  onClick={() => setCurrentStepIndex(i => i - 1)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--line)",
                    color: "var(--text)",
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
              <button
                onClick={() => {
                  if (isLast) onClose();
                  else setCurrentStepIndex(i => i + 1);
                }}
                style={{
                  background: "var(--accent)",
                  color: "var(--bg)",
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
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
