# CONTEXT.md — Encar Search PWA

## Проект

**Encar.ai** — PWA для поиска автомобилей на корейском рынке Encar.com.  
Репозиторий: `https://github.com/kcepofopmpa/Search`  
URL: `https://kcepofopmpa.github.io/Search/`  
Стек: HTML + Vanilla JS (один файл `index.html`), GitHub Pages, без бэкенда.

---

## Структура файлов

```
/Search/
├── index.html     ← весь код приложения (~70 KB)
├── sw.js          ← Service Worker (PWA offline)
└── manifest.json  ← start_url: "/Search/index.html"  ← ВАЖНО для GitHub Pages
```

---

## Encar API

### Базовый URL поиска
```
https://api.encar.com/search/car/list/general
```

### Параметры запроса
```
?count=true
&q=<query>
&sr=|ModifiedDate|<offset>|<count>
```

### Формат query (q)

**Только марка (импортные):**
```
(And.Year.range(202001..202612)._.Mileage.range(0..200000)._.Price.range(100..99000)._.Hidden.N._.CarType.N._.Manufacturer.BMW.)
```

**Марка + модель (корейские) — ВЛОЖЕННАЯ структура C.:**
```
(And.Year.range(202001..202612)._.Mileage.range(0..200000)._.Price.range(100..99000)._.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.기아._.ModelGroup.EV6.)))
```

**Ключевые правила:**
- Корейские авто: `CarType.Y`, импортные: `CarType.N`
- Год: `range(YYYYMM..YYYYMM)` — формат с месяцем, НЕ просто год
- Модель через `ModelGroup` с вложением `C.` — обязательно
- Цена в **만원** (10,000 KRW): $60,000 USD × 1340 / 10000 ≈ 8040 만원

### Пагинация
```javascript
const PAGE = 50;   // авто на страницу
const MAX  = 200;  // максимум загружаем

// Первый запрос — получаем Count
const first = await fetchPage(q, 0, PAGE);
const total = first.Count;

// Параллельные запросы
const pages = Math.min(Math.ceil(total/PAGE), Math.ceil(MAX/PAGE));
const fetches = [];
for(let i=1; i<pages; i++) fetches.push(fetchPage(q, i*PAGE, PAGE));
const results = await Promise.all(fetches);
```

### Структура ответа (SearchResults)
```json
{
  "Count": 668,
  "SearchResults": [
    {
      "Id": 32145678,
      "Manufacturer": "기아",
      "Model": "EV6",
      "ModelGroup": "EV6",
      "Badge": "Long Range 2WD",
      "BadgeDetail": "Air",
      "FuelType": "전기",
      "Gearbox": "오토",
      "Displacement": "0",
      "Mileage": 35000,
      "Year": "202303",
      "Price": 3500,
      "OfficeCityState": "서울",
      "Photo": "/carpicture/carpicture10/pic3214/32145678_001.jpg",
      "BadgeGroup": "전기 2WD"
    }
  ]
}
```

### Фото
```javascript
// Из поля Photo (предпочтительно)
const photoBase = 'https://ci.encar.com' + car.Photo;
const base = photoBase.replace(/_\d{3}\.jpg.*$/i, '');
for(let i=1; i<=8; i++) {
  photos.push(`${base}_${String(i).padStart(3,'0')}.jpg`);
}

// Fallback по ID авто
const folderNum = Math.floor(carId / 10000) * 10000;
const picFolder = String(folderNum).padStart(8,'0').slice(0,4);
const base = `https://ci.encar.com/carpicture/carpicture10/pic${picFolder}`;
```

---

## YandexGPT API

```
URL: https://llm.api.cloud.yandex.net/foundationModels/v1/completion
Folder ID: b1gn1sbbjgb5marpoqvk
Model: yandexgpt-lite
Auth: Api-Key <key>
```

### Запрос
```javascript
const body = JSON.stringify({
  modelUri: `gpt://${CFG.folder}/yandexgpt-lite`,
  completionOptions: { temperature: 0.1, maxTokens: 250 },
  messages: [{ role: 'user', text: prompt }]
});

