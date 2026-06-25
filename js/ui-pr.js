import { createDrawBoard } from "./drawboard.js";
import { PATHS, listenPath, writePath } from "./firebase.js";
import { el } from "./ui-utils.js";

export function mountPr(root) {
  root.innerHTML = "";

  const header = el("div", { class: "role-header" }, [
    el("h2", {}, "PR — маркетинговые материалы"),
    el("p", { class: "muted" }, "Эскиз проекта рекламных материалов и текст кампании."),
  ]);
  root.appendChild(header);

  const layout = el("div", { class: "pr-layout" });
  root.appendChild(layout);

  const drawCol = el("div", { class: "card" });
  drawCol.appendChild(el("h2", {}, "Эскиз"));
  const canvasWrap = el("div", { class: "canvas-wrap" });
  const canvas = el("canvas", { width: "700", height: "500", class: "draw-canvas" });
  canvasWrap.appendChild(canvas);
  const toolsRow = el("div", { class: "draw-tools" });
  const colors = ["#111827", "#1d4ed8", "#16a34a", "#dc2626", "#a16207", "#db2777"];
  for (const c of colors) {
    toolsRow.appendChild(
      el("button", { class: "color-swatch", style: `background:${c}`, onclick: () => board.setColor(c) })
    );
  }
  toolsRow.appendChild(el("button", { class: "btn", onclick: () => board.clear() }, "Очистить"));
  drawCol.appendChild(toolsRow);
  drawCol.appendChild(canvasWrap);

  const textCol = el("div", { class: "card" });
  textCol.appendChild(el("h2", {}, "Текст кампании"));
  const textarea = el("textarea", { class: "pr-textarea", placeholder: "Жилой квартал будущего..." });
  textCol.appendChild(textarea);
  textCol.appendChild(el("div", { class: "muted", id: "pr-save-status" }, "Автосохранение включено"));

  layout.appendChild(drawCol);
  layout.appendChild(textCol);

  const board = createDrawBoard({ canvas, path: PATHS.marketingBoard + "/sketch", color: "#111827" });

  let textSaveTimer = null;
  textarea.addEventListener("input", () => {
    clearTimeout(textSaveTimer);
    textSaveTimer = setTimeout(() => {
      writePath(PATHS.marketingBoard + "/campaignText", textarea.value);
    }, 400);
  });

  const unsubText = listenPath(PATHS.marketingBoard + "/campaignText", (val) => {
    if (document.activeElement !== textarea) {
      textarea.value = val || "";
    }
  });

  return function unmount() {
    board.destroy();
    unsubText();
    clearTimeout(textSaveTimer);
  };
}
