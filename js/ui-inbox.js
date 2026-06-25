import { PATHS, listenPath, updatePath } from "./firebase.js";
import { el } from "./ui-utils.js";

export function mountInboxWidget(container, roleId) {
  const card = el("div", { class: "card inbox-card" });
  card.appendChild(el("h2", {}, "Входящие приказы"));
  const body = el("div", { class: "inbox-body" });
  card.appendChild(body);
  container.appendChild(card);

  const unsub = listenPath(PATHS.directives, (data) => {
    body.innerHTML = "";
    const entries = Object.entries(data || {})
      .filter(([, d]) => d.toDept === "all" || d.toDept === roleId)
      .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));

    if (!entries.length) {
      body.appendChild(el("p", { class: "muted" }, "Новых приказов нет."));
      return;
    }

    for (const [id, d] of entries) {
      const isRead = !!(d.readBy && d.readBy[roleId]);
      const row = el("div", { class: "inbox-row" + (isRead ? " read" : " unread") });
      row.appendChild(el("div", { class: "inbox-text" }, d.text));
      if (!isRead) {
        row.appendChild(
          el("button", {
            class: "btn small",
            onclick: () => updatePath(PATHS.directives + "/" + id + "/readBy", { [roleId]: true }),
          }, "Отметить прочитанным")
        );
      } else {
        row.appendChild(el("span", { class: "muted small" }, "Прочитано"));
      }
      body.appendChild(row);
    }
  });

  return function unmount() {
    unsub();
    card.remove();
  };
}
