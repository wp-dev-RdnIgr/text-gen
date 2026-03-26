// ===========================================
// Seed.gs - Заполнение начальными данными
// ===========================================

function seedData() {
  var props = PropertiesService.getScriptProperties();

  // --- Клиенты ---
  var clients = [
    { id: 'c1', name: '220Volt', website: 'https://220volt.com.ua', niche: 'Электроника и бытовая техника', notes: '' },
    { id: 'c2', name: 'Technolex', website: 'https://technolex.com.ua', niche: 'Юридические услуги', notes: 'Важно: юридическая точность формулировок' },
    { id: 'c3', name: 'MedService', website: 'https://medservice.ua', niche: 'Медицинские услуги', notes: 'Не давать медицинских рекомендаций' }
  ];

  // --- Шаблоны задач ---
  var taskTemplates = [
    {
      id: 'tt_1',
      name: 'SEO-статья для блога',
      description: 'Генерация экспертных SEO-статей для блога с ключевыми словами, структурой H2, обязательными ссылками.',
      client_ids: ['c1'],
      system_prompt: 'Ты — опытный SEO-копирайтер с 10-летним стажем. Пишешь экспертные статьи для блогов. Тексты информативные, структурированные, оптимизированные под поисковые системы. Абзацы по 2-4 предложения.',
      user_prompt: 'Напиши SEO-статью.\n\nURL страницы: {{url}}\nЯзык: {{language}}\nТема / H1: {{topic}}\nОсновные ключевые слова: {{keywords}}\nОбъём: {{volume}} збп\n\nСтруктура статьи (H2):\n{{h2_structure}}\n\nОбязательные ссылки для вставки в текст:\n{{links}}\n\n{{company_block}}\n\n{{notes}}',
      core_fields: { url: true, keywords: true, topic: true, language: true, volume: true },
      flex_blocks: [
        { key: 'h2_structure', label: 'Структура H2', type: 'repeatable', enabled: true },
        { key: 'links', label: 'Обов\'язкові посилання', type: 'repeatable', enabled: true },
        { key: 'company_block', label: 'Блок про компанію', type: 'textarea', enabled: true },
        { key: 'expert_block', label: 'Блок про експерта', type: 'textarea', enabled: false },
        { key: 'notes', label: 'Примітки редактору / SEO', type: 'textarea', enabled: true }
      ],
      llm_provider: 'anthropic', llm_model: 'Claude Sonnet',
      options: { humanize: true, uniqueness: true, factcheck: false, ai_detector: true },
      created_at: '2026-03-10T10:00:00.000Z'
    },
    {
      id: 'tt_2',
      name: 'Карточка товара',
      description: 'Продающее описание товара для интернет-магазина.',
      client_ids: ['c1'],
      system_prompt: 'Ты — копирайтер для интернет-магазинов. Создаёшь продающие описания товаров.',
      user_prompt: 'Напиши описание товара.\n\nURL: {{url}}\nНазвание товара: {{topic}}\nКлючевые слова: {{keywords}}\nОбъём: {{volume}} збп\n\nСтруктура:\n1. Краткое описание\n2. Характеристики (список)\n3. Преимущества (3-5)\n4. Для кого подходит\n\n{{notes}}',
      core_fields: { url: true, keywords: true, topic: true, language: false, volume: true },
      flex_blocks: [
        { key: 'notes', label: 'Примітки', type: 'textarea', enabled: false }
      ],
      llm_provider: 'openai', llm_model: 'ChatGPT (GPT-4o)',
      options: { humanize: false, uniqueness: true, factcheck: false, ai_detector: false },
      created_at: '2026-03-12T12:00:00.000Z'
    },
    {
      id: 'tt_3',
      name: 'Описание услуги',
      description: 'Убедительное описание услуги для сервисных компаний.',
      client_ids: ['c2', 'c3'],
      system_prompt: 'Ты — копирайтер для сервисных компаний. Создаёшь убедительные описания услуг.',
      user_prompt: 'Напиши описание услуги.\n\nURL: {{url}}\nУслуга: {{topic}}\nКлючевые слова: {{keywords}}\nОбъём: {{volume}} збп\n\nСтруктура (H2):\n{{h2_structure}}\n\n{{expert_block}}\n\n{{notes}}',
      core_fields: { url: true, keywords: true, topic: true, language: true, volume: true },
      flex_blocks: [
        { key: 'h2_structure', label: 'Структура H2', type: 'repeatable', enabled: true },
        { key: 'expert_block', label: 'Блок про експерта', type: 'textarea', enabled: true },
        { key: 'notes', label: 'Примітки', type: 'textarea', enabled: false }
      ],
      llm_provider: 'anthropic', llm_model: 'Claude Sonnet',
      options: { humanize: true, uniqueness: true, factcheck: true, ai_detector: false },
      created_at: '2026-03-15T09:00:00.000Z'
    }
  ];

  // --- Задачи ---
  var tasks = [
    {
      id: 'task_1',
      client_id: 'c1',
      name: 'Блог 220Volt — Сонячні станції',
      system_prompt: 'Ты — опытный SEO-копирайтер для интернет-магазина электроники 220Volt. Тон: экспертный, дружелюбный, без воды.',
      user_prompt: 'Напиши SEO-статью.\n\nURL страницы: {{url}}\nЯзык: {{language}}\nТема / H1: {{topic}}\nОсновные ключевые слова: {{keywords}}\nОбъём: {{volume}} збп\n\nСтруктура статьи (H2):\n{{h2_structure}}\n\nОбязательные ссылки:\n{{links}}\n\n{{company_block}}\n\n{{notes}}',
      template_id: 'tt_1',
      core_fields: { url: true, keywords: true, topic: true, language: true, volume: true },
      flex_blocks: [
        { key: 'h2_structure', label: 'Структура H2', type: 'repeatable', enabled: true },
        { key: 'links', label: 'Обов\'язкові посилання', type: 'repeatable', enabled: true },
        { key: 'company_block', label: 'Блок про компанію', type: 'textarea', enabled: true },
        { key: 'notes', label: 'Примітки редактору / SEO', type: 'textarea', enabled: true }
      ],
      active_flex_blocks: ['h2_structure', 'links', 'company_block', 'notes'],
      field_values: {
        url: 'https://220volt.com.ua/solnechnaya-energetika/solnechnye-stancii/',
        keywords: 'солнечные станции; солнечная электростанция для дома; как выбрать солнечную станцию',
        topic: 'Солнечные станции: как выбрать решение для дома, бизнеса и резервного электро',
        language: 'RU',
        volume: '2000-2300',
        h2_structure: ['Что такое солнечная станция', 'Как выбрать систему под задачу', 'Где заказать решение под ключ'],
        links: ['https://220volt.com.ua/solnechnaya-energetika/solnechnye-stancii/', 'https://220volt.com.ua/information/uslugi/', 'https://220volt.com.ua/contact/o-nas/'],
        company_block: 'Короткий блок 2-3 речення: 220Volt / Комел-Електро - українська компанія з 1996 року; спеціалізується на рішеннях для електроживлення, продажі обладнання, монтажі та сервісі.',
        notes: 'Посилання ставити в 1/3 тексту, без переспаму; ключі розподіляти природно; 1 H1, 5-6 коротких H2; абзаци до 5-6 рядків; 1-2 списки; конкретика без води.'
      },
      llm_provider: 'anthropic', llm_model: 'Claude Sonnet',
      options: { humanize: true, uniqueness: true, factcheck: false, ai_detector: true },
      status: 'active',
      created_at: '2026-03-19T10:00:00'
    },
    {
      id: 'task_2',
      client_id: 'c1',
      name: 'Карточки товаров — Ноутбуки',
      system_prompt: 'Ты — копирайтер для интернет-магазина 220Volt. Создаёшь продающие описания ноутбуков.',
      user_prompt: 'Напиши описание товара.\n\nURL: {{url}}\nНазвание: {{topic}}\nКлючевые слова: {{keywords}}\nОбъём: {{volume}} збп\n\n{{notes}}',
      template_id: 'tt_2',
      core_fields: { url: true, keywords: true, topic: true, language: false, volume: true },
      flex_blocks: [{ key: 'notes', label: 'Примітки', type: 'textarea', enabled: false }],
      active_flex_blocks: [],
      field_values: {
        url: '/laptops/macbook-air-m4',
        keywords: 'macbook air m4 купить, macbook air цена',
        topic: 'MacBook Air M4',
        volume: '1500-2000'
      },
      llm_provider: 'openai', llm_model: 'ChatGPT (GPT-4o)',
      options: { humanize: false, uniqueness: true, factcheck: false, ai_detector: true },
      status: 'active',
      created_at: '2026-03-20T14:00:00'
    }
  ];

  // --- Сгенерированные тексты ---
  var generated_texts = [
    {
      id: 'gt_1',
      task_id: 'task_1',
      user_input: '',
      used_system_prompt: 'Ты — опытный SEO-копирайтер для интернет-магазина электроники 220Volt.',
      used_user_prompt: 'Напиши SEO-статью...',
      used_llm_model: 'Claude Sonnet',
      used_field_values: {
        url: 'https://220volt.com.ua/solnechnaya-energetika/solnechnye-stancii/',
        keywords: 'солнечные станции; солнечная электростанция для дома',
        topic: 'Солнечные станции: как выбрать решение для дома',
        language: 'RU',
        volume: '2000-2300'
      },
      content: '<h1>Солнечные станции: как выбрать решение для дома</h1>\n<p>Солнечная энергетика становится всё более доступной для частных домовладельцев. Рассмотрим, как правильно выбрать солнечную станцию.</p>\n<h2>Что такое солнечная станция</h2>\n<p>Солнечная электростанция — это комплекс оборудования для преобразования солнечной энергии в электрическую. Основные компоненты: панели, инвертор, аккумуляторы.</p>\n<h2>Как выбрать систему под задачу</h2>\n<p>Выбор зависит от потребностей: для резервного питания достаточно 5 кВт, для полной автономии — от 10 кВт. Учитывайте площадь крыши и бюджет.</p>\n<h2>Где заказать решение под ключ</h2>\n<p>220Volt / Комел-Электро — украинская компания с 1996 года, специализирующаяся на решениях для электроснабжения. Подбор, монтаж и сервис.</p>',
      blocks: [
        { id: 'b1', type: 'heading', tag: 'h1', content: 'Солнечные станции: как выбрать решение для дома' },
        { id: 'b2', type: 'paragraph', tag: 'p', content: 'Солнечная энергетика становится всё более доступной для частных домовладельцев. Рассмотрим, как правильно выбрать солнечную станцию.' },
        { id: 'b3', type: 'heading', tag: 'h2', content: 'Что такое солнечная станция' },
        { id: 'b4', type: 'paragraph', tag: 'p', content: 'Солнечная электростанция — это комплекс оборудования для преобразования солнечной энергии в электрическую. Основные компоненты: панели, инвертор, аккумуляторы.' },
        { id: 'b5', type: 'heading', tag: 'h2', content: 'Как выбрать систему под задачу' },
        { id: 'b6', type: 'paragraph', tag: 'p', content: 'Выбор зависит от потребностей: для резервного питания достаточно 5 кВт, для полной автономии — от 10 кВт. Учитывайте площадь крыши и бюджет.' },
        { id: 'b7', type: 'heading', tag: 'h2', content: 'Где заказать решение под ключ' },
        { id: 'b8', type: 'paragraph', tag: 'p', content: '220Volt / Комел-Электро — украинская компания с 1996 года, специализирующаяся на решениях для электроснабжения. Подбор, монтаж и сервис.' }
      ],
      status: 'completed',
      uniqueness_score: 94, ai_score: 12,
      regeneration_count: 0, comment: '',
      created_at: '2026-03-19T10:05:00'
    }
  ];

  // Сохранение
  props.setProperty('clients', JSON.stringify(clients));
  props.setProperty('tasks', JSON.stringify(tasks));
  props.setProperty('task_templates', JSON.stringify(taskTemplates));
  props.setProperty('generated_texts', JSON.stringify(generated_texts));

  // Очистить устаревшие данные
  props.deleteProperty('prompt_templates');
  props.deleteProperty('template_versions');
  props.deleteProperty('projects');
  props.deleteProperty('generations');

  return 'Демо-данные загружены';
}

function resetData() {
  var props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();
  return 'Данные сброшены';
}
