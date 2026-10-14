"use client";

import { useEffect, useRef } from "react";

export function useHomeMotion() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveals = [...element.querySelectorAll<HTMLElement>(".ed-reveal")];
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    const update = () => {
      frame = 0;
      const hero = element.querySelector<HTMLElement>(".ed-hero");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const offset = reduced.matches || window.innerWidth < 901 ? 0 : Math.min(rect.height, Math.max(0, -rect.top)) * 0.16;
      hero.style.setProperty("--hero-drift", `${offset}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const configure = () => {
      observer.disconnect();
      reveals.forEach(item => {
        const pending = !reduced.matches && item.getBoundingClientRect().top >= window.innerHeight;
        item.classList.toggle("is-pending", pending);
        if (pending) observer.observe(item);
        else item.classList.add("is-visible");
      });
      schedule();
    };
    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", configure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", configure);
      reveals.forEach(item => item.classList.remove("is-pending"));
    };
  }, []);
  return root;
}
