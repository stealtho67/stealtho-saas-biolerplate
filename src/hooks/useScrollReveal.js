import { useEffect, useRef } from "react";

/**
 * Attach to a container element. Children with data-reveal will fade+slide up
 * as they enter the viewport. Respects prefers-reduced-motion.
 */
export function useScrollReveal({ stagger = 80 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const container = ref.current;
    if (!container) return;

    const targets = Array.from(container.querySelectorAll("[data-reveal]"));
    targets.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      el.style.transition = `opacity 0.4s ease-out ${i * stagger}ms, transform 0.4s ease-out ${i * stagger}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stagger]);

  return ref;
}