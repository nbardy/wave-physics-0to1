import { BSplineScene } from './scenes/bspline-scene.js';
import { NurbsScene } from './scenes/nurbs-scene.js';
import { TSplineScene } from './scenes/tspline-scene.js';
import { SubDScene } from './scenes/subd-scene.js';
import { BRepScene } from './scenes/brep-scene.js';
import { IntegrationScene } from './scenes/integration-scene.js';

const scenes = new Map();
const sceneInstances = [
  new IntegrationScene(),
  new BSplineScene(),
  new NurbsScene(),
  new TSplineScene(),
  new SubDScene(),
  new BRepScene(),
];
sceneInstances.forEach((scene) => scenes.set(scene.id, scene));

const connectorLayer = document.querySelector('#term-connector-layer');
const connectorPath = document.querySelector('#term-connector-path');
let hoverSource = null;
let pinnedSource = null;
let connectorFrame = null;

function matchingTermElements(sceneId, term) {
  return [...document.querySelectorAll(`[data-scene="${sceneId}"][data-term="${term}"]`)].filter(
    (element) => element.classList.contains('math-token') || element.classList.contains('inline-term'),
  );
}

function clearTermClasses() {
  document.querySelectorAll('.term-active').forEach((element) => element.classList.remove('term-active'));
}

function currentSource() {
  return hoverSource ?? pinnedSource;
}

function scheduleConnectorUpdate() {
  if (connectorFrame) cancelAnimationFrame(connectorFrame);
  connectorFrame = requestAnimationFrame(updateConnector);
}

function updateConnector() {
  connectorFrame = null;
  const source = currentSource();
  if (!source || window.matchMedia('(max-width: 760px)').matches) {
    connectorLayer?.classList.remove('visible');
    return;
  }
  const target = document.querySelector(`[data-target-handle="${source.sceneId}"]`);
  if (!target?.classList.contains('visible') || !source.element.isConnected) {
    connectorLayer?.classList.remove('visible');
    return;
  }

  const sourceRect = source.element.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  const sourceOnLeft = sourceRect.left + sourceRect.width / 2 < targetX;
  const startX = sourceOnLeft ? sourceRect.right + 6 : sourceRect.left - 6;
  const startY = sourceRect.top + sourceRect.height / 2;
  const direction = sourceOnLeft ? 1 : -1;
  const bend = Math.max(42, Math.abs(targetX - startX) * 0.44);
  const c1x = startX + bend * direction;
  const c2x = targetX - bend * 0.72 * direction;
  connectorPath?.setAttribute('d', `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${targetY}, ${targetX} ${targetY}`);
  connectorLayer?.classList.add('visible');
}

function focusMatchingControl(sceneId, term) {
  const exact = document.querySelector(`[data-stage="${sceneId}"] [data-controls-term="${term}"]`);
  const aliases = {
    'bspline:basis': 'u',
    'bspline:sum': 'u',
    'bspline:curve': 'u',
    'nurbs:basis': 'u',
    'nurbs:curve': 'u',
    'nurbs:denominator': 'weight',
    'tspline:surface': 'anchor',
    'tspline:local-basis': 'local-basis',
    'subd:updated-vertex': 'control-vertex',
    'subd:valence': 'control-vertex',
    'brep:shell': 'face',
    'brep:edge': 'face',
    'brep:vertex': 'face',
    'brep:surface': 'surface',
  };
  const alias = aliases[`${sceneId}:${term}`];
  const control = exact ?? (alias ? document.querySelector(`[data-stage="${sceneId}"] [data-controls-term="${alias}"]`) : null);
  if (!control) return;
  document.querySelectorAll('.control-focus').forEach((element) => element.classList.remove('control-focus'));
  control.classList.add('control-focus');
  const focusable = control.querySelector('input, select, button');
  focusable?.focus({ preventScroll: true });
  window.setTimeout(() => control.classList.remove('control-focus'), 1300);
}

function activateTerm(element, pinned = false) {
  const sceneId = element.dataset.scene;
  const term = element.dataset.term;
  const scene = scenes.get(sceneId);
  if (!scene) return;

  scene.setHighlight(term, pinned);
  const source = { element, sceneId, term };
  if (pinned) {
    pinnedSource = source;
    clearTermClasses();
    matchingTermElements(sceneId, term).forEach((item) => item.classList.add('term-active'));
    focusMatchingControl(sceneId, term);
  } else {
    hoverSource = source;
    element.classList.add('term-active');
  }
  scheduleConnectorUpdate();
}

