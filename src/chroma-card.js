(() => {
  const card = document.querySelector('.portrait-wrap');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!card || reducedMotion.matches) return;

  let frame = 0;

  const reset = () => {
    cancelAnimationFrame(frame);
    card.classList.remove('is-chroma-active');
    card.style.setProperty('--chroma-rx', '0deg');
    card.style.setProperty('--chroma-ry', '0deg');
    card.style.setProperty('--chroma-scale', '1');
    card.style.setProperty('--chroma-red-x', '0px');
    card.style.setProperty('--chroma-red-y', '0px');
    card.style.setProperty('--chroma-blue-x', '0px');
    card.style.setProperty('--chroma-blue-y', '0px');
  };

  const update = event => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));

      card.classList.add('is-chroma-active');
      card.style.setProperty('--chroma-rx', `${(-y * 6).toFixed(2)}deg`);
      card.style.setProperty('--chroma-ry', `${(x * 6).toFixed(2)}deg`);
      card.style.setProperty('--chroma-scale', '1.035');
      card.style.setProperty('--chroma-red-x', `${(3 + x * 8).toFixed(2)}px`);
      card.style.setProperty('--chroma-red-y', `${(y * 5).toFixed(2)}px`);
      card.style.setProperty('--chroma-blue-x', `${(-3 - x * 8).toFixed(2)}px`);
      card.style.setProperty('--chroma-blue-y', `${(-y * 5).toFixed(2)}px`);
    });
  };

  card.tabIndex = 0;
  card.setAttribute('aria-label', 'Interactive portrait with chromatic color shift');
  card.addEventListener('pointermove', update);
  card.addEventListener('pointerleave', reset);
  card.addEventListener('blur', reset);
  card.addEventListener('focus', () => {
    card.classList.add('is-chroma-active');
    card.style.setProperty('--chroma-scale', '1.025');
    card.style.setProperty('--chroma-red-x', '3px');
    card.style.setProperty('--chroma-blue-x', '-3px');
  });
})();
