# Encar.ai — Функциональная документация

## Стек

Один файл `index.html` — Vanilla JS, без backend, без фреймворков.
Всё работает в браузере напрямую через публичные API.

---

## Модули и функции

### Поиск

| Функция | Назначение |
|---|---|
| `runAI()` | Берёт текст из AI-строки, отправляет в YandexGPT, получает JSON-параметры |
| `parseNL(q)` | Запрос к YandexGPT API → парсит NL в `{manufacturer, model_group, year, price, fuel, ...}` |
| `runSearch()` | Читает UI-фильтры, формирует параметры поиска |
| `buildQuery(p)` | Строит строку запроса для Encar API в формате `(And.Year.range()._...)` |
| `fetchPage(q, offset, count)` | Один GET-запрос к `api.encar.com/search/car/list/general` |
| `doSearch(p)` | Оркестратор: первая страница → получает `Count` → параллельные запросы (до 200 авто) |

### Парсинг данных

| Функция | Назначение |
|---|---|
| `parseCar(c)` | Из сырого объекта API делает нормализованный объект: `usd`, `rub`, `fuel_ru`, `drive`, `photos[]`, `thumbnail` |
| `getCarType(maker)` | Определяет Korean (`Y`) или foreign (`N`) тип авто |

### Фото

| Функция | Назначение |
|---|---|
| `parseCar()` → photos | Строит URLs: `https://ci.encar.com/carpicture` + `Photo` + `_001..008.jpg` |
| `autoLoadVisiblePhotos()` | IntersectionObserver — загружает фото карточек при попадании в viewport (rootMargin 400px) |
| `loadPhotos(id)` | Первый клик или автозагрузка → кэширует в `PHOTOS[id]` |
| `renderPhotos(id, photos)` | Заполняет слайдер, показывает кнопки prev/next, dots |
| `slide(id, dir)` | Листание слайдера через `transform: translateX` |

### AI-анализ лота

| Функция | Назначение |
|---|---|
| `aiOne(id, idx, src)` | Формирует промпт с данными конкретного авто, отправляет в YandexGPT, выводит в карточку |

### Фильтры и сортировка

| Функция | Назначение |
|---|---|
| `buildBadgeFilter(cars)` | Строит горизонтальный ряд кнопок по уникальным Badge значениям |
| `filterBadge(badge)` | Клиентская фильтрация по Badge после получения результатов |
| `doSort()` | Сортировка текущих `STATE.results` по цене/пробегу |
| `onMakerChange()` | Заполняет дропдаун моделей из `MODELGROUPS[maker]` |
| `onModelChange()` | Обновляет BadgeGroup кнопки (топливо+привод) |

### Избранное

| Функция | Назначение |
|---|---|
| `toggleFav(id)` | Добавляет/убирает из `STATE.favs`, сохраняет в `localStorage` |
| `renderFavs()` | Рендерит карточки из `STATE.favs` |
| `clearFavs()` | Очищает всё избранное |

---

## Связи между данными

```
localStorage('encar_cfg')  →  CFG { key, folder, count, usd, krw }
localStorage('encar_favs') →  STATE.favs { id: carObject }

STATE.results[]  →  renderCars()  →  makeCard()  →  DOM
PHOTOS{}         →  renderPhotos()  →  слайдер в карточке

YandexGPT API  →  parseNL()  →  buildQuery()  →  Encar API  →  parseCar()  →  STATE.results
```

---

## Внешние API

| API | URL | Используется для |
|---|---|---|
| **Encar Search** | `api.encar.com/search/car/list/general` | Поиск авто |
| **Encar CDN** | `ci.encar.com/carpicture/...` | Фотографии (`referrerpolicy="no-referrer"`) |
| **YandexGPT** | `llm.api.cloud.yandex.net/foundationModels/v1/completion` | NL→параметры и AI-анализ лота |

---

## Структура состояния

```js
CFG = {
  key:    '',      // YandexGPT API Key
  folder: '',      // YandexGPT Folder ID
  count:  30,      // авто за один запрос
  usd:    90,      // курс USD → RUB
  krw:    0.0675,  // курс KRW → RUB (за 1 вон)
}

STATE = {
  mode:       'ai',   // режим поиска
  results:    [],     // текущие результаты поиска
  favs:       {},     // избранное { id: carObject }
  lastParams: null,   // последние параметры запроса
}

PHOTOS = {
  // carId → { idx: 0, list: ['url1', 'url2', ...] }
}
```

---

## Структура файлов

```
/Search/
├── index.html      ← весь код (~2000 строк)
├── sw.js           ← Service Worker (PWA offline)
├── manifest.json   ← start_url: "/Search/index.html"
└── FUNCTIONS.md    ← этот файл
```
