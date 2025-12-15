import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * AnimatedCounter Component
 * Animates a number from 0 to target value when in viewport
 *
 * @param {number} value - Target value to count up to
 * @param {number} duration - Animation duration in seconds (default: 2)
 * @param {string} suffix - Optional suffix to append (e.g., "+", "K")
 */
export default function AnimatedCounter({ value, duration = 2, suffix = "" }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toLocaleString() + suffix;
      }
    });
  }, [springValue, suffix]);

  return <motion.span ref={ref}>0{suffix}</motion.span>;
}
