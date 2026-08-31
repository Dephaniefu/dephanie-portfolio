// Buildless spring/drag adaptation of React Bits Lanyard interaction.
const lanyard = document.querySelector('.contact-lanyard');

if (lanyard) {
  const state = { x:0, y:0, vx:0, vy:0, rotation:0, vr:0, targetX:0, targetY:0, dragging:false };
  let pointerStart = { x:0, y:0 };
  let objectStart = { x:0, y:0 };

  lanyard.addEventListener('pointerdown', event => {
    state.dragging = true;
    pointerStart = { x:event.clientX, y:event.clientY };
    objectStart = { x:state.x, y:state.y };
    lanyard.setPointerCapture(event.pointerId);
    requestAnimation();
  });

  lanyard.addEventListener('pointermove', event => {
    if (!state.dragging) return;
    state.targetX = objectStart.x + event.clientX - pointerStart.x;
    state.targetY = objectStart.y + event.clientY - pointerStart.y;
    state.targetX = Math.max(-360, Math.min(220, state.targetX));
    state.targetY = Math.max(-60, Math.min(210, state.targetY));
  });

  const release = event => {
    if (!state.dragging) return;
    state.dragging = false;
    state.targetX = 0;
    state.targetY = 0;
    if (lanyard.hasPointerCapture(event.pointerId)) lanyard.releasePointerCapture(event.pointerId);
  };
  lanyard.addEventListener('pointerup', release);
  lanyard.addEventListener('pointercancel', release);

  // Mouse fallback keeps the interaction available in browsers/automation
  // surfaces that emit classic mouse events instead of PointerEvents.
  lanyard.addEventListener('mousedown', event => {
    if (state.dragging) return;
    state.dragging = true;
    pointerStart = { x:event.clientX, y:event.clientY };
    objectStart = { x:state.x, y:state.y };
    requestAnimation();
  });
  window.addEventListener('mousemove', event => {
    if (!state.dragging) return;
    state.targetX = Math.max(-360, Math.min(220, objectStart.x + event.clientX - pointerStart.x));
    state.targetY = Math.max(-60, Math.min(210, objectStart.y + event.clientY - pointerStart.y));
  });
  window.addEventListener('mouseup', () => {
    if (!state.dragging) return;
    state.dragging = false;
    state.targetX = 0;
    state.targetY = 0;
  });

  let frame = 0;
  let isVisible = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animateLanyard = () => {
    frame = 0;
    const spring = state.dragging ? .22 : .045;
    const damping = state.dragging ? .72 : .925;
    state.vx = (state.vx + (state.targetX - state.x) * spring) * damping;
    state.vy = (state.vy + (state.targetY - state.y) * spring) * damping;
    state.x += state.vx;
    state.y += state.vy;

    const targetRotation = Math.max(-18, Math.min(18, state.x * .045 + state.vx * .16));
    state.vr = (state.vr + (targetRotation - state.rotation) * .08) * .88;
    state.rotation += state.vr;
    lanyard.style.transform = `translate3d(${state.x}px,${state.y}px,0) rotate(${state.rotation}deg)`;
    const motion = Math.abs(state.vx) + Math.abs(state.vy) + Math.abs(state.vr) + Math.abs(state.x) + Math.abs(state.y);
    if (introActive && !state.dragging && motion < .12) introActive = false;
    const moving = state.dragging || motion > .12;
    if (isVisible && !document.hidden && (moving || introActive)) frame = requestAnimationFrame(animateLanyard);
  };

  const requestAnimation = () => {
    if (!frame && isVisible && !document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(animateLanyard);
  };

  let introActive = false;
  const contactSection = document.querySelector('.contact');
  if (contactSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const entryObserver = new IntersectionObserver(entries => {
      const isEntering = entries[0].isIntersecting;
      isVisible = isEntering;
      if (isEntering && !introActive && !state.dragging) {
        introActive = true;
        state.rotation = -10;
        state.vr = 2.4;
        requestAnimation();
      }
      if (!isEntering) {
        introActive = false;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold:.3 });
    entryObserver.observe(contactSection);
  }

  document.addEventListener('visibilitychange', requestAnimation);
}
