(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('#nav-toggle');
  const links = document.querySelector('#nav-links');

  if (!nav || !toggle || !links) return;

  const setOpen = open => {
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(!links.classList.contains('is-open'));
  });

  links.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && links.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', event => {
    if (!links.classList.contains('is-open')) return;
    if (nav.contains(event.target)) return;
    setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) setOpen(false);
  });

  window.addEventListener('hashchange', () => setOpen(false));
})();
