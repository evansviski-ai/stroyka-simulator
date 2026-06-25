/* =========================================================
   РЕЕСТР АССЕТОВ КАРТЫ
   Каждый блок описывает:
   - id: уникальный ключ (используется в Firebase world/objects.type)
   - label: имя в интерфейсе
   - category: foundation | wall | door | window | stairs | misc
   - glb: путь к модели (null = используется примитив-заглушка)
   - size: {w,h,d} габариты в клетках/единицах сетки (для footprint)
   - rotatable: можно ли поворачивать на 90°/180°/270°
   - placeholder: true, если это временный примитив до прихода реального GLB
========================================================= */

export const BLOCKS = [
  {
    id: "foundation_cube",
    label: "Фундамент (куб)",
    category: "foundation",
    glb: "assets/blocks/shape-cube.glb",
    size: { w: 1, h: 1, d: 1 },
    rotatable: false,
    placeholder: false,
    color: 0xb9bccB,
  },
  {
    id: "foundation_half",
    label: "Фундамент (половина)",
    category: "foundation",
    glb: "assets/blocks/shape-cube-half.glb",
    size: { w: 1, h: 0.5, d: 1 },
    rotatable: false,
    placeholder: false,
    color: 0xb9bccb,
  },
  {
    id: "wall_blank",
    label: "Стена глухая",
    category: "wall",
    glb: null, // TODO: заменить на реальный GLB, когда пришлют набор стен
    size: { w: 1, h: 1, d: 0.12 },
    rotatable: true,
    placeholder: true,
    color: 0xcf8f5c,
  },
  {
    id: "wall_window",
    label: "Стена с окном",
    category: "wall",
    glb: null, // TODO: заменить на реальный GLB
    size: { w: 1, h: 1, d: 0.12 },
    rotatable: true,
    placeholder: true,
    color: 0xcf8f5c,
    windowCutout: true,
  },
  {
    id: "window_glass",
    label: "Окно (стекло)",
    category: "window",
    glb: null, // TODO: заменить на реальный GLB
    size: { w: 0.8, h: 0.6, d: 0.05 },
    rotatable: true,
    placeholder: true,
    color: 0x8fd3f4,
    transparent: true,
  },
  {
    id: "door_sliding",
    label: "Дверь раздвижная",
    category: "door",
    glb: "assets/blocks/door-sliding.glb",
    size: { w: 0.35, h: 0.8, d: 0.7 },
    rotatable: true,
    placeholder: false,
    color: 0xe0735c,
  },
  {
    id: "door_sliding_double",
    label: "Дверь раздвижная двойная",
    category: "door",
    glb: "assets/blocks/door-sliding-double.glb",
    size: { w: 0.35, h: 0.8, d: 0.45 },
    rotatable: true,
    placeholder: false,
    color: 0xe0735c,
  },
  {
    id: "door_rotate",
    label: "Дверь поворотная",
    category: "door",
    glb: "assets/blocks/door-rotate.glb",
    size: { w: 0.15, h: 0.8, d: 0.6 },
    rotatable: true,
    placeholder: false,
    color: 0xe0735c,
  },
  {
    id: "door_garage",
    label: "Гаражные ворота",
    category: "door",
    glb: "assets/blocks/door-garage.glb",
    size: { w: 0.35, h: 0.8, d: 0.55 },
    rotatable: true,
    placeholder: false,
    color: 0xe0735c,
  },
  {
    id: "stairs",
    label: "Лестница",
    category: "misc",
    glb: "assets/blocks/stairs.glb",
    size: { w: 1, h: 1, d: 1 },
    rotatable: true,
    placeholder: false,
    color: 0xb9bccb,
  },
  {
    id: "crate",
    label: "Ящик",
    category: "misc",
    glb: "assets/props/crate.glb",
    size: { w: 1, h: 1, d: 1 },
    rotatable: false,
    placeholder: false,
    color: 0xb58b3d,
  },
  {
    id: "pipe_straight",
    label: "Труба (прямая)",
    category: "utility",
    glb: "assets/utilities/pipe.glb",
    size: { w: 1, h: 1, d: 1 },
    rotatable: true,
    placeholder: false,
    color: 0xe2643c,
  },
  {
    id: "pipe_corner",
    label: "Труба (угол)",
    category: "utility",
    glb: "assets/utilities/pipe-corner.glb",
    size: { w: 1, h: 1, d: 1 },
    rotatable: true,
    placeholder: false,
    color: 0xe2643c,
  },
];

export const BLOCKS_BY_ID = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));

export const CATEGORY_LABELS = {
  foundation: "Фундамент",
  wall: "Стены",
  window: "Окна",
  door: "Двери",
  misc: "Прочее",
  utility: "Коммуникации",
};

/* =========================================================
   СПЕЦТЕХНИКА
   Пока нет реальных GLB — используются примитивы-заглушки.
   Заменить glb:null на путь к модели одной строкой, когда придут файлы.
========================================================= */

export const EQUIPMENT_TYPES = {
  crane: { label: "Башенный кран", glb: null, color: 0xf5a623 },
  bulldozer: { label: "Бульдозер", glb: null, color: 0xe2b33d },
  loader: { label: "Погрузчик", glb: null, color: 0x378add },
};
