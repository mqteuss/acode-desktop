const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedMotionQuery.matches;

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
const navLinks = [...document.querySelectorAll('.header-inner nav a[href^="#"]')];
const navigationSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
const setupSection = document.querySelector('#instalacao');
const setupSteps = [...document.querySelectorAll('.setup-steps > li[data-step]')];
const setupProgressText = document.querySelector('#setup-progress-text');
const setupProgressTitle = document.querySelector('#setup-progress-title');
const setupProgressBar = document.querySelector('#setup-progress-bar');
let activeNavigationSection = null;
let activeSetupStep = null;
let scrollFrame = 0;

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
window.addEventListener('resize', requestScrollUpdate, { passive: true });
setCurrentStep(setupSteps[0]);
updateScrollState();

const revealTargets = [...new Set(document.querySelectorAll([
  '[data-reveal]',
  '.section-heading',
  '.visual-pair',
  '.comparison-table',
  '.security-panel',
  '.limits-grid',
  '.update-panel'
].join(',')))];
const revealedElements = new WeakSet();
let revealObserver = null;

function revealElement(element) {
  if (revealedElements.has(element)) return;
  revealedElements.add(element);
  element.dataset.revealed = 'true';
  if (reducedMotion || typeof element.animate !== 'function') return;

  element.style.willChange = 'opacity, transform';
  const animation = element.animate([
    { opacity: 0.82, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {
    duration: 320,
    easing: 'cubic-bezier(.2, .75, .25, 1)'
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

  const viewportBottom = window.innerHeight;
  const pendingTargets = [];
  for (const element of revealTargets) {
    const rect = element.getBoundingClientRect();
    if (rect.top < viewportBottom && rect.bottom > 0) {
      revealedElements.add(element);
      element.dataset.revealed = 'true';
    } else {
      pendingTargets.push(element);
    }
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      revealElement(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -6%', threshold: 0.08 });
  pendingTargets.forEach((element) => revealObserver.observe(element));
}

initializeRevealMotion();
reducedMotionQuery.addEventListener?.('change', (event) => {
  reducedMotion = event.matches;
  if (!reducedMotion) return;
  revealObserver?.disconnect();
  document.getAnimations().forEach((animation) => animation.cancel());
  revealTargets.forEach((element) => {
    element.style.removeProperty('will-change');
    element.dataset.revealed = 'true';
  });
});

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
});
