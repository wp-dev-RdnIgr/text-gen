# Задание для Claude Code: интерактивный прототип сервиса генерации SEO-текстов на Google Apps Script

## Контекст

Мы строим сервис массовой генерации SEO-текстов для digital-агентства. Бэкенд будет на n8n, но сейчас нужен интерактивный прототип веб-интерфейса на Google Apps Script для утверждения функциональности с заказчиком. Прототип работает на моковых данных (без реальных API) - вся "база данных" хранится в PropertiesService как JSON.

## Стек

- Google Apps Script (clasp-совместимая структура)
- HTML Service для UI (sidebar и standalone web app)
- CSS: кастомный, минималистичный, без фреймворков
- JS: ванильный, без библиотек
- Данные: PropertiesService (ScriptProperties) как key-value хранилище JSON-объектов
- Шрифт: Google Fonts - DM Sans

## Что нужно построить

### Архитектура файлов

```
Code.gs              - точка входа, роутинг, меню
DataStore.gs         - CRUD для моковых данных (PropertiesService)
Handlers.gs          - серверные обработчики для google.script.run
Seed.gs              - заполнение начальными данными (запускается один раз)

webapp.html          - главная страница standalone web app (SPA)
styles.html          - все CSS стили (подключается через include)
scripts.html         - вся клиентская JS-логика (подключается через include)

page_dashboard.html  - шаблон экрана: дашборд (клиенты + проекты)
page_generation.html - шаблон экрана: настройка и запуск генерации
page_progress.html   - шаблон экрана: прогресс генерации
page_templates.html  - шаблон экрана: библиотека шаблонов промтов
page_clients.html    - шаблон экрана: управление клиентами и проектами
```

### Деплой

