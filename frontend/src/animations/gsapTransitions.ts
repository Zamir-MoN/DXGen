import gsap from 'gsap';

const prefersReducedMotion = () => {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const animatePageIn = (target: HTMLElement | null) => {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
  );
};

export const animateCardsIn = (selector: string | HTMLElement[]) => {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    selector,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
  );
};

export const animateContentIn = (target: HTMLElement | null) => {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { opacity: 0, scale: 0.98, y: 10 },
    { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out' }
  );
};

export const animateModalIn = (target: HTMLElement | null) => {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.4)' }
  );
};
