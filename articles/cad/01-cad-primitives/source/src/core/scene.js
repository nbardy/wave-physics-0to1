import { createRenderer } from './renderer.js';
import { clamp } from '../math/bspline.js';
import { multiply4, orbitCamera, perspective4, projectToCanvas } from '../math/linear.js';

export class InteractiveScene {
  constructor(id, options = {}) {
    this.id = id;
    this.canvas = document.querySelector(`canvas[data-canvas="${id}"]`);
    this.overlay = document.querySelector(`[data-overlay="${id}"]`);
    this.targetHandle = document.querySelector(`[data-target-handle="${id}"]`);
    this.fallbackLabel = document.querySelector(`[data-fallback="${id}"]`);
    if (!this.canvas) throw new Error(`Canvas for scene "${id}" was not found`);

    this.options = {
      orbit: true,
      yaw: -0.65,
      pitch: 0.48,
      distance: 4.1,
      target: [0, 0, 0],
      fov: Math.PI / 4.3,
      near: 0.02,
      far: 60,
      ...options,
    };

    this.camera = {
      yaw: this.options.yaw,
      pitch: this.options.pitch,
      distance: this.options.distance,
      target: [...this.options.target],
    };
    this.renderer = null;
    this.mvp = null;
    this.highlightTerm = null;
    this.pinnedTerm = null;
    this.frameRequested = false;
    this.handles = new Map();
    this.stalks = new Map();
    this.orbitState = null;
    this.resizeObserver = new ResizeObserver(() => this.requestRender());
    this.resizeObserver.observe(this.canvas);
  }

  async init() {
    this.renderer = await createRenderer(this.canvas);
    window.dispatchEvent(new CustomEvent('cad-renderer-ready', { detail: { id: this.id, mode: this.renderer.mode } }));
    if (this.renderer.mode === 'fallback' && this.fallbackLabel) {
      this.fallbackLabel.textContent = 'WebGPU is unavailable in this browser; the same scene is being drawn with a Canvas fallback.';
    }
    if (this.options.orbit) this.bindOrbitControls();
    this.bindControls();
    this.requestRender();
    return this;
  }

  bindControls() {}

