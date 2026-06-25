import { listenPath, writePath, pushPath, updatePath, PATHS } from "./firebase.js";
import { el, formatMoney, showToast } from "./ui-utils.js";
import { EQUIPMENT_TYPES } from "./assets-registry.js";

export function mountFinance(root) {
  root.innerHTML = "";

  const budgetCard = el("div", { class: "card" });
  const materialsCard = el("div", { class: "card" });
  const equipmentCard = el("div", { class: "card" });
  const penaltiesCard = el("div", { class: "card" });
  const goalsCard = el("div", { class: "card" });

  const grid = el("div", { class: "finance-layout" }, [
    budgetCard,
    materialsCard,
    equipmentCard,
    penaltiesCard,
    goalsCard,
  ]);
  root.appendChild(grid);

  let currentTotal = 0;

  function renderBudget() {
    budgetCard.innerHTML = "";
    budgetCard.appendChild(el("h2", {}, "Остаток бюджета"));
    budgetCard.appendChild(el("div", { class: "big-number" }, formatMoney(currentTotal)));
    const row = el("div", { class: "btn-row" });
    row.appendChild(
      el("button", { class: "btn", onclick: () => adjustBudget(10000, "Пополнение (финансы)") }, "+10 000 ₽")
    );
    row.appendChild(
      el("button", { class: "btn danger", onclick: () => adjustBudget(-10000, "Списание (финансы)") }, "−10 000 ₽")
    );
    budgetCard.appendChild(row);

    const customRow = el("div", { class: "btn-row" });
    const input = el("input", { type: "number", class: "money-input", placeholder: "Сумма ₽" });
    customRow.appendChild(input);
    customRow.appendChild(
      el("button", {
        class: "btn",
        onclick: () => {
          const v = parseFloat(input.value);
          if (!v) return;
          adjustBudget(v, "Ручная операция");
          input.value = "";
        },
      }, "Применить (+/−)")
    );
    budgetCard.appendChild(customRow);
  }

  async function adjustBudget(delta, reason) {
    const newTotal = currentTotal + delta;
    await writePath(PATHS.budgetTotal, newTotal);
    await pushPath(PATHS.budgetLog, { ts: Date.now(), delta, reason, byRole: "finance" });
    showToast((delta >= 0 ? "+" : "") + formatMoney(delta) + " — " + reason);
  }

  const unsubBudget = listenPath(PATHS.budgetTotal, (val) => {
    currentTotal = val || 0;
    renderBudget();
  });

  function renderMaterials(stock, catalog) {
    materialsCard.innerHTML = "";
    materialsCard.appendChild(el("h2", {}, "Строительные материалы"));
    const ids = new Set([...Object.keys(stock || {}), ...Object.keys(catalog || {})]);
    if (ids.size === 0) {
      materialsCard.appendChild(el("p", { class: "muted" }, "Склад пуст. Поставки приходят от ЖКХ."));
      return;
    }
    const table = el("table", { class: "data-table" });
    table.appendChild(
      el("tr", {}, [el("th", {}, "Материал"), el("th", {}, "Остаток"), el("th", {}, "Цена/ед.")])
    );
    for (const id of ids) {
      const s = (stock || {})[id] || {};
      const c = (catalog || {})[id] || {};
      table.appendChild(
        el("tr", {}, [
          el("td", {}, s.name || c.name || id),
          el("td", {}, String(s.qty ?? "—")),
          el("td", {}, c.unitPrice != null ? formatMoney(c.unitPrice) : "—"),
        ])
      );
    }
    materialsCard.appendChild(table);
  }

  let lastStock = {};
  let lastCatalog = {};
  const unsubStock = listenPath(PATHS.materialsStock, (val) => {
    lastStock = val || {};
    renderMaterials(lastStock, lastCatalog);
  });
  const unsubCatalog = listenPath(PATHS.materialsCatalog, (val) => {
    lastCatalog = val || {};
    renderMaterials(lastStock, lastCatalog);
  });

  function renderEquipment(data) {
    equipmentCard.innerHTML = "";
    equipmentCard.appendChild(el("h2", {}, "Спецтехника — параметры"));
    const entries = Object.entries(data || {});
    if (!entries.length) {
      equipmentCard.appendChild(el("p", { class: "muted" }, "На площадке нет техники."));
      return;
    }
    for (const [id, eq] of entries) {
      const def = EQUIPMENT_TYPES[eq.kind] || { label: eq.kind };
      equipmentCard.appendChild(
        el("div", { class: "equipment-row" }, [
          el("strong", {}, def.label),
          el("span", { class: "muted" }, " · топливо: " + (eq.fuel != null ? eq.fuel + "%" : "—")),
          el("span", { class: "muted" }, " · статус: " + (eq.status || "—")),
        ])
      );
    }
  }
  const unsubEquip = listenPath(PATHS.equipment, renderEquipment);

  function renderPenalties(data) {
    penaltiesCard.innerHTML = "";
    penaltiesCard.appendChild(el("h2", {}, "Штрафы"));
    const entries = Object.entries(data || {}).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    if (!entries.length) {
      penaltiesCard.appendChild(el("p", { class: "muted" }, "Штрафов нет."));
      return;
    }
    for (const [, p] of entries.slice(0, 12)) {
      penaltiesCard.appendChild(
        el("div", { class: "penalty-row" }, [
          el("span", { class: "penalty-amount" }, formatMoney(p.amount)),
          el("span", { class: "muted" }, " · " + (p.targetRole || "—") + " · " + (p.reason || "")),
        ])
      );
    }
  }
  const unsubPenalties = listenPath(PATHS.penalties, renderPenalties);

  function renderGoals(val) {
    goalsCard.innerHTML = "";
    goalsCard.appendChild(el("h2", {}, "Цели компании"));
    goalsCard.appendChild(el("p", {}, val || "—"));
  }
  const unsubGoals = listenPath(PATHS.metaGoals, renderGoals);

  return function unmount() {
    unsubBudget();
    unsubStock();
    unsubCatalog();
    unsubEquip();
    unsubPenalties();
    unsubGoals();
  };
}
