# STROYKA BS v2 — архитектура данных и ролей

## 1. Дерево Firebase Realtime Database

```
stroyka-bs/
├── meta/
│   ├── timerEndsAt          // unix ms — когда заканчивается раунд
│   ├── timerDurationMin      // изначальная длительность (для рестарта)
│   ├── companyGoals          // string — текст целей компании (видят все)
│   └── techRequirements      // string — техтребования к зданиям (видит СД)
│
├── budget/
│   ├── total                 // number — текущий остаток общего бюджета
│   └── log/{logId}            // { ts, delta, reason, byRole } — лента списаний/пополнений
│
├── materials/
│   ├── stock/{materialId}     // { name, qty, unitPrice } — склад материалов (видят Финансы+Рабочие, поставляет ЖКХ)
│   └── catalog/{materialId}   // { name, unitPrice } — справочник цен (видят Финансы; СД видит через techRequirements)
│
├── world/
│   └── objects/{objId}        // { type, x, y, z, rotationY, level, placedBy, ts } — кубики/блоки на карте (видят Рабочие всегда; Архитекторы/Инженеры только в командировке)
│
├── architecture/
│   └── masterplan            // { svgOrImageDataUrl / strokes[], updatedAt, updatedBy } — макет жилого комплекса (рисует Архитектурное бюро)
│
├── engineering/
│   └── blueprint             // { strokes[], updatedAt, updatedBy } — чертежи домов (рисует Инженерный отдел)
│
├── marketing/
│   └── board                 // { strokes[], campaignText, updatedAt, updatedBy } — PR-материалы (рисует PR)
│
├── sales/
│   └── listings/{unitId}      // { name, price, status: "available"|"reserved"|"sold", buyer } — продажи квартир/домов
│
├── directives/
│   └── {directiveId}          // { text, fromRole:"directors", toDept: "all"|deptId, ts } — приказы СД, транслируемые в любое подразделение или всем
│
├── trips/
│   └── {role}/{userId}        // { onTrip: bool, startedAt, endsAt } — командировки архитекторов/инженеров (платные)
│
├── equipment/
│   └── {equipId}               // { kind:"crane"|"bulldozer"|"loader", x,z, fuel, load, status, operatedBy } — спецтехника, видна Рабочим + Финансам
│
├── presence/
│   └── {sessionId}             // { role, joinedAt, lastSeen } — кто сейчас в сессии и под какой ролью (для списка участников)
│
└── penalties/
    └── {penaltyId}             // { amount, reason, targetRole, ts } — штрафы (видят все роли)
```

**Примечание по структуре:** каждая активность из вашей таблицы превращается в отдельную top-level ветку, а не в один общий `world`. Это специально — потому что видимость в Firebase Realtime DB управляется на уровне пути (без серверных правил по ролям мы не можем скрыть *поля*, но можем не *слушать* (`onValue`) лишние ветки на клиенте). Чем мельче ветки, тем точнее можно решить, какие `onValue`-подписки создавать для каждой роли — это и есть механизм видимости в honor-system модели.

## 2. Матрица видимости по ролям (что слушает клиент)

| Роль | Слушает (onValue) | Не слушает / не подписывается |
|---|---|---|
| Рабочие | `world/objects` (полностью, всегда), `meta/companyGoals`, `penalties`, `equipment` | `budget`, `architecture`, `engineering`, `sales`, `materials/catalog` |
| Финансы | `budget`, `materials/stock`, `materials/catalog`, `meta/companyGoals`, `penalties`, `equipment` | `world/objects` (не нужно), `architecture`, `engineering` |
| Архитектурное бюро | `architecture/masterplan` (рисование), `meta/companyGoals`, `penalties`, `trips/architects/{me}`; `world/objects` **только если** `trips.architects.{me}.onTrip === true` | `budget`, `materials`, `sales` |
| Инженерный отдел | `engineering/blueprint`, `meta/companyGoals`, `penalties`, `trips/engineers/{me}`; `world/objects` **только если** в командировке | `budget`, `materials`, `sales` |
| PR | `marketing/board`, `meta/companyGoals`, `penalties` | `world/objects`, `budget`, `architecture` (бюро), `sales` |
| Продажи | `sales/listings`, `meta/companyGoals`, `penalties` | `world/objects`, `budget`, `architecture` |
| ЖКХ | `materials/stock` (пишет!), `meta/companyGoals`, `penalties`, `world/objects` (полностью — нужно видеть, куда тянуть коммуникации) | `budget` (только пишет недостающее — фактически нужен readonly на `materials/catalog`) |
| СД (директора) | `directives` (пишет), `meta/*` (включая `techRequirements`), `budget` (readonly, по таблице — да), `penalties`, `meta/companyGoals` | `world/objects` (нет, по таблице) |
| HR | По умолчанию ничего из вышеперечисленного — "только по запросу". В интерфейсе HR будет кнопка "Запросить доступ", которая шлёт `directives` с `toDept:"directors"`; сами данные не подгружаются, пока кто-то вручную не "выдаст" — для MVP сделаем HR-вкладку с заглушкой и тем же запросным механизмом. | Всё перечисленное, по умолчанию |

## 3. Командировки (Архитекторы / Инженеры)

- Кнопка "В командировку" доступна только у архитекторов/инженеров.
- Списывает фиксированную сумму с `budget/total` (платность из таблицы).
- Пишет `trips/{role}/{userId} = { onTrip:true, startedAt, endsAt }`.
- Пока `onTrip:true` и `now < endsAt` — клиент подписывается на `world/objects` и показывает реальную 3D-карту вместо схематичной заглушки.
- По истечении `endsAt` — клиент сам отписывается (таймер на фронте), возвращает схематичный вид.

## 4. Спецтехника (кран/бульдозер/погрузчик)

- Каждая единица — запись в `equipment/{id}` с позицией на карте и параметрами (топливо, статус, кто оператор).
- Рендерится как 3D-объект на самой карте (видна Рабочим в реальном времени, как и постройки).
- Финансисты не видят 3D-карту, но видят текстовую/карточную панель параметров техники (топливо/статус/расход), подписавшись на ту же ветку `equipment` без рендера сцены.

## 5. Открытый вопрос — нужно ваше решение

Прежде чем кодировать всё это, мне нужно зафиксировать с вами ещё несколько развилок (следующее сообщение) — это сильно влияет на объём кода:

1. Рисование (макет ЖК / чертежи / PR-доска) — какой инструмент: свободное рисование кистью (canvas, как сейчас) или что-то более структурированное (фигуры/линии/текст)?
2. Продажи — нужен ли список конкретных юнитов (квартир/домов) с ценами, или достаточно одной общей формы "выставить цену / отметить продано"?
3. Приказы СД — это просто текстовая лента уведомлений у получателя, или нужен явный "входящий" список с возможностью отметить прочитанным?
