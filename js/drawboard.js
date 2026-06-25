import { listenPath, writePath } from "./firebase.js";

/* =========================================================
   DRAW BOARD — общая доска для рисования кистью,
   синхронизируемая через Firebase по указанному пути.
   Хранит данные как dataURL PNG (просто и надёжно для RTDB).
========================================================= */

export function createDrawBoard({ canvas, path, color = "#111827", brushSize = 4, onRemoteUpdate }) {
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let last = null;
  let suppressNextLocalSave = false;

  function clearWhite() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  clearWhite();

  function loadFromDataUrl(dataUrl) {
    if (!dataUrl) {
      clearWhite();
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }

  const unsubscribe = listenPath(path, (val) => {
    suppressNextLocalSave = true;
    loadFromDataUrl(val ? val.image : null);
    if (onRemoteUpdate) onRemoteUpdate(val);
  });

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (suppressNextLocalSave) {
        suppressNextLocalSave = false;
        return;
      }
      writePath(path, { image: canvas.toDataURL("image/png"), updatedAt: Date.now() });
    }, 350);
  }

  function strokeTo(x, y) {
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last = { x, y };
  }

  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    last = pointerPos(e);
  });
  canvas.addEventListener("pointerup", () => {
    drawing = false;
    scheduleSave();
  });
  canvas.addEventListener("pointerleave", () => {
    if (drawing) scheduleSave();
    drawing = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pointerPos(e);
    strokeTo(p.x, p.y);
  });

  return {
    setColor(c) {
      color = c;
    },
    setBrushSize(s) {
      brushSize = s;
    },
    clear() {
      clearWhite();
      writePath(path, { image: canvas.toDataURL("image/png"), updatedAt: Date.now() });
    },
    destroy() {
      unsubscribe();
      clearTimeout(saveTimer);
    },
  };
}
