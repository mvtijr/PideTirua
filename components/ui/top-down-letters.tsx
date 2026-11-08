"use client";

import React, { ElementType, useEffect, useRef, useState } from "react";

export interface TopDownLettersProps {
  text: string;
  className?: string;
  as?: ElementType;
  staggerDuration?: number;
  delay?: number;
  dropDistance?: number;
  once?: boolean;
  id?: string;
  children?: React.ReactNode;
}

export function TopDownLetters({
  text,
  className = "",
  as: Component = "h2",
  staggerDuration = 0.02,
  delay = 0,
  dropDistance = -20,
  once = true,
  id,
  children,
}: TopDownLettersProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { rootMargin: "-10px 0px -10px 0px", threshold: 0.15 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    } else {
      setIsVisible(true);
    }
  }, [once]);

  const words = text.split(" ");
  let globalLetterIndex = 0;

  return (
    <Component ref={containerRef} id={id} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-block">
        {words.map((word, wordIndex) => (
          <span
            key={`${word}-${wordIndex}`}
            className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0"
          >
            {word.split("").map((letter) => {
              const currentIdx = globalLetterIndex++;
              const animDelay = delay + currentIdx * staggerDuration;
              return (
                <span
                  key={`${letter}-${currentIdx}`}
                  className="inline-block transition-all duration-400 ease-out"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? "translateY(0) rotateX(0deg)"
                      : `translateY(${dropDistance}px) rotateX(25deg)`,
                    transitionDelay: `${animDelay}s`,
                    willChange: "transform, opacity",
                  }}
                >
                  {letter}
                </span>
              );
            })}
          </span>
        ))}
      </span>
      {children}
    </Component>
  );
}

export default TopDownLetters;
