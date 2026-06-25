/* =========================================================
   КОНФИГУРАЦИЯ РОЛЕЙ
   Каждая роль описывает:
   - label: отображаемое имя
   - canSeeMap: видит ли 3D-карту всегда ("full"), только в командировке
     ("trip"), или никогда (false)
   - canBuild: может ставить/убирать блоки на карте
   - canTrip: доступна кнопка "командировка" (платная)
   - modules: какие ветки Firebase подписываются для этой роли
     (используется app.js для решения, что слушать)
   - ui: ключ модуля интерфейса (см. js/ui-*.js)
========================================================= */

export const TRIP_COST = 5000; // ₽ за поездку
export const TRIP_DURATION_MIN = 3; // минут схематичного доступа к реальной карте

export const ROLES = {
  workers: {
    label: "Рабочие",
    canSeeMap: "full",
    canBuild: true,
    canTrip: false,
    ui: "worker",
  },
  finance: {
    label: "Финансы",
    canSeeMap: false,
    canBuild: false,
    canTrip: false,
    ui: "finance",
  },
  architects: {
    label: "Архитектурное бюро",
    canSeeMap: "trip", // схематично всегда, реально только в командировке
    canBuild: false,
    canTrip: true,
    ui: "architects",
  },
  engineers: {
    label: "Инженерный отдел",
    canSeeMap: "trip",
    canBuild: false,
    canTrip: true,
    ui: "engineers",
  },
  pr: {
    label: "PR",
    canSeeMap: false,
    canBuild: false,
    canTrip: false,
    ui: "pr",
  },
  sales: {
    label: "Продажи",
    canSeeMap: false,
    canBuild: false,
    canTrip: false,
    ui: "sales",
  },
  housing: {
    label: "ЖКХ",
    canSeeMap: "full",
    canBuild: false,
    canTrip: false,
    ui: "housing",
  },
  directors: {
    label: "Совет директоров",
    canSeeMap: false,
    canBuild: false,
    canTrip: false,
    ui: "directors",
  },
  hr: {
    label: "HR",
    canSeeMap: false,
    canBuild: false,
    canTrip: false,
    ui: "hr",
  },
};

export function getRole(roleId) {
  return ROLES[roleId] || null;
}

export function roleList() {
  return Object.entries(ROLES).map(([id, def]) => ({ id, ...def }));
}
