(() => {
  const grid = document.querySelector('.skills-grid');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('.skill-card')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sweepVersions = new WeakMap();

  const easeOutCubic = value => 1 - Math.pow(1 - value, 3);
  const easeInCubic = value => value * value * value;

  const animateValue = (card, version, key, { start, end, duration, delay = 0, ease = easeOutCubic, suffix = '' }) => {
    const startedAt = performance.now() + delay;
    const tick = now => {
      if (sweepVersions.get(card) !== version) return;
      if (now < startedAt) {
        requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startedAt) / duration, 1);
      card.style.setProperty(key, `${start + (end - start) * ease(progress)}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const runSweep = card => {
    const version = (sweepVersions.get(card) || 0) + 1;
    sweepVersions.set(card, version);
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', '110deg');
    animateValue(card, version, '--edge-proximity', { start:0, end:100, duration:500 });
    animateValue(card, version, '--cursor-angle', { start:110, end:287.5, duration:1500, ease:easeInCubic, suffix:'deg' });
    animateValue(card, version, '--cursor-angle', { start:287.5, end:465, duration:2250, delay:1500, suffix:'deg' });
    animateValue(card, version, '--edge-proximity', { start:100, end:0, duration:1500, delay:2500, ease:easeInCubic });
    window.setTimeout(() => {
      if (sweepVersions.get(card) === version) card.classList.remove('sweep-active');
    }, 4050);
  };

  cards.forEach(card => {
    card.classList.add('border-glow-card');
    if (!card.querySelector(':scope > .edge-light')) {
      const edge = document.createElement('span');
      edge.className = 'edge-light';
      edge.setAttribute('aria-hidden', 'true');
      card.append(edge);
    }

    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = event.clientX - rect.left - centerX;
      const deltaY = event.clientY - rect.top - centerY;
      const kx = deltaX === 0 ? Infinity : centerX / Math.abs(deltaX);
      const ky = deltaY === 0 ? Infinity : centerY / Math.abs(deltaY);
      const proximity = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      card.style.setProperty('--edge-proximity', (proximity * 100).toFixed(3));
      card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    });
  });

  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      cards.forEach(runSweep);
    });
  }, { threshold:.22, rootMargin:'0px 0px -8% 0px' });
  observer.observe(grid);
})();
