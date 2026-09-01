const carouselRail = document.querySelector('.project-grid');
const carouselSection = document.querySelector('.projects');

if (carouselRail && carouselSection) {
  const originalCards = [...carouselRail.querySelectorAll('.project-card')];
  const originalCount = originalCards.length;
  const reduceCarouselMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gradientLayer = document.createElement('div');
  gradientLayer.className = 'project-gradient-bg';
  gradientLayer.setAttribute('aria-hidden', 'true');
  carouselSection.prepend(gradientLayer);

  const makeClone = card => {
    const clone = card.cloneNode(true);
    clone.dataset.carouselClone = 'true';
    clone.setAttribute('aria-hidden', 'true');
    clone.tabIndex = -1;
    clone.querySelectorAll('a,button,input,textarea,select').forEach(control => control.tabIndex = -1);
    return clone;
  };

  const beforeCards = originalCards.map(makeClone);
  const afterCards = originalCards.map(makeClone);
  carouselRail.prepend(...beforeCards);
  carouselRail.append(...afterCards);

  const carouselCards = [...carouselRail.querySelectorAll('.project-card')];
  const middleStartIndex = originalCount;
  const middleEndIndex = originalCount * 2;
  let activeIndex = middleStartIndex;
  let animationFrame = 0;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragLastScroll = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;
  let isDragging = false;
  let isPositioned = false;
  let wheelEndTimer = 0;
  let resizeFrame = 0;
  let cardCenters = [];
  let cardWidths = [];
  let cycleStart = 0;
  let cycleEnd = 0;
  let cycleWidth = 0;

  originalCards.forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Project ${index + 1} of ${originalCount}`);
  });

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const logicalIndex = physicalIndex => ((physicalIndex - middleStartIndex) % originalCount + originalCount) % originalCount;

  // Card geometry only changes on resize. Cache it so scrolling never mixes
  // layout reads with transform writes on every animation frame.
  const measureCarousel = () => {
    cardCenters = carouselCards.map(card => card.offsetLeft + card.offsetWidth / 2);
    cardWidths = carouselCards.map(card => card.offsetWidth);
    cycleStart = carouselCards[middleStartIndex]?.offsetLeft || 0;
    cycleEnd = carouselCards[middleEndIndex]?.offsetLeft || 0;
    cycleWidth = cycleEnd - cycleStart;
  };

  const closestCardIndex = targetCenter => {
    let closestIndex = middleStartIndex;
    let closestDistance = Number.POSITIVE_INFINITY;
    cardCenters.forEach((center, index) => {
      const distance = Math.abs(center - targetCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const averageColor = (data, startX, endX, width, height) => {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    for (let y = 0; y < height; y += 2) {
      for (let x = startX; x < endX; x += 2) {
        const offset = (y * width + x) * 4;
        if (data[offset + 3] < 120) continue;
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        count++;
      }
    }
    if (!count) return 'rgba(103,71,210,.42)';
    return `rgba(${Math.round(red / count)},${Math.round(green / count)},${Math.round(blue / count)},.48)`;
  };

  const applyImageGradient = image => {
    if (!image || !image.complete || !image.naturalWidth) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 20;
      const context = canvas.getContext('2d', { willReadFrequently:true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const left = averageColor(pixels, 0, 16, canvas.width, canvas.height);
      const right = averageColor(pixels, 16, 32, canvas.width, canvas.height);
      gradientLayer.style.background = `radial-gradient(circle at 22% 50%,${left},transparent 43%),radial-gradient(circle at 78% 52%,${right},transparent 47%)`;
    } catch (_) {
      gradientLayer.style.background = 'radial-gradient(circle at 22% 50%,rgba(105,72,210,.42),transparent 42%),radial-gradient(circle at 78% 52%,rgba(64,30,126,.5),transparent 46%)';
    }
  };

  const centerCard = (index, behavior = 'smooth') => {
    if (!carouselCards[index] || cardCenters[index] == null) return;
    const left = cardCenters[index] - carouselRail.clientWidth / 2;
    carouselRail.scrollTo({ left, behavior });
  };

  const normalizeInfinitePosition = () => {
    if (!isPositioned || !originalCount || !cycleWidth) return;
    const center = carouselRail.scrollLeft + carouselRail.clientWidth / 2;
    const boundaryStart = cycleStart - 14;
    const boundaryEnd = cycleEnd - 14;
    let shift = 0;
    if (center < boundaryStart) shift = cycleWidth;
    else if (center >= boundaryEnd) shift = -cycleWidth;
    if (!shift) return;
    carouselRail.scrollLeft += shift;
    if (isDragging) {
      dragStartScroll += shift;
      dragLastScroll += shift;
    }
  };

  const updateCarousel = () => {
    animationFrame = 0;
    normalizeInfinitePosition();
    const center = carouselRail.scrollLeft + carouselRail.clientWidth / 2;
    const closestIndex = closestCardIndex(center);

    carouselCards.forEach((card, index) => {
      const cardWidth = cardWidths[index] || 1;
      const distance = cardCenters[index] - center;
      const normalized = clamp(distance / (cardWidth + 28), -1.65, 1.65);
      const magnitude = Math.abs(normalized);
      const rotation = normalized * -18;
      const depth = magnitude * -105;
      const scale = 1 - Math.min(magnitude * .075, .12);
      card.style.transform = reduceCarouselMotion ? 'none' : `translateZ(${depth}px) rotateY(${rotation}deg) scale(${scale})`;
      card.style.opacity = reduceCarouselMotion ? '1' : String(1 - Math.min(magnitude * .14, .26));
      card.style.zIndex = String(20 - Math.round(magnitude * 10));
    });

    if (closestIndex !== activeIndex) {
      activeIndex = closestIndex;
      carouselCards.forEach((card, index) => card.classList.toggle('is-active', index === activeIndex));
      const activeImage = originalCards[logicalIndex(activeIndex)]?.querySelector('.project-cover-image');
      if (activeImage?.complete) applyImageGradient(activeImage);
      else activeImage?.addEventListener('load', () => applyImageGradient(activeImage), { once:true });
    }
  };

  const requestCarouselUpdate = () => {
    if (!animationFrame) animationFrame = requestAnimationFrame(updateCarousel);
  };

  carouselRail.addEventListener('scroll', requestCarouselUpdate, { passive:true });
  window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      measureCarousel();
      centerCard(middleStartIndex + logicalIndex(activeIndex), 'auto');
      requestCarouselUpdate();
    });
  }, { passive:true });

  carouselRail.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? carouselRail.clientWidth : 1;
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit;
    if (!delta) return;
    event.preventDefault();
    carouselRail.scrollLeft += delta;
    window.clearTimeout(wheelEndTimer);
    wheelEndTimer = window.setTimeout(() => {
      normalizeInfinitePosition();
      const center = carouselRail.scrollLeft + carouselRail.clientWidth / 2;
      centerCard(closestCardIndex(center));
    }, 130);
  }, { passive:false });

  carouselRail.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('a')) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = carouselRail.scrollLeft;
    dragLastScroll = dragStartScroll;
    dragLastTime = event.timeStamp;
    dragVelocity = 0;
    carouselRail.classList.add('is-dragging');
    carouselRail.setPointerCapture(event.pointerId);
  });

  carouselRail.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const nextScroll = dragStartScroll - (event.clientX - dragStartX);
    const elapsed = Math.max(event.timeStamp - dragLastTime, 1);
    const instantVelocity = (nextScroll - dragLastScroll) / elapsed;
    dragVelocity = dragVelocity * .65 + instantVelocity * .35;
    dragLastScroll = nextScroll;
    dragLastTime = event.timeStamp;
    carouselRail.scrollLeft = nextScroll;
  });

  const stopDragging = event => {
    if (!isDragging) return;
    isDragging = false;
    carouselRail.classList.remove('is-dragging');
    if (carouselRail.hasPointerCapture(event.pointerId)) carouselRail.releasePointerCapture(event.pointerId);
    normalizeInfinitePosition();
    const projectedCenter = carouselRail.scrollLeft + carouselRail.clientWidth / 2 + dragVelocity * 170;
    centerCard(closestCardIndex(projectedCenter));
  };

  carouselRail.addEventListener('pointerup', stopDragging);
  carouselRail.addEventListener('pointercancel', stopDragging);
  carouselRail.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      centerCard(activeIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      centerCard(activeIndex - 1);
    }
  });

  carouselCards.forEach((card, index) => {
    card.addEventListener('click', event => {
      if (!event.target.closest('a')) centerCard(index);
    });
  });

  requestAnimationFrame(() => {
    measureCarousel();
    isPositioned = true;
    centerCard(middleStartIndex, 'auto');
    updateCarousel();
  });
}
