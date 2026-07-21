const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedMotionQuery.matches;

if (!reducedMotion) document.documentElement.classList.add('motion-ready');

function copyTextFallback(value) {
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy') ?? '';
    const previous = button.textContent;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      copyTextFallback(value);
    }
    button.textContent = 'Copiado ✓';
    button.classList.add('is-copied');
    button.setAttribute('aria-label', 'Conteúdo copiado');
    window.setTimeout(() => {
      button.textContent = previous;
      button.classList.remove('is-copied');
      button.removeAttribute('aria-label');
    }, 1800);
  });
}

const header = document.querySelector('.site-header');
const scrollProgress = document.querySelector('#scroll-progress-bar');
const nav = document.querySelector('#primary-navigation');
const navLinks = [...document.querySelectorAll('#primary-navigation a[href^="#"]')];
const navigationSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
const mobileMenuButton = document.querySelector('#mobile-menu-button');
const setupSection = document.querySelector('#instalacao');
const setupSteps = [...document.querySelectorAll('.setup-steps > li[data-step]')];
const setupProgressText = document.querySelector('#setup-progress-text');
const setupProgressTitle = document.querySelector('#setup-progress-title');
const setupProgressBar = document.querySelector('#setup-progress-bar');
let activeNavigationSection = null;
let activeSetupStep = null;
let scrollFrame = 0;

function setMenuOpen(open) {
  if (!nav || !mobileMenuButton) return;
  nav.dataset.open = String(open);
  mobileMenuButton.setAttribute('aria-expanded', String(open));
  mobileMenuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('nav-open', open);
}

mobileMenuButton?.addEventListener('click', () => {
  setMenuOpen(mobileMenuButton.getAttribute('aria-expanded') !== 'true');
});

for (const link of navLinks) link.addEventListener('click', () => setMenuOpen(false));

function setActiveNavigation(section) {
  if (section === activeNavigationSection) return;
  activeNavigationSection = section;
  for (const link of navLinks) {
    const selected = Boolean(section) && link.getAttribute('href') === `#${section.id}`;
    link.classList.toggle('is-active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function updateNavigationState() {
  if (!navigationSections.length) return;
  const headerHeight = header?.offsetHeight ?? 0;
  const activationLine = window.scrollY + headerHeight + Math.min(window.innerHeight * 0.28, 260);
  const firstTop = navigationSections[0].getBoundingClientRect().top + window.scrollY;
  if (activationLine < firstTop) {
    setActiveNavigation(null);
    return;
  }

  let current = navigationSections[0];
  for (const section of navigationSections) {
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    if (sectionTop <= activationLine) current = section;
    else break;
  }
  setActiveNavigation(current);
}

function setCurrentStep(step) {
  if (!step || step === activeSetupStep) return;
  activeSetupStep = step;
  const number = Number(step.dataset.step || 1);
  setupSteps.forEach((item) => item.classList.toggle('is-current', item === step));
  if (setupProgressText) setupProgressText.textContent = `Etapa ${number} de ${setupSteps.length}`;
  if (setupProgressTitle) setupProgressTitle.textContent = step.dataset.stepTitle || '';
  setupProgressBar?.style.setProperty('transform', `scaleX(${number / Math.max(1, setupSteps.length)})`);
}

function updateSetupState() {
  if (!setupSection || !setupSteps.length) return;
  const headerHeight = header?.offsetHeight ?? 0;
  const readingLine = window.scrollY + headerHeight + window.innerHeight * 0.42;
  const firstTop = setupSteps[0].getBoundingClientRect().top + window.scrollY;
  const last = setupSteps[setupSteps.length - 1];
  const lastBottom = last.getBoundingClientRect().bottom + window.scrollY;

  if (readingLine <= firstTop) {
    setCurrentStep(setupSteps[0]);
    return;
  }
  if (readingLine >= lastBottom) {
    setCurrentStep(last);
    return;
  }

  let current = setupSteps[0];
  for (const step of setupSteps) {
    const stepTop = step.getBoundingClientRect().top + window.scrollY;
    if (stepTop <= readingLine) current = step;
    else break;
  }
  setCurrentStep(current);
}

function updateScrollState() {
  scrollFrame = 0;
  const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maximum));
  scrollProgress?.style.setProperty('transform', `scaleX(${progress})`);
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
  updateNavigationState();
  updateSetupState();
}

function requestScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateScrollState);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setMenuOpen(false);
  requestScrollUpdate();
}, { passive: true });
setCurrentStep(setupSteps[0]);
updateScrollState();

const revealTargets = [...new Set([
  ...document.querySelectorAll('[data-reveal]'),
  ...[...document.querySelectorAll('[data-reveal-group]')].flatMap((group) => [...group.children])
])];
const revealedElements = new WeakSet();
let revealObserver = null;