Standalone Web App (doGet), доступ: Anyone within domain / Anyone с ссылкой.
URL выглядит как: https://script.google.com/macros/s/.../exec
Навигация внутри SPA через hash-роутинг (#dashboard, #generation, #templates, #clients).

---

## Моковые данные (DataStore.gs)

Вся "база" - это JSON-объекты в ScriptProperties. Ключи:

```
"clients"           → JSON массив клиентов
"projects"          → JSON массив проектов
"prompt_templates"  → JSON массив шаблонов промтов
"generations"       → JSON массив генераций
"generated_texts"   → JSON массив сгенерированных текстов
```

### Структура данных

```javascript
// Клиент
{
  id: "c1",
  name: "220.ua",
  website: "https://220.ua",
  niche: "Электроника и бытовая техника",
  contacts: "Иван Петров, ivan@220.ua",
  tov_default: "Экспертный, дружелюбный, без воды",
  notes: ""
}

// Проект
{
  id: "p1",
  client_id: "c1",
  name: "Блог",
  content_type: "blog",          // blog | product_card | category | service | custom
  tov: "Экспертный, дружелюбный. Обращение на 'вы'.",
  requirements: "3000-5000 знаков. Структура: H1, 3-5 H2, абзацы по 2-4 предложения.",
  context: "220.ua - крупнейший интернет-магазин электроники в Украине. ЦА: 25-45 лет, мужчины и женщины, средний доход.",
  target_audience: "25-45 лет, покупатели электроники",
  forbidden_words: "дешевый, китайский, бюджетный",
  min_uniqueness: 90,
  texts_count: 142,
  avg_uniqueness: 93
}

// Шаблон промта
{
  id: "t1",
  name: "Статья для блога",
  category: "blog",              // blog | product_card | category | service | custom | system_humanizer
  system_prompt: "Ты - SEO-копирайтер...",
  user_prompt: "Напиши статью на тему: {тема}\nURL: {url}\nКлючи: {ключи}\nТЗ: {тз}",
  variables: ["url", "ключи", "тема", "тз"],
  version: 3,
  usage_count: 142,
  avg_uniqueness: 93
}

// Генерация (пакет)
{
  id: "g1",
  project_id: "p1",
  template_id: "t1",
  llm_provider: "anthropic",     // openai | anthropic | perplexity
  llm_model: "claude-sonnet",
  status: "completed",           // pending | running | completed | failed
  total_texts: 50,
  completed_texts: 50,
  failed_texts: 0,
  options: {
    humanize: true,
    check_uniqueness: true,
    factcheck: false,
    ai_detector: false
  },
  created_at: "2026-03-18T14:30:00",
  completed_at: "2026-03-18T15:12:00"
}

// Сгенерированный текст
{
  id: "gt1",
  generation_id: "g1",
  row_number: 1,
  source_data: { url: "220.ua/blog/...", keys: "телевизор 4k", topic: "Как выбрать 4K телевизор", tz: "" },
  status: "completed",           // pending | generating | humanizing | checking_uniqueness | exporting | completed | failed
  uniqueness_score: 94,
  ai_score: null,
  gdoc_url: "https://docs.google.com/document/d/fake-id-1",
  error_message: null
}
```

### Seed.gs - начальные данные

Создать функцию seedData() которая заполняет PropertiesService:
- 4 клиента: 220.ua, Technolex, MedService, AutoParts
- 10 проектов (по 2-3 на клиента): разных типов (blog, product_card, category, service)
- 6 шаблонов промтов: "Статья для блога" v3, "Категория с фильтром" v2, "Карточка товара" v1, "Описание услуги" v1, "Лендинг" v1, "Гуманизатор" sys
- 5 генераций с разными статусами (2 completed, 1 running, 1 failed, 1 pending)
- 30 сгенерированных текстов для completed-генераций (разные статусы и скоры)

Также создать функцию resetData() которая очищает все и вызывает seedData() заново.

---

## Экраны и функциональность

### Экран 1: Дашборд (#dashboard) - главный экран

Структура:
- Слева: сайдбар (240px) со списком клиентов
- Справа: контент выбранного клиента

Сайдбар:
- Заголовок "SEO-тексты"
- Поле поиска (фильтрует клиентов по name в реальном времени на клиенте)
- Список клиентов: имя + кол-во проектов
- Активный клиент подсвечен синим
- Клик по клиенту: обновляет правую часть (без перезагрузки страницы)
- Кнопка "+ Добавить клиента" внизу (открывает модалку создания)

Контент:
- Хедер: название клиента + описание + кнопки "Шаблоны" и "Настройки клиента"
- Блок "Проекты": сетка 2 колонки с карточками
  - Каждая карточка: название, тип (бейдж), описание (обрезанное), кол-во текстов, средний % уникальности
  - Клик по карточке → переход на #generation?project_id=p1
  - Карточка "+ Добавить проект" (dashed border, открывает модалку)
- Блок "Последние генерации": таблица
  - Колонки: проект, дата, текстов, LLM, статус
  - Статусы: "В процессе" (оранжевый), "Готово" (зеленый), "Ошибка" (красный)
  - Клик по строке → переход на #progress?generation_id=g1

Модалки:
- "Создать клиента": поля name, website, niche, contacts, tov_default. Кнопки: Сохранить / Отмена.
- "Создать проект": поля name, content_type (select), tov, requirements, context, target_audience, forbidden_words, min_uniqueness. Кнопки: Сохранить / Отмена.
- "Редактировать клиента": те же поля, предзаполнены. + кнопка "Удалить" с подтверждением.
- "Редактировать проект": те же поля. + кнопка "Удалить".

Все модалки: overlay с затемнением фона, закрытие по клику на фон или кнопку X.

### Экран 2: Генерация (#generation?project_id=X)

Структура:
- Хедер: хлебные крошки "Клиент / Проект", название проекта
- Три вкладки: Данные | Прогресс | Результаты
- Правая панель (290px): настройки генерации

Вкладка "Данные":
- Таблица-редактор: 5 колонок
  - # (номер строки, авто)
  - URL (input, editable)
  - Ключевые слова (input, editable)
  - Тема (input, editable)
  - ТЗ (input, editable)
- Кнопка "+ Добавить строку" внизу таблицы
- Кнопка "Удалить строку" (X) справа от каждой строки
- Кнопка "Загрузить из Google Sheets" (открывает prompt с вводом URL таблицы - в прототипе просто генерирует 10 демо-строк)
- Данные хранятся в памяти (JS массив), не в PropertiesService

Правая панель "Настройки":
- Шаблон промта: select из prompt_templates (фильтр по content_type проекта + custom)
  - Под select: блок предпросмотра (серый, read-only) с текстом system_prompt (обрезанный)
- LLM: select с вариантами:
  - ChatGPT (GPT-4o)
  - ChatGPT (GPT-4o-mini)
  - Claude Sonnet
  - Claude Opus
  - Perplexity Online
- Чекбоксы "Постобработка":
  - [x] Гуманизация
  - [x] Проверка уникальности
  - [ ] Фактчекинг
  - [ ] AI-детектор
- Папка Google Drive: text input
- Блок "Оценка стоимости": желтый, показывает "{N} текстов x {model} ≈ ${price}"
  - Расчет: для каждой модели примерная стоимость за текст (GPT-4o: $0.03, GPT-4o-mini: $0.005, Claude Sonnet: $0.03, Claude Opus: $0.15, Perplexity: $0.02)
  - Обновляется при изменении кол-ва строк или модели
- Кнопка "Запустить генерацию" (зеленая)
  - При клике: создает запись generation в DataStore + generated_texts для каждой строки (status: pending)
  - Переключает на вкладку "Прогресс"
  - Запускает симуляцию генерации

Вкладка "Прогресс":
- Прогресс-бар: "{completed} из {total}"
- 4 карточки статистики: Готово (зеленый), В обработке (синий), Ожидает (серый), Ср. уникальность
- Список текстов: #, тема, статус-бейдж, уникальность %, ссылка на Doc
- Статусы бейджей:
  - "ожидает" - серый фон
  - "генерация" - синий фон, анимация pulse
  - "гуманизация" - желтый фон
  - "уникальность" - оранжевый фон
  - "готово" - зеленый фон
  - "ошибка" - красный фон
- Кнопка "Остановить" (красная, в хедере)
- СИМУЛЯЦИЯ ГЕНЕРАЦИИ: после запуска, setInterval каждые 2 секунды обновляет один текст:
  - pending → generating (1 шаг)
  - generating → humanizing (1 шаг)
  - humanizing → checking_uniqueness (1 шаг)
  - checking_uniqueness → completed (присвоить рандомный uniqueness_score 85-99, gdoc_url = фейковая ссылка)
  - С вероятностью 5% текст может получить статус "failed" с error_message
  - При обновлении: обновить прогресс-бар, карточки, список
  - Когда все тексты completed/failed → обновить generation.status = "completed"

Вкладка "Результаты":
- Показывается только когда генерация завершена
- 4 карточки: всего, готово, ошибки, средняя уникальность
- Полная таблица: #, тема, статус, уникальность %, AI %, ссылка на Doc
- Для ошибочных текстов: кнопка "Retry" (в прототипе меняет статус обратно на pending и запускает симуляцию для этого текста)
- Кнопка "Экспорт отчета" (в прототипе - alert с сообщением)

### Экран 3: Библиотека шаблонов (#templates)

Структура:
- Левая панель (300px): список шаблонов
- Правая часть: редактор выбранного шаблона

Левая панель:
- Заголовок "Библиотека промтов"
- Поле поиска
- Фильтр по категориям: кнопки-теги "Все", "Блог", "Товары", "Категории", "Услуги", "Системные"
- Список шаблонов: имя + версия + кол-во использований
- Активный подсвечен
- Кнопка "+ Новый шаблон" внизу

Правая часть (редактор):
- Хедер: название + бейдж версии + кнопки "Дублировать", "Удалить", "Сохранить"
- Поле "Категория": select (blog, product_card, category, service, custom, system_humanizer)
- Блок "Переменные": горизонтальный ряд тегов {url}, {ключи}, {тема}, {тз} + кнопка "+ добавить"
  - Клик на тег: prompt() → ввести имя → удалить тег
  - Клик "+ добавить": prompt() → ввести имя → добавить тег
- Textarea "Системный промт" (6 строк, monospace)
- Textarea "Пользовательский промт" (6 строк, monospace)
- 3 карточки статистики: дата создания, кол-во использований, средняя уникальность

Сохранение:
- При клике "Сохранить": если есть изменения → version + 1, обновить в DataStore
- При клике "Дублировать": создать копию с name + " (копия)", version = 1
- При клике "Удалить": confirm() → удалить из DataStore

Создание нового:
- Кнопка "+ Новый шаблон" → создает пустой шаблон, добавляет в список, выбирает его

### Экран 4: Управление клиентами (#clients)

Полноэкранный вид (без сайдбара):
- Таблица клиентов: название, сайт, ниша, кол-во проектов, кнопки "Редактировать" / "Удалить"
- Кнопка "+ Добавить клиента"
- Развернутый вид: клик по клиенту раскрывает блок с проектами этого клиента
  - Под клиентом: список проектов с кнопками редактирования
  - Кнопка "+ Добавить проект" к этому клиенту

---

## Навигация

Верхняя навигация (всегда видна):
- Лого "SEO-тексты" (клик → #dashboard)
- Табы: Дашборд | Шаблоны | Клиенты
- Справа: текст "Прототип v1.0"

Hash-роутинг:
- #dashboard (default)
- #generation?project_id=X
- #progress?generation_id=X
- #templates
- #templates?id=X (выбрать конкретный шаблон)
- #clients

При изменении hash → показать соответствующий экран, скрыть остальные.

---

## Стили (styles.html)

Общий стиль: минималистичный, светлый, чистый.

Цвета:
- Фон приложения: #F5F5F0
- Фон карточек/панелей: #FFFFFF
- Фон сайдбара: #FAFAF8
- Бордеры: #E5E5E0
- Текст основной: #1A1A1A
- Текст вторичный: #888888
- Текст третичный: #BBBBBB
- Accent (синий): #1A5FB4
- Success (зеленый): #16A34A
- Warning (оранжевый): #D97706
- Danger (красный): #DC2626
- Бейджи: голубой фон #EBF5FF / текст #1A5FB4, зеленый фон #ECFDF5 / текст #16A34A, желтый фон #FFFBEB / текст #D97706, красный фон #FEF2F2 / текст #DC2626

Типографика:
- font-family: 'DM Sans', sans-serif
- Заголовок страницы: 18px, weight 600
- Заголовок секции: 14px, weight 500, цвет #888
- Заголовок карточки: 14px, weight 600
- Текст: 13px, weight 400
- Мелкий текст: 11px
- Monospace (промты): 'DM Mono', monospace, 12px

Элементы:
- Кнопки: padding 6px 14px, border 1px solid #DDD, radius 7px, hover: background #F5F5F0
- Primary кнопка: background #16A34A, color white, border-color #16A34A
- Danger кнопка: border-color #DC2626, color #DC2626
- Inputs: padding 7px 12px, border 1px solid #DDD, radius 7px, focus: border-color #1A5FB4
- Select: те же стили что inputs
- Textarea: те же стили, monospace
- Карточки: background white, border 1px solid #E5E5E0, radius 12px, padding 18px
- Бейджи: font-size 10px, padding 3px 10px, radius 6px
- Модалки: overlay rgba(0,0,0,0.4), карточка max-width 500px, radius 12px, padding 24px
- Таблицы: без внешних бордеров, header background #FAFAF8, строки разделены 1px #F0F0EC
- Анимация pulse для статуса "генерация": @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }

---

## Серверные функции (Handlers.gs)

Все функции вызываются через google.script.run из клиентского JS.

```javascript
// CRUD клиенты
function getClients()                         // → массив клиентов
function saveClient(clientData)               // → сохраненный клиент (create или update по наличию id)
function deleteClient(clientId)               // → true/false

// CRUD проекты
function getProjects(clientId)                // → массив проектов клиента (если clientId null → все)
function getProject(projectId)                // → один проект
function saveProject(projectData)             // → сохраненный проект
function deleteProject(projectId)             // → true/false

// CRUD шаблоны
function getTemplates(category)               // → массив (если category null → все)
function getTemplate(templateId)              // → один шаблон
function saveTemplate(templateData)           // → сохраненный шаблон (version +1 при update)
function deleteTemplate(templateId)           // → true/false

// Генерации
function getGenerations(projectId)            // → массив генераций проекта
function getGeneration(generationId)          // → одна генерация
function createGeneration(data)               // → созданная генерация + generated_texts
  // data: { project_id, template_id, llm_provider, llm_model, options, rows: [{url, keys, topic, tz}] }
  // Создает generation + по одному generated_text на каждую строку

function getGeneratedTexts(generationId)      // → массив текстов генерации
function updateGeneratedText(textId, updates) // → обновленный текст (для симуляции прогресса)
function updateGeneration(genId, updates)     // → обновленная генерация

// Утилиты
function getAllDataForDashboard(clientId)      // → { client, projects, generations } одним вызовом
```

---

## Клиентская логика (scripts.html)

### SPA роутер

```javascript
function router() {
  var hash = window.location.hash || '#dashboard';
  var route = hash.split('?')[0];
  var params = parseParams(hash);

  hideAllScreens();
  switch(route) {
    case '#dashboard': showDashboard(params); break;
    case '#generation': showGeneration(params); break;
    case '#progress': showProgress(params); break;
    case '#templates': showTemplates(params); break;
    case '#clients': showClients(params); break;
    default: showDashboard(params);
  }
  updateNav(route);
}
window.addEventListener('hashchange', router);
```

### Симуляция генерации

При запуске генерации:
1. Вызвать createGeneration() на сервере
2. Получить generation_id и список generated_texts
3. Запустить setInterval(simulateStep, 2000)
4. Каждые 2 секунды:
   - Найти первый текст со статусом != completed && != failed
   - Перевести его на следующий статус
   - Если checking_uniqueness → completed: присвоить рандомный score, фейковый gdoc_url
   - Обновить на сервере через updateGeneratedText()
   - Перерисовать UI (прогресс-бар, список, карточки)
5. Когда все обработаны → clearInterval, обновить generation.status

### Общие паттерны

- Все вызовы к серверу через обертку:
  ```javascript
  function callServer(fn, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [fn](...args);
    });
  }
  ```
- Loading state: показывать спиннер при загрузке данных
- Toasts/уведомления: простой div в правом верхнем углу, автоскрытие через 3 сек
- Модалки: один контейнер #modal-overlay, контент генерируется динамически

---

## Требования к коду

1. Весь CSS в одном файле styles.html, подключается через <?!= include('styles') ?>
2. Весь JS в одном файле scripts.html, подключается через <?!= include('scripts') ?>
3. HTML-шаблоны экранов в отдельных файлах, подключаются через include
4. Функция include(filename) в Code.gs:
   ```javascript
   function include(filename) {
     return HtmlService.createHtmlOutputFromFile(filename).getContent();
   }
   ```
5. Комментарии в коде на русском
6. Не использовать букву "е" - вместо нее "е" (без точек)
7. Все тексты интерфейса на русском
8. ID-генерация: простой инкремент - "c" + timestamp для клиентов, "p" + timestamp для проектов и т.д.
9. Обработка ошибок: try/catch на серверных функциях, alert при ошибках на клиенте
10. Responsive: min-width 1024px, на меньших экранах горизонтальный скролл

## Результат

После выполнения я должен получить:
1. Полный набор .gs и .html файлов
2. При деплое как Web App - рабочий интерактивный прототип
3. Функция seedData() для заполнения демо-данными
4. Все экраны кликабельны и переходят друг в друга
5. Симуляция генерации работает с анимацией прогресса
6. CRUD для клиентов, проектов, шаблонов работает (создание, редактирование, удаление)
