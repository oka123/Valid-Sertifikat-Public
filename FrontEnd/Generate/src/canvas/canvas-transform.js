/**
 * Initializes panning functionality.
 * @param {Object} app - The application instance.
 */
export function initPanning(app) {
  const mainArea = app.$("main");
  let isPanning = false;
  let lastPanPoint = { x: 0, y: 0 };
  mainArea.style.cursor = "grab";

  const getPoint = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const panStart = (e) => {
    if (e.target !== mainArea) {
      return;
    }

    isPanning = true;
    lastPanPoint = getPoint(e);
    mainArea.style.cursor = "grabbing";

    window.addEventListener("mousemove", panMove);
    window.addEventListener("mouseup", panEnd);
    window.addEventListener("touchmove", panMove, { passive: false });
    window.addEventListener("touchend", panEnd);
  };

  const panMove = (e) => {
    if (!isPanning) return;
    if (e.cancelable) e.preventDefault();

    const currentPoint = getPoint(e);
    const dx = currentPoint.x - lastPanPoint.x;
    const dy = currentPoint.y - lastPanPoint.y;

    app.panX += dx;
    app.panY += dy;
    updateCanvasTransform(app);

    lastPanPoint = currentPoint;
  };

  const panEnd = () => {
    isPanning = false;
    mainArea.style.cursor = "grab";
    window.removeEventListener("mousemove", panMove);
    window.removeEventListener("mouseup", panEnd);
    window.removeEventListener("touchmove", panMove);
    window.removeEventListener("touchend", panEnd);
  };

  mainArea.addEventListener("mousedown", panStart);
  mainArea.addEventListener("touchstart", panStart, { passive: false });
}

/**
 * Initializes panning and zooming functionality (wheel and pinch).
 * @param {Object} app - The application instance.
 */
export function initPanAndZoom(app) {
  const mainArea = app.$("main");

  mainArea.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      let delta;
      if (!isTouchDevice) {
        delta = e.deltaY > 0 ? -0.005 : 0.005;
      } else {
        delta = e.deltaY > 0 ? -0.003 : 0.003;
      }
      const newZoom = app.zoom + delta;

      app.zoom = Math.max(0.01, Math.min(newZoom, 10));

      updateCanvasTransform(app);
      updateZoomDisplay(app);
    },
    { passive: false }
  );

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  mainArea.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        app.initialPinchDistance = getDistance(e.touches);
      }
    },
    { passive: false }
  );

  mainArea.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const newDistance = getDistance(e.touches);
        const factor = newDistance / app.initialPinchDistance;

        const newZoom = app.zoom * factor;
        app.zoom = Math.max(0.01, Math.min(newZoom, 10));

        updateCanvasTransform(app);
        updateZoomDisplay(app);

        app.initialPinchDistance = newDistance;
      }
    },
    { passive: false }
  );

  fitToScreen(app);
}

/**
 * Updates the zoom level display.
 * @param {Object} app - The application instance.
 */
export function updateZoomDisplay(app) {
  app.ui.zoomLevelText.textContent = `${Math.round(app.zoom * 100)}%`;
}

/**
 * Sets the zoom level by a factor.
 * @param {Object} app - The application instance.
 * @param {number} factor - The zoom factor.
 */
export function setZoom(app, factor) {
  const newZoom = app.zoom * factor;
  app.zoom = Math.max(0.01, Math.min(newZoom, 10));
  updateCanvasTransform(app);
  updateZoomDisplay(app);
}

/**
 * Fits the canvas to the screen.
 * @param {Object} app - The application instance.
 */
export function fitToScreen(app) {
  const mainArea = app.$("main");
  const style = getComputedStyle(mainArea);
  const paddingX =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const paddingY =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

  const availableWidth = mainArea.clientWidth - paddingX;
  const availableHeight = mainArea.clientHeight - paddingY;
  const canvasWidth = app.canvas.getWidth();
  const canvasHeight = app.canvas.getHeight();

  const scale =
    Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight) *
    0.95;

  app.zoom = scale;
  app.panX = 0;
  app.panY = 0;

  updateCanvasTransform(app);
  updateZoomDisplay(app);
}

/**
 * Updates the canvas transformation (CSS).
 * @param {Object} app - The application instance.
 */
export function updateCanvasTransform(app) {
  app.ui.canvasContainer.style.transformOrigin = "center center";
  app.ui.canvasContainer.style.transform = `translate(${app.panX}px, ${app.panY}px) scale(${app.zoom})`;
}