const r = await fetch(YANDEX_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Api-Key ${CFG.key}`,
    'Content-Type': 'application/json; charset=utf-8',
  },
  body
});

// ВАЖНО: читать как text() сначала, потом парсить JSON
const rawText = await r.text();
if(!r.ok) throw new Error(`YandexGPT ${r.status}: ${rawText.slice(0,100)}`);
const d = JSON.parse(rawText);
const txt = d.result.alternatives[0].message.text.trim();
```

### Промпт для NL→параметры поиска
```
Распарси запрос на поиск автомобиля. Верни ТОЛЬКО JSON без пояснений и markdown.
Запрос: "${q}"

{
  "car_type": "korean" или "foreign",
  "manufacturer": один из [hyundai, kia, genesis, bmw, mercedes, audi, ...],
  "model_group": ModelGroup из Encar: EV6, GV80, 싼타페, 팰리세이드, 5시리즈, E클래스, ...,
  "year_from": YYYY,
  "year_to": YYYY,
  "mileage_max": число км,
  "price_max_manwon": price_USD * 1340 / 10000,
  "fuel": "가솔린" | "디젤" | "전기" | "가솔린+전기"
}
```

---

## Конвертация валют

```javascript
// KRW → USD: цена в 만원 × 10000 / 1340
const usd = Math.round(pmw * 10000 / 1340);

// KRW → RUB: цена в 만원 × 10000 × krwRate
const rub = Math.round(pmw * 10000 * (CFG.krw || 0.0675));

// USD → 만원 (для фильтра): usd * 1340 / 10000
const manwon = Math.round(usd * 1340 / 10000);
```

---

## Карта марок (MAKERS_KR)

Корейские имена для запроса к Encar API:

```javascript
const MAKERS_KR = {
  hyundai: '현대',   kia: '기아',      genesis: '제네시스', ssangyong: '쌍용',
  renault: '르노삼성',
  bmw: 'BMW',       mercedes: '벤츠', audi: '아우디',    volkswagen: '폭스바겐',
  porsche: '포르쉐', mini: '미니',
  lexus: '렉서스',   toyota: '도요타', honda: '혼다',     nissan: '닛산',
  mazda: '마쯔다',   subaru: '스바루', infiniti: '인피니티', acura: '어큐라',
  volvo: '볼보',
  landrover: '랜드로버', jaguar: '재규어', bentley: '벤틀리', rollsroyce: '롤스로이스',
  jeep: '지프',      chevrolet: '쉐보레', ford: '포드', cadillac: '캐딜락', lincoln: '링컨',
  ferrari: '페라리', lamborghini: '람보르기니', maserati: '마세라티',
  alfa: '알파 로메오', mclaren: '맥라렌', astonmartin: '애스턴마틴',
  tesla: '테슬라',   peugeot: '푸조',  mitsubishi: '미쯔비시',
};
```

---

## MODELGROUPS (структура)

```javascript
// Формат: [slug, ModelGroup_Korean, DisplayName_EN]
const MODELGROUPS = {
  hyundai: [
    ['santafe',  '싼타페',    'Santa Fe'],
    ['palisade', '팰리세이드', 'Palisade'],
    ['ioniq5',   '아이오닉 5', 'IONIQ 5'],
    // ... ~40 моделей
  ],
  kia: [
    ['ev6',      'EV6',      'EV6'],
    ['sorento',  '쏘렌토',   'Sorento'],
    // ... ~47 моделей
  ],
  bmw: [
    ['5series',  '5시리즈',  '5 Series'],
    ['3series',  '3시리즈',  '3 Series'],
    // ... ~30 моделей
  ],
  // ... 30+ марок
};
```

**Источник:** файл `searchDataForBanner.js` с сайта Encar — 75 марок, 930 моделей.  
Корейские ModelGroup имена взяты напрямую из него — точно совпадают с Encar API.

---

## buildQuery — логика построения запроса

```javascript
function buildQuery(p) {
  const ct = p.car_type === 'foreign' ? 'N' : getCarType(p.manufacturer);
  const base = [
    `And.Year.range(${yf}01..${yt}12).`,
    `_.Mileage.range(0..${mil}).`,
    `_.Price.range(${pMn}..${pMx}).`,
    `_.Hidden.N.`,
  ];

  if(p.badgeGroups && p.badgeGroups.length === 1) {
    base.push(`_.BadgeGroup.${p.badgeGroups[0]}.`);
  }

  const makerKr = MAKERS_KR[p.manufacturer];
  const mg = p.model_group;  // Korean ModelGroup name

  if(makerKr && mg) {
    // Точный поиск с ModelGroup — вложенная C. структура
    base.push(`_.(C.CarType.${ct}._.(C.Manufacturer.${makerKr}._.ModelGroup.${mg}.))`);
  } else if(makerKr) {
    // Только марка
    base.push(`_.CarType.${ct}.`);
    base.push(`_.Manufacturer.${makerKr}.`);
  } else {
    base.push(`_.CarType.${ct}.`);
  }

  return '(' + base.join('') + ')';
}
```

---

## Клиентские фильтры (после получения данных)

```javascript
// Топливо
if(p.fuel) cars = cars.filter(c => c.fuel === p.fuel);

// Привод (из Badge/BadgeDetail)
if(p.drive) cars = cars.filter(c => c.drive === p.drive);
// drive определяется в parseCar: ищем 4WD/AWD/xDrive/quattro → 'AWD', иначе FWD/RWD

// Комплектация (текстовый поиск)
if(p.badge) {
  const bl = p.badge.toLowerCase();
  cars = cars.filter(c =>
    c.badge.toLowerCase().includes(bl) ||
    c.badgeDetail.toLowerCase().includes(bl)
  );
}

// Дедупликация
const seen = new Set();
cars = cars.filter(c => {
  const k = `${c.model}_${c.badge}_${c.mileage_km}_${c.pmw}`;
  if(seen.has(k)) return false;
  seen.add(k);
  return true;
});
```

---

## parseCar — разбор объекта из API

```javascript
function parseCar(c) {
  const pmw = c.Price || 0;
  const yr = String(c.Year || '000000');

  // Фото из поля Photo
  const photoField = c.Photo || null;
  const photos = [];
  if(photoField) {
    const base = ('https://ci.encar.com' + photoField).replace(/_\d{3}\.jpg.*$/i, '');
    for(let i=1; i<=8; i++) photos.push(`${base}_${String(i).padStart(3,'0')}.jpg`);
  }

  // Привод из текста Badge
  const driveText = ((c.Badge||'') + ' ' + (c.BadgeDetail||'')).toLowerCase();
  let drive = '';
  if(driveText.includes('4wd') || driveText.includes('awd') ||
     driveText.includes('xdrive') || driveText.includes('quattro')) drive = 'AWD';
  else if(driveText.includes('2wd') || driveText.includes('fwd')) drive = 'FWD';
  else if(driveText.includes('rwd')) drive = 'RWD';

  return {
    id:           String(c.Id || ''),
    url:          `https://www.encar.com/dc/dc_cardetailview.do?carid=${c.Id}`,
    manufacturer: c.Manufacturer || '',
    model:        c.Model || '',
    badge:        c.Badge || '',
    badgeDetail:  c.BadgeDetail || '',
    displacement: c.Displacement ? `${c.Displacement}cc` : '',
    gearbox:      c.Gearbox || '',
    drive,
    year:         yr.slice(0,4),
    month:        yr.slice(4,6),
    mileage_km:   parseInt(c.Mileage || 0),
    fuel:         c.FuelType || '',
    fuel_ru:      FUEL_RU[c.FuelType] || c.FuelType || '',
    region:       c.OfficeCityState || '',
    pmw,
    usd:          Math.round(pmw * 10000 / 1340),
    rub:          Math.round(pmw * 10000 * (CFG.krw || 0.0675)),
    photos,
    ai:           '',
  };
}
```

---

## FUEL_RU — переводы топлива

```javascript
const FUEL_RU = {
  '가솔린': 'Бензин',
  '디젤': 'Дизель',
  '전기': 'Электро',
  '가솔린+전기': 'Гибрид',
  'LPG': 'LPG',
};
```

---

## BadgeGroup (топливо + привод из Encar iNav API)

```javascript
// Ключ: "maker:modelGroup_kr"
// Значения — из iNav API (Encar навигационные фильтры)
const BADGE_GROUPS = {
  'bmw:5시리즈': ['가솔린 2WD', '가솔린 4WD', '디젤 2WD', '디젤 4WD', '가솔린+전기 2WD'],
  // Добавлять по мере получения данных через DevTools
};
```

**Источник данных:** файл `5.txt` — iNav ответ Encar для BMW 5 Series.  
Поколения: `5시리즈 (G60)` 708 авто, `5시리즈 (G30)` 3265 авто, `5시리즈 (F10)` 634 авто.  
**BadgeGroup** — комбо топливо+привод, используется в API как `_.BadgeGroup.가솔린 4WD.`

---

## Настройки (CFG, localStorage: 'encar_cfg')

```javascript
let CFG = {
  key:     '',      // YandexGPT API Key
  folder:  '',      // YandexGPT Folder ID (b1gn1sbbjgb5marpoqvk)
  count:   30,      // авто за один запрос (макс в sr параметре)
  usd:     90,      // курс USD → RUB
  krw:     0.0675,  // курс KRW → RUB (за 1 вон)
};
```

---

## Избранное (STATE.favs, localStorage: 'encar_favs')

```javascript
STATE.favs = {
  '32145678': { id, url, manufacturer, model, badge, usd, rub, ... },
  // ...
};
```

---

## Текущий статус (март 2026)

### Работает
- Поиск по марке и модели через структуру `C.ModelGroup` — точный, находит все объявления
- Пагинация до 200 авто (4 страницы × 50 параллельно)
- AI режим (NL текст → YandexGPT → параметры → Encar API)
- Режим фильтров (UI селекторы)
- Фильтры: топливо, привод, Badge текст, BadgeGroup
- 695 моделей по 30+ маркам (из официальной базы Encar)
- Карточки с Badge/BadgeDetail/displacement/gearbox тегами
- Избранное (localStorage)
- AI анализ лота через YandexGPT (на каждую карточку)
- Тема: #1E1E1E фон, #E8640A оранжевый акцент (Claude-style)
- PWA: manifest.json `start_url: "/Search/index.html"`, Service Worker

### Не работает / в процессе
- Фото: слайдер отображается, но изображения могут не грузиться (CORS или неверный URL)
- Badge/трим комплектации (520i, M Sport и т.д.) — нужны SearchResults данные из DevTools
- Адаптивная сетка для PC (1/3/4 колонки) — запланировано, не сделано

---

## Бэклог (приоритет)

1. **Фото** — разобраться с URL ci.encar.com, возможно нужен прокси
2. **Комплектации** — собрать Badge значения из SearchResults через DevTools (для топ-моделей)
3. **BadgeGroup данные** — добавить iNav ответы для других марок помимо BMW 5
4. **Адаптивная сетка** — 1 колонка мобайл / 3 стандарт / 4 широкий экран
5. **Модульность** — разбить index.html на модули (AI, фото, Telegram, КП)
6. **PC layout** — левая шторка с фильтрами, правая часть с результатами

---

## Как получить данные для комплектаций (DevTools)

Нужен **SearchResults** (не iNav):

1. Chrome → `https://www.encar.com/fc/fc_carsearchlist.do?carType=for`
2. F12 → Network → фильтр `api.encar.com`
3. Выбери марку → модель → нажми поиск
4. Запрос `general?count=true&q=...&sr=...` → Response → скопируй JSON
5. Из него извлекаются уникальные значения `Badge` и `BadgeDetail`

Нужен **iNav** (для BadgeGroup):

1. Те же шаги, но ищи запрос `general?count=true&q=...` **без** `sr=` параметра или с `inav=`
2. Или: запрос который возвращает `iNav.Nodes` в ответе

---

## Ключевые уроки (не забывать)

| Проблема | Решение |
|---|---|
| Модель находит мало авто | Использовать `C.ModelGroup.` вложенную структуру, не плоскую |
| Год не фильтрует | Формат `range(202001..202612)` с месяцем, не `range(2020..2026)` |
| YandexGPT ошибка "token '<'" | Читать ответ как `r.text()`, потом JSON.parse |
| PWA 404 при открытии | `manifest.json` start_url должен быть `/Search/index.html` |
| Фото не грузятся | Убрать `?impolicy=heightRate`, использовать чистый URL |
| Korean chars в запросе | encodeURIComponent() при передаче в fetch URL |