function revealElement(element, entryIndex = 0) {
  if (revealedElements.has(element)) return;
  revealedElements.add(element);
  element.dataset.revealed = 'true';
  if (reducedMotion || typeof element.animate !== 'function') return;

  element.style.willChange = 'opacity, transform';
  const animation = element.animate([
    { opacity: 0, transform: 'translateY(18px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {
    duration: 520,
    delay: Math.min(entryIndex * 55, 220),
    easing: 'cubic-bezier(.16, 1, .3, 1)',
    fill: 'both'
  });
  animation.addEventListener('finish', () => {
    element.style.removeProperty('will-change');
    animation.cancel();
  }, { once: true });
}

function initializeRevealMotion() {
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => {
      revealedElements.add(element);
      element.dataset.revealed = 'true';
    });
    return;
  }

  const pendingTargets = [];
  for (const element of revealTargets) {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) revealElement(element);
    else pendingTargets.push(element);
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
      revealElement(entry.target, index);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8%', threshold: 0.08 });

  pendingTargets.forEach((element) => revealObserver.observe(element));
}

initializeRevealMotion();

const countTargets = [...document.querySelectorAll('[data-count]')];
function animateCount(element) {
  if (element.dataset.counted === 'true') return;
  element.dataset.counted = 'true';
  const target = Number(element.dataset.count || element.textContent || 0);
  if (reducedMotion || !Number.isFinite(target)) {
    element.textContent = String(target);
    return;
  }
  const started = performance.now();
  const duration = 780;
  function frame(now) {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) window.requestAnimationFrame(frame);
  }
  element.textContent = '0';
  window.requestAnimationFrame(frame);
}

if ('IntersectionObserver' in window && !reducedMotion) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    }
  }, { threshold: .7 });
  countTargets.forEach((element) => countObserver.observe(element));
} else {
  countTargets.forEach(animateCount);
}

for (const card of document.querySelectorAll('[data-spotlight]')) {
  card.addEventListener('pointermove', (event) => {
    if (reducedMotion) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  });
}

const downloadToast = document.querySelector('#download-toast');
let downloadToastTimer = 0;
for (const link of document.querySelectorAll('[data-download]')) {
  link.addEventListener('click', () => {
    link.classList.add('is-started');
    link.setAttribute('aria-label', `Download iniciado: ${link.getAttribute('data-download') || 'arquivo'}`);
    if (downloadToast) downloadToast.hidden = false;
    window.clearTimeout(downloadToastTimer);
    downloadToastTimer = window.setTimeout(() => {
      if (downloadToast) downloadToast.hidden = true;
      link.classList.remove('is-started');
      link.removeAttribute('aria-label');
    }, 3600);
  });
}

for (const item of document.querySelectorAll('.faq-list details')) {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    for (const other of document.querySelectorAll('.faq-list details[open]')) {
      if (other !== item) other.removeAttribute('open');
    }
  });
}

const previewDialog = document.querySelector('#image-preview-dialog');
const previewImage = document.querySelector('#image-preview-content');
const previewCaption = document.querySelector('#image-preview-caption');
const previewClose = document.querySelector('#image-preview-close');
let previewTrigger = null;

function closePreview() {
  if (!previewDialog?.open) return;
  previewDialog.close();
}

for (const trigger of document.querySelectorAll('[data-preview]')) {
  trigger.addEventListener('click', () => {
    if (!previewDialog || !previewImage || !previewCaption) return;
    previewTrigger = trigger;
    previewImage.src = trigger.getAttribute('data-preview') || '';
    previewImage.alt = trigger.getAttribute('data-preview-alt') || '';
    previewCaption.textContent = trigger.getAttribute('data-preview-caption') || '';
    document.body.classList.add('dialog-open');
    previewDialog.showModal();
    previewClose?.focus();
  });
}

previewClose?.addEventListener('click', closePreview);
previewDialog?.addEventListener('click', (event) => {
  if (event.target === previewDialog) closePreview();
});
previewDialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  previewTrigger?.focus();
  previewTrigger = null;
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && previewDialog?.open) closePreview();
  else if (event.key === 'Escape') setMenuOpen(false);
});

reducedMotionQuery.addEventListener?.('change', (event) => {
  reducedMotion = event.matches;
  document.documentElement.classList.toggle('motion-ready', !reducedMotion);
  if (!reducedMotion) return;
  revealObserver?.disconnect();
  document.getAnimations().forEach((animation) => animation.cancel());
  revealTargets.forEach((element) => {
    element.style.removeProperty('will-change');
    element.dataset.revealed = 'true';
  });
  countTargets.forEach((element) => {
    element.textContent = element.dataset.count || element.textContent;
  });
});
