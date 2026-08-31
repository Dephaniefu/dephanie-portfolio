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
  let isDragging = false;
  let isPositioned = false;

  originalCards.forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Project ${index + 1} of ${originalCount}`);
  });

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const logicalIndex = physicalIndex => ((physicalIndex - middleStartIndex) % originalCount + originalCount) % originalCount;

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
    const card = carouselCards[index];
    if (!card) return;
    const left = card.offsetLeft - (carouselRail.clientWidth - card.offsetWidth) / 2;
    carouselRail.scrollTo({ left, behavior });
  };

  const normalizeInfinitePosition = () => {
    if (!isPositioned || !originalCount) return;
    const cycleStart = carouselCards[middleStartIndex].offsetLeft;
    const cycleEnd = carouselCards[middleEndIndex].offsetLeft;
    const cycleWidth = cycleEnd - cycleStart;
    const center = carouselRail.scrollLeft + carouselRail.clientWidth / 2;
    const boundaryStart = cycleStart - 14;
    const boundaryEnd = cycleEnd - 14;
    if (center < boundaryStart) carouselRail.scrollLeft += cycleWidth;
    else if (center >= boundaryEnd) carouselRail.scrollLeft -= cycleWidth;
  };

  const updateCarousel = () => {
    animationFrame = 0;
    normalizeInfinitePosition();
    const center = carouselRail.scrollLeft + carouselRail.clientWidth / 2;
    let closestIndex = middleStartIndex;
    let closestDistance = Number.POSITIVE_INFINITY;

    carouselCards.forEach((card, index) => {
      const cardWidth = card.offsetWidth;
      const distance = card.offsetLeft + cardWidth / 2 - center;
      const normalized = clamp(distance / (cardWidth + 28), -1.65, 1.65);
      const magnitude = Math.abs(normalized);
      const rotation = normalized * -18;
      const depth = magnitude * -105;
      const scale = 1 - Math.min(magnitude * .075, .12);
      card.style.transform = reduceCarouselMotion ? 'none' : `translateZ(${depth}px) rotateY(${rotation}deg) scale(${scale})`;
      card.style.opacity = reduceCarouselMotion ? '1' : String(1 - Math.min(magnitude * .14, .26));
      card.style.zIndex = String(20 - Math.round(magnitude * 10));
      if (Math.abs(distance) < closestDistance) {
        closestDistance = Math.abs(distance);
        closestIndex = index;
      }
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
    centerCard(middleStartIndex + logicalIndex(activeIndex), 'auto');
    requestCarouselUpdate();
  }, { passive:true });

  carouselRail.addEventListener('wheel', event => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    event.preventDefault();
    carouselRail.scrollLeft += delta * .8;
  }, { passive:false });

  carouselRail.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('a')) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = carouselRail.scrollLeft;
    carouselRail.classList.add('is-dragging');
    carouselRail.setPointerCapture(event.pointerId);
  });

  carouselRail.addEventListener('pointermove', event => {
    if (!isDragging) return;
    carouselRail.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });

  const stopDragging = event => {
    if (!isDragging) return;
    isDragging = false;
    carouselRail.classList.remove('is-dragging');
    if (carouselRail.hasPointerCapture(event.pointerId)) carouselRail.releasePointerCapture(event.pointerId);
    centerCard(activeIndex);
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
    isPositioned = true;
    centerCard(middleStartIndex, 'auto');
    updateCarousel();
  });
}
