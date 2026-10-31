"use client";

import React, { ElementType } from "react";
import { motion, type Variants } from "motion/react";

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
  dropDistance = -26,
  once = false,
  id,
  children,
}: TopDownLettersProps) {
  const words = text.split(" ");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDuration,
        delayChildren: delay,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: {
      opacity: 0,
      y: dropDistance,
      rotateX: 35,
      filter: "blur(2px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 14,
        stiffness: 150,
        mass: 0.6,
      },
    },
  };

  return (
    <Component id={id} className={className}>
      <motion.span
        className="inline-block"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.25, margin: "-10px 0px -10px 0px" }}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden="true" className="inline">
          {words.map((word, wordIndex) => (
            <span
              key={`${word}-${wordIndex}`}
              className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0"
            >
              {word.split("").map((letter, letterIndex) => (
                <motion.span
                  key={`${letter}-${letterIndex}`}
                  variants={letterVariants}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          ))}
        </span>
      </motion.span>
      {children}
    </Component>
  );
}

export default TopDownLetters;
