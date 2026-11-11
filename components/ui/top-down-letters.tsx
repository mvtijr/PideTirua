"use client";

import React, { ElementType, useEffect, useRef } from "react";

export interface TopDownLettersProps {
  text: string;
  className?: string;
  as?: ElementType;
  staggerDuration?: number;
  delay?: number;
  dropDistance?: number;
  once?: boolean;
  immediate?: boolean;
  id?: string;
  children?: React.ReactNode;
}

// Singleton compartido para observar múltiples encabezados con un único IntersectionObserver
let sharedObserver: IntersectionObserver | null = null;
const observedCallbacks = new WeakMap<Element, (intersecting: boolean) => void>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = observedCallbacks.get(entry.target);
          if (cb) cb(entry.isIntersecting);
        }
      },
      { rootMargin: "-10px 0px -10px 0px", threshold: 0.1 }
    );
  }
  return sharedObserver;
}

export function TopDownLetters({
  text,
  className = "",
  as: Component = "h2",
  staggerDuration = 0.045,
  delay = 0,
  once = true,
  immediate,
  id,
  children,
}: TopDownLettersProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const isHeroHeading = immediate ?? Component === "h1";

  useEffect(() => {
    if (isHeroHeading) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = getSharedObserver();
    if (!observer) {
      el.classList.add("td-visible");
      return;
    }

    observedCallbacks.set(el, (intersecting) => {
      if (intersecting) {
        el.classList.add("td-visible");
        if (once) {
          observer.unobserve(el);
          observedCallbacks.delete(el);
        }
      } else if (!once) {
        el.classList.remove("td-visible");
      }
    });

    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observedCallbacks.delete(el);
    };
  }, [isHeroHeading, once]);

  // El H1 principal siempre renderiza visible en el HTML inicial sin esperar a JavaScript
  if (isHeroHeading) {
    return (
      <Component id={id} className={`${className} td-immediate`.trim()}>
        {text}
        {children}
      </Component>
    );
  }

  const words = text.split(" ");

  return (
    <Component ref={containerRef} id={id} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-block">
        {words.map((word, wordIndex) => (
          <span
            key={`${word}-${wordIndex}`}
            className="td-word whitespace-nowrap mr-[0.26em] last:mr-0"
            style={
              {
                "--td-d": `${Math.round((delay + wordIndex * staggerDuration) * 1000)}ms`,
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        ))}
      </span>
      {children}
    </Component>
  );
}

export default TopDownLetters;