  bindOrbitControls() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.orbitState = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        yaw: this.camera.yaw,
        pitch: this.camera.pitch,
      };
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.orbitState || this.orbitState.pointerId !== event.pointerId) return;
      const dx = event.clientX - this.orbitState.x;
      const dy = event.clientY - this.orbitState.y;
      this.camera.yaw = this.orbitState.yaw - dx * 0.009;
      this.camera.pitch = clamp(this.orbitState.pitch + dy * 0.008, -1.35, 1.35);
      this.requestRender();
    });

    const endOrbit = (event) => {
      if (this.orbitState?.pointerId === event.pointerId) this.orbitState = null;
    };
    this.canvas.addEventListener('pointerup', endOrbit);
    this.canvas.addEventListener('pointercancel', endOrbit);

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = Math.exp(event.deltaY * 0.0012);
      this.camera.distance = clamp(this.camera.distance * factor, 1.7, 10);
      this.requestRender();
    }, { passive: false });
  }

  getCameraFrame() {
    return orbitCamera(this.camera.yaw, this.camera.pitch, this.camera.distance, this.camera.target);
  }

  getMvp() {
    const rect = this.canvas.getBoundingClientRect();
    const aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
    const projection = perspective4(this.options.fov, aspect, this.options.near, this.options.far);
    const camera = this.getCameraFrame();
    return multiply4(projection, camera.view);
  }

  setHighlight(term, pinned = false) {
    this.highlightTerm = term;
    if (pinned) this.pinnedTerm = term;
    this.requestRender();
  }

  clearHighlight(force = false) {
    if (this.pinnedTerm && !force) {
      this.highlightTerm = this.pinnedTerm;
    } else {
      this.highlightTerm = null;
      if (force) this.pinnedTerm = null;
    }
    this.requestRender();
  }

  reset() {
    this.camera.yaw = this.options.yaw;
    this.camera.pitch = this.options.pitch;
    this.camera.distance = this.options.distance;
    this.camera.target = [...this.options.target];
    this.highlightTerm = null;
    this.pinnedTerm = null;
    this.requestRender();
  }

  requestRender() {
    if (!this.renderer || this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.render();
    });
  }

  render() {
    if (!this.renderer) return;
    this.mvp = this.getMvp();
    const drawables = this.buildDrawables();
    this.renderer.render(drawables, this.mvp);
    this.syncOverlay();
    this.updateTargetHandle();
  }

  buildDrawables() {
    return [];
  }

  syncOverlay() {}

  getTermAnchor() {
    return null;
  }

  updateTargetHandle() {
    if (!this.targetHandle) return;
    const term = this.highlightTerm;
    const anchor = term ? this.getTermAnchor(term) : null;
    if (!anchor) {
      this.targetHandle.classList.remove('visible');
      window.dispatchEvent(new CustomEvent('cad-target-updated', { detail: { id: this.id } }));
      return;
    }

    let x;
    let y;
    if (anchor.space === 'normalized') {
      const rect = this.canvas.getBoundingClientRect();
      x = anchor.x * rect.width;
      y = anchor.y * rect.height;
    } else if (anchor.space === 'css') {
      x = anchor.x;
      y = anchor.y;
    } else {
      const projected = this.worldToCss(anchor.point ?? anchor);
      x = projected.x;
      y = projected.y;
    }

    this.targetHandle.style.left = `${x}px`;
    this.targetHandle.style.top = `${y}px`;
    this.targetHandle.classList.add('visible');
    window.dispatchEvent(new CustomEvent('cad-target-updated', { detail: { id: this.id } }));
  }

  worldToCss(point) {
    const rect = this.canvas.getBoundingClientRect();
    const projected = projectToCanvas(point, this.mvp ?? this.getMvp(), rect.width, rect.height);
    return projected;
  }

  cssToNormalized(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
      y: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
    };
  }

  ensureHandle(key, options = {}) {
    if (this.handles.has(key)) return this.handles.get(key);
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = `drag-handle ${options.className ?? ''}`.trim();
    handle.dataset.handleKey = key;
    handle.setAttribute('aria-label', options.label ?? key);
    this.overlay?.append(handle);
    this.handles.set(key, handle);

    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onHandleSelect(key, event);
      const start = { x: event.clientX, y: event.clientY, data: this.onHandleDragStart(key, event) };
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        this.onHandleDrag(key, moveEvent.clientX - start.x, moveEvent.clientY - start.y, moveEvent, start.data);
      };
      const end = (endEvent) => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        this.onHandleDragEnd(key, endEvent);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });

    return handle;
  }

  positionHandle(key, x, y, options = {}) {
    const handle = this.ensureHandle(key, options);
    handle.style.left = `${x}px`;
    handle.style.top = `${y}px`;
    handle.style.display = options.visible === false ? 'none' : 'block';
    handle.classList.toggle('selected', Boolean(options.selected));
    if (options.className) handle.classList.add(...options.className.split(' ').filter(Boolean));
    if (options.label) handle.setAttribute('aria-label', options.label);
    return handle;
  }

  ensureStalk(key) {
    if (this.stalks.has(key)) return this.stalks.get(key);
    const stalk = document.createElement('div');
    stalk.className = 'weight-stalk';
    stalk.dataset.stalkKey = key;
    this.overlay?.prepend(stalk);
    this.stalks.set(key, stalk);
    return stalk;
  }

  positionStalk(key, x, top, height, visible = true) {
    const stalk = this.ensureStalk(key);
    stalk.style.left = `${x}px`;
    stalk.style.top = `${top}px`;
    stalk.style.height = `${height}px`;
    stalk.style.display = visible ? 'block' : 'none';
    return stalk;
  }

  hideUnusedHandles(activeKeys) {
    const active = new Set(activeKeys);
    for (const [key, handle] of this.handles) {
      if (!active.has(key)) handle.style.display = 'none';
    }
    for (const [key, stalk] of this.stalks) {
      if (!active.has(key)) stalk.style.display = 'none';
    }
  }

  onHandleSelect() {}

  onHandleDragStart() {
    return null;
  }

  onHandleDrag() {}

  onHandleDragEnd() {}
}
