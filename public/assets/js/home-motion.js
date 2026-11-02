const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const elements = document.querySelectorAll('[data-reveal]');
const running = new Set();
let observer;

function reveal(element) {
  element.classList.add('is-revealed');
  if (reducedMotion.matches || element.dataset.reveal === 'line' || !element.animate) return;

  const transform = element.dataset.reveal === 'left'
    ? 'translate3d(-36px, 0, 0)'
    : 'translate3d(0, 38px, 0)';
  const animation = element.animate([
    { opacity: 0, transform },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  ], {
    duration: 850,
    delay: Number(element.dataset.revealDelay || 0),
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fill: 'backwards',
  });
  running.add(animation);
  animation.finished.then(() => running.delete(animation), () => running.delete(animation));
}

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      reveal(entry.target);
    }
  }, { threshold: 0.12 });
  elements.forEach(element => observer.observe(element));
}

document.addEventListener('focusin', event => {
  if (!(event.target instanceof Element)) return;
  const element = event.target.closest('[data-reveal]');
  if (!element) return;
  observer?.unobserve(element);
  for (const animation of element.getAnimations()) animation.finish();
});

reducedMotion.addEventListener('change', event => {
  if (!event.matches) return;
  observer?.disconnect();
  for (const animation of running) animation.cancel();
  running.clear();
});

addEventListener('pagehide', () => {
  for (const animation of running) animation.cancel();
  running.clear();
});