function deactivateHover(element) {
  if (hoverSource?.element !== element) return;
  const { sceneId } = hoverSource;
  hoverSource = null;
  if (!pinnedSource || pinnedSource.element !== element) element.classList.remove('term-active');
  scenes.get(sceneId)?.clearHighlight(false);
  scheduleConnectorUpdate();
}

function clearPinnedTerms() {
  pinnedSource = null;
  hoverSource = null;
  clearTermClasses();
  scenes.forEach((scene) => scene.clearHighlight(true));
  connectorLayer?.classList.remove('visible');
}

function bindTermInteractions() {
  document.querySelectorAll('[data-scene][data-term]').forEach((element) => {
    if (!(element.classList.contains('math-token') || element.classList.contains('inline-term'))) return;
    element.addEventListener('pointerenter', () => activateTerm(element, false));
    element.addEventListener('pointerleave', () => deactivateHover(element));
    element.addEventListener('focus', () => activateTerm(element, false));
    element.addEventListener('blur', () => deactivateHover(element));
    element.addEventListener('click', (event) => {
      event.preventDefault();
      activateTerm(element, true);
    });
  });
}

function bindLatexToggles() {
  document.querySelectorAll('[data-latex-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const source = document.querySelector(`#${button.dataset.latexTarget}`);
      if (!source) return;
      const visible = source.classList.toggle('visible');
      button.textContent = visible ? 'Hide LaTeX' : button.closest('.map-equation') ? 'View source' : 'View LaTeX';
    });
  });
}

function bindResetButtons() {
  document.querySelectorAll('[data-reset]').forEach((button) => {
    button.addEventListener('click', () => scenes.get(button.dataset.reset)?.reset());
  });
}

function bindTour() {
  const dialog = document.querySelector('#tour-dialog');
  const openButton = document.querySelector('#tour-button');
  const closeButton = dialog?.querySelector('.dialog-close');
  const startButton = dialog?.querySelector('.dialog-start');
  openButton?.addEventListener('click', () => dialog?.showModal());
  closeButton?.addEventListener('click', () => dialog?.close());
  startButton?.addEventListener('click', () => {
    dialog?.close();
    document.querySelector('#bspline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      const token = document.querySelector('[data-scene="bspline"][data-term="control"]');
      if (token) activateTerm(token, true);
    }, 620);
  });
}

function bindNavigationSpy() {
  const links = [...document.querySelectorAll('.top-nav a')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.45] });
  sections.forEach((section) => observer.observe(section));
}

function bindGlobalEvents() {
  window.addEventListener('scroll', scheduleConnectorUpdate, { passive: true });
  window.addEventListener('resize', scheduleConnectorUpdate);
  window.addEventListener('cad-target-updated', scheduleConnectorUpdate);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearPinnedTerms();
  });
}

function bindRuntimeBadge() {
  const modes = new Map();
  const badge = document.querySelector('#runtime-badge');
  const label = document.querySelector('#runtime-label');
  window.addEventListener('cad-renderer-ready', (event) => {
    modes.set(event.detail.id, event.detail.mode);
    if (modes.size < sceneInstances.length) return;
    const webgpu = [...modes.values()].every((mode) => mode === 'webgpu');
    badge?.classList.toggle('webgpu', webgpu);
    badge?.classList.toggle('fallback', !webgpu);
    if (label) label.textContent = webgpu ? 'WebGPU active' : 'Canvas fallback';
  });
}

bindRuntimeBadge();
bindTermInteractions();
bindLatexToggles();
bindResetButtons();
bindTour();
bindNavigationSpy();
bindGlobalEvents();

Promise.all(sceneInstances.map((scene) => scene.init())).catch((error) => {
  console.error('One or more CAD scenes failed to initialize.', error);
  const badge = document.querySelector('#runtime-badge');
  const label = document.querySelector('#runtime-label');
  badge?.classList.add('fallback');
  if (label) label.textContent = 'Visual error';
});
