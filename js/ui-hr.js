import { PATHS, pushPath, listenPath } from "./firebase.js";
import { el, showToast } from "./ui-utils.js";

const REQUESTABLE = [
  { key: "budget", label: "Стартовый бюджет / остаток" },
  { key: "map", label: "Карта местности" },
  { key: "masterplan", label: "Архитектурный проект комплекса" },
  { key: "goals", label: "Цели компании" },
  { key: "techreq", label: "Технические требования к зданиям" },
  { key: "materials", label: "Строительные материалы" },
];

export function mountHr(root) {
  root.innerHTML = "";

  const header = el("div", { class: "role-header" }, [
    el("h2", {}, "HR"),
    el("p", { class: "muted" }, "Большинство данных доступно только по запросу к Совету директоров."),
  ]);
  root.appendChild(header);

  const requestCard = el("div", { class: "card" });
  requestCard.appendChild(el("h2", {}, "Запросить доступ"));
  for (const item of REQUESTABLE) {
    requestCard.appendChild(
      el("div", { class: "hr-request-row" }, [
        el("span", {}, item.label),
        el("button", {
          class: "btn small",
          onclick: async () => {
            await pushPath(PATHS.directives, {
              text: "HR запрашивает доступ: " + item.label,
              fromRole: "hr",
              toDept: "directors",
              ts: Date.now(),
              readBy: {},
            });
            showToast("Запрос отправлен Совету директоров");
          },
        }, "Запросить"),
      ])
    );
  }
  root.appendChild(requestCard);

  return function unmount() {};
}
