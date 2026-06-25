import { PATHS, listenPath, pushPath, writePath } from "./firebase.js";
import { ROLES } from "./roles.js";
import { el, formatMoney, showToast } from "./ui-utils.js";

export function mountDirectors(root) {
  root.innerHTML = "";

  const header = el("div", { class: "role-header" }, [el("h2", {}, "Совет директоров")]);
  root.appendChild(header);

  const layout = el("div", { class: "directors-layout" });
  root.appendChild(layout);

  // --- приказы ---
  const directiveCard = el("div", { class: "card" });
  directiveCard.appendChild(el("h2", {}, "Транслировать приказ"));
  const textArea = el("textarea", { class: "pr-textarea short", placeholder: "Текст приказа..." });
  const targetSelect = el("select", { class: "status-select" }, [
    el("option", { value: "all" }, "Всем подразделениям"),
    ...Object.entries(ROLES)
      .filter(([id]) => id !== "directors")
      .map(([id, def]) => el("option", { value: id }, def.label)),
  ]);
  directiveCard.appendChild(textArea);
  directiveCard.appendChild(targetSelect);
  directiveCard.appendChild(
    el("button", {
      class: "btn primary",
      onclick: async () => {
        if (!textArea.value.trim()) {
          showToast("Введите текст приказа");
          return;
        }
        await pushPath(PATHS.directives, {
          text: textArea.value.trim(),
          fromRole: "directors",
          toDept: targetSelect.value,
          ts: Date.now(),
          readBy: {},
        });
        textArea.value = "";
        showToast("Приказ отправлен");
      },
    }, "Отправить")
  );
  layout.appendChild(directiveCard);

  // --- лента отправленных приказов ---
  const historyCard = el("div", { class: "card" });
  historyCard.appendChild(el("h2", {}, "История приказов"));
  const historyBody = el("div", { class: "directive-history" });
  historyCard.appendChild(historyBody);
  layout.appendChild(historyCard);

  const unsubDirectives = listenPath(PATHS.directives, (data) => {
    historyBody.innerHTML = "";
    const entries = Object.entries(data || {}).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    if (!entries.length) {
      historyBody.appendChild(el("p", { class: "muted" }, "Приказов пока не было."));
      return;
    }
    for (const [, d] of entries.slice(0, 20)) {
      const targetLabel = d.toDept === "all" ? "Всем" : (ROLES[d.toDept] || {}).label || d.toDept;
      historyBody.appendChild(
        el("div", { class: "directive-row" }, [
          el("strong", {}, targetLabel + ": "),
          el("span", {}, d.text),
        ])
      );
    }
  });

  // --- цели компании ---
  const goalsCard = el("div", { class: "card" });
  goalsCard.appendChild(el("h2", {}, "Цели компании"));
  const goalsTextarea = el("textarea", { class: "pr-textarea short" });
  goalsCard.appendChild(goalsTextarea);
  let goalsSaveTimer = null;
  goalsTextarea.addEventListener("input", () => {
    clearTimeout(goalsSaveTimer);
    goalsSaveTimer = setTimeout(() => writePath(PATHS.metaGoals, goalsTextarea.value), 400);
  });
  const unsubGoals = listenPath(PATHS.metaGoals, (val) => {
    if (document.activeElement !== goalsTextarea) goalsTextarea.value = val || "";
  });
  layout.appendChild(goalsCard);

  // --- техтребования ---
  const techCard = el("div", { class: "card" });
  techCard.appendChild(el("h2", {}, "Технические требования к зданиям"));
  const techTextarea = el("textarea", { class: "pr-textarea short" });
  techCard.appendChild(techTextarea);
  let techSaveTimer = null;
  techTextarea.addEventListener("input", () => {
    clearTimeout(techSaveTimer);
    techSaveTimer = setTimeout(() => writePath(PATHS.metaTechReq, techTextarea.value), 400);
  });
  const unsubTech = listenPath(PATHS.metaTechReq, (val) => {
    if (document.activeElement !== techTextarea) techTextarea.value = val || "";
  });
  layout.appendChild(techCard);

  // --- бюджет (readonly) ---
  const budgetCard = el("div", { class: "card" });
  budgetCard.appendChild(el("h2", {}, "Остаток бюджета"));
  const budgetValue = el("div", { class: "big-number" }, "—");
  budgetCard.appendChild(budgetValue);
  const unsubBudget = listenPath(PATHS.budgetTotal, (val) => {
    budgetValue.textContent = formatMoney(val || 0);
  });
  layout.appendChild(budgetCard);

  // --- штрафы ---
  const penaltyCard = el("div", { class: "card" });
  penaltyCard.appendChild(el("h2", {}, "Выписать штраф"));
  const penaltyTarget = el("select", { class: "status-select" }, Object.entries(ROLES).map(([id, def]) => el("option", { value: id }, def.label)));
  const penaltyAmount = el("input", { type: "number", class: "money-input", placeholder: "Сумма ₽" });
  const penaltyReason = el("input", { type: "text", class: "text-input", placeholder: "Причина" });
  penaltyCard.appendChild(penaltyTarget);
  penaltyCard.appendChild(penaltyAmount);
  penaltyCard.appendChild(penaltyReason);
  penaltyCard.appendChild(
    el("button", {
      class: "btn danger",
      onclick: async () => {
        const amount = parseFloat(penaltyAmount.value);
        if (!amount) {
          showToast("Укажите сумму штрафа");
          return;
        }
        await pushPath(PATHS.penalties, {
          amount,
          reason: penaltyReason.value || "Без указания причины",
          targetRole: penaltyTarget.value,
          ts: Date.now(),
        });
        penaltyAmount.value = "";
        penaltyReason.value = "";
        showToast("Штраф выписан");
      },
    }, "Выписать")
  );
  layout.appendChild(penaltyCard);

  return function unmount() {
    unsubDirectives();
    unsubGoals();
    unsubTech();
    unsubBudget();
    clearTimeout(goalsSaveTimer);
    clearTimeout(techSaveTimer);
  };
}
