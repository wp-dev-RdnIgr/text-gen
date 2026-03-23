// ===========================================
// Seed.gs - Заполнение начальными данными
// ===========================================

function seedData() {
  var props = PropertiesService.getScriptProperties();

  // --- Клиенты ---
  var clients = [
    {
      id: 'c1',
      name: '220.ua',
      website: 'https://220.ua',
      niche: 'Электроника и бытовая техника',
      contacts: 'Иван Петров, ivan@220.ua',
      tov_default: 'Экспертный, дружелюбный, без воды',
      notes: ''
    },
    {
      id: 'c2',
      name: 'Technolex',
      website: 'https://technolex.com.ua',
      niche: 'Юридические услуги',
      contacts: 'Марина Сидорова, marina@technolex.com.ua',
      tov_default: 'Профессиональный, строгий, доверительный',
      notes: 'Важно: юридическая точность формулировок'
    },
    {
      id: 'c3',
      name: 'MedService',
      website: 'https://medservice.ua',
      niche: 'Медицинские услуги',
      contacts: 'Алексей Коваль, alex@medservice.ua',
      tov_default: 'Заботливый, профессиональный, понятный',
      notes: 'Не давать медицинских рекомендаций'
    },
    {
      id: 'c4',
      name: 'AutoParts',
      website: 'https://autoparts.ua',
      niche: 'Автозапчасти и аксессуары',
      contacts: 'Дмитрий Бондаренко, dmitry@autoparts.ua',
      tov_default: 'Технический, практичный, конкретный',
      notes: ''
    }
  ];

  // --- Задачи (Tasks) ---
  var tasks = [
    {
      id: 'task_1',
      client_id: 'c1',
      name: 'Блог 220.ua — Партия март',
      columns: [
        { key: 'url', label: 'URL', type: 'short' },
        { key: 'keywords', label: 'Ключевые слова', type: 'short' },
        { key: 'topic', label: 'Тема', type: 'short' },
        { key: 'brief', label: 'ТЗ', type: 'long' }
      ],
      rows: [
        { url: '/blog/best-laptops-2026', keywords: 'лучшие ноутбуки 2026, рейтинг ноутбуков', topic: 'Лучшие ноутбуки 2026 года', brief: 'Обзорная статья, 3000-4000 знаков. Топ-10 моделей по категориям.' },
        { url: '/blog/how-to-choose-tv', keywords: 'как выбрать телевизор, выбор телевизора', topic: 'Как выбрать телевизор в 2026 году', brief: 'Гайд для покупателей, 2500-3500 знаков. Критерии выбора, сравнение технологий.' },
        { url: '/blog/smart-home-start', keywords: 'умный дом, smart home начало', topic: 'Умный дом: с чего начать', brief: 'Статья для новичков, 2000-3000 знаков.' }
      ],
      template_id: 't1',
      template_version_id: null,
      llm_provider: 'anthropic',
      llm_model: 'Claude Sonnet',
      options: { humanize: true, uniqueness: true, factcheck: false, ai_detector: false },
      drive_folder: '',
      status: 'completed',
      total_texts: 3,
      completed_texts: 3,
      failed_texts: 0,
      created_at: '2026-03-19T10:00:00',
      started_at: '2026-03-19T10:01:00',
      completed_at: '2026-03-19T10:15:00'
    },
    {
      id: 'task_2',
      client_id: 'c1',
      name: 'Карточки товаров — Ноутбуки',
      columns: [
        { key: 'url', label: 'URL', type: 'short' },
        { key: 'product_name', label: 'Название товара', type: 'short' },
        { key: 'specs', label: 'Характеристики', type: 'long' },
        { key: 'keywords', label: 'Ключевые слова', type: 'short' },
        { key: 'competitor_desc', label: 'Описание конкурента', type: 'long' }
      ],
      rows: [
        { url: '/laptops/macbook-air-m4', product_name: 'MacBook Air M4', specs: 'Процессор: Apple M4, 16GB RAM, 512GB SSD, 13.6" Liquid Retina', keywords: 'macbook air m4 купить, macbook air цена', competitor_desc: '' },
        { url: '/laptops/dell-xps-15', product_name: 'Dell XPS 15', specs: 'Intel Core Ultra 7, 32GB RAM, 1TB SSD, 15.6" OLED', keywords: 'dell xps 15 купить украина', competitor_desc: '' }
      ],
      template_id: 't3',
      template_version_id: null,
      llm_provider: 'openai',
      llm_model: 'ChatGPT (GPT-4o)',
      options: { humanize: false, uniqueness: true, factcheck: false, ai_detector: true },
      drive_folder: '',
      status: 'draft',
      total_texts: 0,
      completed_texts: 0,
      failed_texts: 0,
      created_at: '2026-03-20T14:00:00',
      started_at: null,
      completed_at: null
    },
    {
      id: 'task_3',
      client_id: 'c2',
      name: 'Блог Technolex — Юридические статьи',
      columns: [
        { key: 'url', label: 'URL', type: 'short' },
        { key: 'keywords', label: 'Ключевые слова', type: 'short' },
        { key: 'topic', label: 'Тема', type: 'short' },
        { key: 'legal_refs', label: 'Ссылки на законы', type: 'long' },
        { key: 'brief', label: 'ТЗ', type: 'long' }
      ],
      rows: [
        { url: '/blog/register-llc-2026', keywords: 'регистрация ООО 2026, открыть ООО', topic: 'Регистрация ООО в 2026 году: пошаговая инструкция', legal_refs: 'Закон Украины "О государственной регистрации юридических лиц"', brief: '4000-5000 знаков. Пошаговая инструкция с актуальными ценами и сроками.' },
        { url: '/blog/labor-disputes', keywords: 'трудовые споры, увольнение сотрудника', topic: 'Трудовые споры: права работодателя', legal_refs: 'КЗоТ Украины, ст. 36, 40, 41', brief: '4000-6000 знаков. Для предпринимателей. Практические кейсы.' }
      ],
      template_id: 't1',
      template_version_id: null,
      llm_provider: 'anthropic',
      llm_model: 'Claude Sonnet',
      options: { humanize: true, uniqueness: true, factcheck: true, ai_detector: false },
      drive_folder: '',
      status: 'completed',
      total_texts: 2,
      completed_texts: 2,
      failed_texts: 0,
      created_at: '2026-03-18T09:00:00',
      started_at: '2026-03-18T09:05:00',
      completed_at: '2026-03-18T09:20:00'
    },
    {
      id: 'task_4',
      client_id: 'c3',
      name: 'Описание услуг клиники',
      columns: [
        { key: 'url', label: 'URL', type: 'short' },
        { key: 'service_name', label: 'Услуга', type: 'short' },
        { key: 'keywords', label: 'Ключевые слова', type: 'short' },
        { key: 'brief', label: 'ТЗ', type: 'long' }
      ],
      rows: [
        { url: '/services/ultrasound', service_name: 'УЗИ-диагностика', keywords: 'узи киев, узи диагностика цена', brief: '2000-3000 знаков. Виды УЗИ, подготовка, цены.' },
        { url: '/services/therapy', service_name: 'Консультация терапевта', keywords: 'терапевт киев, прием терапевта', brief: '1500-2000 знаков.' },
        { url: '/services/cardiology', service_name: 'Кардиология', keywords: 'кардиолог киев, проверка сердца', brief: '2500-3500 знаков. Обследования, симптомы, когда обращаться.' }
      ],
      template_id: 't4',
      template_version_id: null,
      llm_provider: 'anthropic',
      llm_model: 'Claude Sonnet',
      options: { humanize: true, uniqueness: true, factcheck: true, ai_detector: true },
      drive_folder: '',
      status: 'running',
      total_texts: 3,
      completed_texts: 1,
      failed_texts: 0,
      created_at: '2026-03-22T11:00:00',
      started_at: '2026-03-22T11:05:00',
      completed_at: null
    },
    {
      id: 'task_5',
      client_id: 'c4',
      name: 'Категории AutoParts',
      columns: [
        { key: 'url', label: 'URL', type: 'short' },
        { key: 'category_name', label: 'Категория', type: 'short' },
        { key: 'keywords', label: 'Ключи', type: 'short' },
        { key: 'brands', label: 'Бренды', type: 'short' },
        { key: 'brief', label: 'ТЗ', type: 'long' }
      ],
      rows: [
        { url: '/catalog/brake-pads', category_name: 'Тормозные колодки', keywords: 'тормозные колодки купить, колодки авто', brands: 'Brembo, TRW, ATE, Ferodo', brief: '2000-2500 знаков. Как выбрать, виды, совместимость.' },
        { url: '/catalog/oil-filters', category_name: 'Масляные фильтры', keywords: 'масляный фильтр купить', brands: 'Mann, Bosch, Mahle', brief: '1500-2000 знаков.' }
      ],
      template_id: 't2',
      template_version_id: null,
      llm_provider: 'openai',
      llm_model: 'ChatGPT (GPT-4o-mini)',
      options: { humanize: false, uniqueness: true, factcheck: false, ai_detector: false },
      drive_folder: '',
      status: 'failed',
      total_texts: 2,
      completed_texts: 1,
      failed_texts: 1,
      created_at: '2026-03-17T16:00:00',
      started_at: '2026-03-17T16:05:00',
      completed_at: '2026-03-17T16:12:00'
    }
  ];

  // --- Шаблоны промтов ---
  var templates = [
    {
      id: 't1',
      name: 'Статья для блога',
      category: 'blog',
      system_prompt: 'Ты - опытный SEO-копирайтер с 10-летним стажем. Пишешь экспертные статьи для блогов. Твои тексты информативные, структурированные, оптимизированные под поисковые системы.',
      user_prompt: 'Напиши статью на тему: {{topic}}\n\nURL страницы: {{url}}\nОсновные ключевые слова: {{keywords}}\nДополнительное ТЗ: {{brief}}\n\nТребования:\n- Уникальность не менее 90%\n- Структура: H1 (1 шт), H2 (3-5 шт)\n- Абзацы по 2-4 предложения\n- Естественное вхождение ключей',
      version: 3,
      usage_count: 142,
      avg_uniqueness: 93
    },
    {
      id: 't2',
      name: 'Категория с фильтром',
      category: 'category',
      system_prompt: 'Ты - SEO-специалист, создающий тексты для страниц категорий интернет-магазинов.',
      user_prompt: 'Напиши SEO-текст для страницы категории.\n\nURL: {{url}}\nКлючевые слова: {{keywords}}\nКатегория: {{category_name}}\nБренды: {{brands}}\nДополнительное ТЗ: {{brief}}\n\nСтруктура:\n1. H1 с основным ключом\n2. Описание категории\n3. Как выбрать (советы)\n4. FAQ (3-5 вопросов)',
      version: 2,
      usage_count: 45,
      avg_uniqueness: 95
    },
    {
      id: 't3',
      name: 'Карточка товара',
      category: 'product_card',
      system_prompt: 'Ты - копирайтер для интернет-магазинов. Создаешь продающие описания товаров.',
      user_prompt: 'Напиши описание для карточки товара.\n\nURL: {{url}}\nТовар: {{product_name}}\nХарактеристики: {{specs}}\nКлючевые слова: {{keywords}}\n\nСтруктура:\n1. Краткое описание\n2. Характеристики (список)\n3. Преимущества (3-5)\n4. Для кого подходит',
      version: 1,
      usage_count: 320,
      avg_uniqueness: 88
    },
    {
      id: 't4',
      name: 'Описание услуги',
      category: 'service',
      system_prompt: 'Ты - копирайтер для сервисных компаний. Создаешь убедительные описания услуг.',
      user_prompt: 'Напиши описание услуги для сайта.\n\nURL: {{url}}\nУслуга: {{service_name}}\nКлючевые слова: {{keywords}}\nДополнительное ТЗ: {{brief}}\n\nСтруктура:\n1. Что это за услуга (H1 + описание)\n2. Что включает (список)\n3. Процесс работы\n4. FAQ (3-4 вопроса)',
      version: 1,
      usage_count: 59,
      avg_uniqueness: 94
    },
    {
      id: 't5',
      name: 'Лендинг',
      category: 'custom',
      system_prompt: 'Ты - копирайтер-маркетолог. Создаешь тексты для лендингов с высокой конверсией.',
      user_prompt: 'Напиши текст для лендинга.\n\nURL: {{url}}\nКлючевые слова: {{keywords}}\nТема/продукт: {{topic}}\nДополнительное ТЗ: {{brief}}\n\nСтруктура:\n1. Заголовок + подзаголовок\n2. Проблема (боли ЦА)\n3. Решение\n4. Преимущества\n5. CTA',
      version: 1,
      usage_count: 12,
      avg_uniqueness: 96
    },
    {
      id: 't6',
      name: 'Гуманизатор',
      category: 'system_humanizer',
      system_prompt: 'Ты - редактор текстов. Твоя задача - сделать AI-текст более естественным и человечным.',
      user_prompt: 'Перепиши следующий текст, сделав его более естественным. Сохрани структуру и ключевые слова.\n\nТекст:\n{{text}}',
      version: 1,
      usage_count: 298,
      avg_uniqueness: 91
    }
  ];

  // --- История версий шаблонов ---
  var template_versions = [
    {
      id: 'tv_t1_v1',
      template_id: 't1',
      version: 1,
      name: 'Статья для блога',
      category: 'blog',
      system_prompt: 'Ты - SEO-копирайтер. Пишешь статьи для блогов.',
      user_prompt: 'Напиши статью на тему: {{topic}}\n\nURL: {{url}}\nКлючевые слова: {{keywords}}',
      usage_count: 32,
      avg_uniqueness: 87,
      saved_at: '2026-01-15T10:00:00'
    },
    {
      id: 'tv_t1_v2',
      template_id: 't1',
      version: 2,
      name: 'Статья для блога',
      category: 'blog',
      system_prompt: 'Ты - опытный SEO-копирайтер. Пишешь статьи для блогов интернет-магазинов.',
      user_prompt: 'Напиши статью на тему: {{topic}}\n\nURL: {{url}}\nКлючевые слова: {{keywords}}\nТЗ: {{brief}}\n\nТребования:\n- Уникальность не менее 90%\n- H1 + H2 (3-5 шт)',
      usage_count: 78,
      avg_uniqueness: 91,
      saved_at: '2026-02-20T14:30:00'
    }
  ];

  // --- Сгенерированные тексты ---
  var generated_texts = [
    {
      id: 'gt1',
      task_id: 'task_1',
      row_number: 1,
      source_data: { url: '/blog/best-laptops-2026', keywords: 'лучшие ноутбуки 2026', topic: 'Лучшие ноутбуки 2026 года', brief: 'Обзорная статья' },
      status: 'completed',
      content: '<h1>Лучшие ноутбуки 2026 года</h1>\n<p>Рынок ноутбуков в 2026 году предлагает множество интересных моделей...</p>',
      uniqueness_score: 94,
      ai_score: 12,
      gdoc_url: '#doc-gt1',
      error_message: null,
      comment: '',
      regeneration_count: 0
    },
    {
      id: 'gt2',
      task_id: 'task_1',
      row_number: 2,
      source_data: { url: '/blog/how-to-choose-tv', keywords: 'как выбрать телевизор', topic: 'Как выбрать телевизор', brief: 'Гайд' },
      status: 'completed',
      content: '<h1>Как выбрать телевизор в 2026 году</h1>\n<p>Выбор телевизора — задача, к которой стоит подойти внимательно...</p>',
      uniqueness_score: 91,
      ai_score: 18,
      gdoc_url: '#doc-gt2',
      error_message: null,
      comment: '',
      regeneration_count: 0
    },
    {
      id: 'gt3',
      task_id: 'task_1',
      row_number: 3,
      source_data: { url: '/blog/smart-home-start', keywords: 'умный дом', topic: 'Умный дом: с чего начать', brief: '' },
      status: 'completed',
      content: '<h1>Умный дом: с чего начать</h1>\n<p>Технологии умного дома стали доступнее и проще в настройке...</p>',
      uniqueness_score: 93,
      ai_score: 15,
      gdoc_url: '#doc-gt3',
      error_message: null,
      comment: 'Добавить раздел про безопасность',
      regeneration_count: 1
    }
  ];

  // Сохранение
  props.setProperty('clients', JSON.stringify(clients));
  props.setProperty('tasks', JSON.stringify(tasks));
  props.setProperty('prompt_templates', JSON.stringify(templates));
  props.setProperty('template_versions', JSON.stringify(template_versions));
  props.setProperty('generated_texts', JSON.stringify(generated_texts));

  return 'Демо-данные загружены';
}

function resetData() {
  var props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();
  return 'Данные сброшены';
}
