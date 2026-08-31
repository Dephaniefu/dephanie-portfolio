(() => {
  const hero = document.querySelector('#top');
  const video = hero?.querySelector('.hero-video');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !video || reduceMotion.matches) return;

  let isVisible = false;

  const playFromStart = () => {
    video.currentTime = 0;
    const playback = video.play();
    if (playback) playback.catch(() => {});
  };

  const observer = new IntersectionObserver(([entry]) => {
    const entered = entry.isIntersecting && entry.intersectionRatio >= 0.18;
    if (entered && !isVisible) playFromStart();
    if (!entered && isVisible) video.pause();
    isVisible = entered;
  }, { threshold: [0, 0.18, 0.5] });

  observer.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (isVisible) video.play().catch(() => {});
  });
})();
