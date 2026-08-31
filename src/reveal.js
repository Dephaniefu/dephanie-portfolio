const aboutTargets = [];
const skillTargets = [];
const educationTargets = [];
const projectTitleTargets = [];
const careerTargets = [];

document.querySelectorAll('.about-copy > *, .stats > div').forEach((element, index) => {
  element.classList.add('reveal-item', 'reveal-text');
  element.style.setProperty('--reveal-delay', `${index * 65}ms`);
  aboutTargets.push(element);
});

document.querySelectorAll('.skills-grid .skill-card').forEach(element => {
  element.classList.add('reveal-item');
  element.style.setProperty('--reveal-delay', '0ms');
  skillTargets.push(element);
});

document.querySelectorAll('.skills > .section-title').forEach(element => {
  element.classList.add('reveal-item');
  element.style.setProperty('--reveal-delay', '0ms');
  skillTargets.push(element);
});

document.querySelectorAll('#education > .section-title').forEach(element => {
  element.classList.add('reveal-item');
  element.style.setProperty('--reveal-delay', '0ms');
  educationTargets.push(element);
});

document.querySelectorAll('#projects > .section-title').forEach(element => {
  element.classList.add('reveal-item');
  element.style.setProperty('--reveal-delay', '0ms');
  projectTitleTargets.push(element);
});

document.querySelectorAll('#career .timeline > .section-title').forEach(element => {
  element.classList.add('reveal-item');
  element.style.setProperty('--reveal-delay', '0ms');
  careerTargets.push(element);
});

if ('IntersectionObserver' in window) {
  // A single observer services every reveal section. This avoids five separate
  // viewport callbacks while preserving the replay-on-reentry behaviour.
  const revealGroups = new Map([
    [document.querySelector('#about'), aboutTargets],
    [document.querySelector('.skills'), skillTargets],
    [document.querySelector('#education'), educationTargets],
    [document.querySelector('#projects'), projectTitleTargets],
    [document.querySelector('#career'), careerTargets]
  ]);
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      revealGroups.get(entry.target)?.forEach(target => target.classList.toggle('is-visible', entry.isIntersecting));
    });
  }, { threshold:.14, rootMargin:'0px 0px -8% 0px' });
  revealGroups.forEach((_, section) => section && revealObserver.observe(section));
} else {
  [...aboutTargets, ...skillTargets, ...educationTargets, ...projectTitleTargets, ...careerTargets].forEach(element => element.classList.add('is-visible'));
}

const projectSection = document.querySelector('.projects');
const projectRail = document.querySelector('.project-grid');
if (projectSection && projectRail && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let hasAutoScrolled = false;
  const projectObserver = new IntersectionObserver(entries => {
    const entry = entries[0];
    if (!entry.isIntersecting || hasAutoScrolled) return;
    hasAutoScrolled = true;
    const start = projectRail.scrollLeft;
    const maxDistance = Math.min(320, projectRail.scrollWidth - projectRail.clientWidth);
    const duration = 1400;
    let startTime;
    const glide = time => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      projectRail.scrollLeft = start + maxDistance * eased;
      if (progress < 1) requestAnimationFrame(glide);
    };
    requestAnimationFrame(glide);
    projectObserver.disconnect();
  }, { threshold:.42 });
  projectObserver.observe(projectSection);
}
