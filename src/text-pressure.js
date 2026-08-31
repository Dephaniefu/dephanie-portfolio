// Vanilla adaptation of React Bits TextPressure (JS-CSS registry version).
const title = document.querySelector('[data-text-pressure]');

if (title) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const text = title.dataset.textPressure || 'Portfolio';
  const minFontSize = 36;
  const width = true;
  const weight = true;
  const italic = true;
  const alpha = false;
  const chars = [...text];
  const spans = chars.map(char => {
    const span = document.createElement('span');
    span.dataset.char = char;
    span.textContent = char;
    title.appendChild(span);
    return span;
  });

  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const getAttr = (distance, maxDist, minVal, maxVal) => {
    const val = maxVal - Math.abs((maxVal * distance) / maxDist);
    return Math.max(minVal, val + minVal);
  };

  const setSize = () => {
    const container = title.parentElement.getBoundingClientRect();
    title.style.fontSize = `${Math.max(container.width / (chars.length / 2), minFontSize)}px`;
  };

  const setPointer = (x, y) => {
    cursor.x = x;
    cursor.y = y;
  };

  window.addEventListener('mousemove', event => setPointer(event.clientX, event.clientY), { passive:true });
  window.addEventListener('touchmove', event => {
    const touch = event.touches[0];
    if (touch) setPointer(touch.clientX, touch.clientY);
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setSize, 100);
  });

  const container = title.parentElement.getBoundingClientRect();
  mouse.x = cursor.x = container.left + container.width / 2;
  mouse.y = cursor.y = container.top + container.height / 2;
  setSize();

  let frame = 0;
  let isVisible = true;
  const animate = () => {
    frame = 0;
    mouse.x += (cursor.x - mouse.x) / 15;
    mouse.y += (cursor.y - mouse.y) / 15;
    const titleRect = title.getBoundingClientRect();
    const maxDist = titleRect.width / 2;

    spans.forEach(span => {
      const rect = span.getBoundingClientRect();
      const distance = dist(mouse, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
      const wdth = width ? Math.floor(getAttr(distance, maxDist, 5, 200)) : 100;
      const wght = weight ? Math.floor(getAttr(distance, maxDist, 100, 900)) : 400;
      const ital = italic ? getAttr(distance, maxDist, 0, 1).toFixed(2) : 0;
      span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${ital}`;
      if (alpha) span.style.opacity = getAttr(distance, maxDist, 0, 1).toFixed(2);
    });

    if (isVisible && !document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(animate);
  };

  const requestAnimation = () => {
    if (!frame && isVisible && !document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(animate);
  };
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) requestAnimation();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold:0 });
  observer.observe(title);
  document.addEventListener('visibilitychange', requestAnimation);
  reduceMotion.addEventListener?.('change', requestAnimation);
  requestAnimation();
}
