// ===========================================
// Seed.gs - Заполнение начальными данными
// ===========================================

/**
 * Заполняет PropertiesService демо-данными
 * Запускается один раз вручную
 */
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

  // --- Проекты ---
  var projects = [
    {
      id: 'p1',
      client_id: 'c1',
      name: 'Блог 220.ua',
      content_type: 'blog',
      tov: 'Экспертный, дружелюбный. Обращение на "вы".',
      requirements: '3000-5000 знаков. Структура: H1, 3-5 H2, абзацы по 2-4 предложения.',
      context: '220.ua - крупнейший интернет-магазин электроники в Украине. ЦА: 25-45 лет, мужчины и женщины, средний доход.',
      target_audience: '25-45 лет, покупатели электроники',
      forbidden_words: 'дешевый, китайский, бюджетный',
      min_uniqueness: 90,
      texts_count: 142,
      avg_uniqueness: 93
    },
    {
      id: 'p2',
      client_id: 'c1',
      name: 'Карточки товаров',
      content_type: 'product_card',
      tov: 'Информативный, лаконичный.',
      requirements: '1000-2000 знаков. Характеристики + описание + преимущества.',
      context: '220.ua - интернет-магазин электроники. Карточки для каталога товаров.',
      target_audience: 'Покупатели, сравнивающие товары',
      forbidden_words: 'дешевый, китайский',
      min_uniqueness: 85,
      texts_count: 320,
      avg_uniqueness: 88
    },
    {
      id: 'p3',
      client_id: 'c1',
      name: 'Категории каталога',
      content_type: 'category',
      tov: 'SEO-оптимизированный, информативный.',
      requirements: '2000-3000 знаков. H1 с ключом, описание категории, FAQ блок.',
      context: '220.ua - каталог электроники. Тексты для страниц категорий.',
      target_audience: 'Покупатели электроники',
      forbidden_words: 'дешевый',
      min_uniqueness: 92,
      texts_count: 45,
      avg_uniqueness: 95
    },
    {
      id: 'p4',
      client_id: 'c2',
      name: 'Блог Technolex',
      content_type: 'blog',
      tov: 'Профессиональный, юридически корректный.',
      requirements: '4000-6000 знаков. Ссылки на законодательство обязательны.',
      context: 'Technolex - юридическая компания. Блог для привлечения клиентов через SEO.',
      target_audience: 'Предприниматели, физлица с юридическими вопросами',
      forbidden_words: 'бесплатно, гарантируем результат',
      min_uniqueness: 95,
      texts_count: 67,
      avg_uniqueness: 96
    },
    {
      id: 'p5',
      client_id: 'c2',
      name: 'Страницы услуг',
      content_type: 'service',
      tov: 'Доверительный, профессиональный.',
      requirements: '2000-4000 знаков. Описание услуги + процесс + стоимость + FAQ.',
      context: 'Technolex - юридические услуги для бизнеса и частных лиц.',
      target_audience: 'Потенциальные клиенты юридической компании',
      forbidden_words: 'дешево, быстро',
      min_uniqueness: 93,
      texts_count: 24,
      avg_uniqueness: 94
    },
    {
      id: 'p6',
      client_id: 'c3',
      name: 'Блог MedService',
      content_type: 'blog',
      tov: 'Заботливый, доступный, медицински грамотный.',
      requirements: '3000-5000 знаков. Ссылки на источники. Дисклеймер в конце.',
      context: 'MedService - сеть медицинских клиник. Блог для SEO и доверия.',
      target_audience: 'Пациенты 30-60 лет',
      forbidden_words: 'вылечим, гарантируем, народная медицина',
      min_uniqueness: 95,
      texts_count: 89,
      avg_uniqueness: 94
    },
    {
      id: 'p7',
      client_id: 'c3',
      name: 'Описание услуг клиники',
      content_type: 'service',
      tov: 'Профессиональный, понятный.',
      requirements: '2000-3000 знаков. Что включает + показания + подготовка + FAQ.',
      context: 'MedService - описание медицинских услуг для сайта.',
      target_audience: 'Пациенты, ищущие информацию об услугах',
      forbidden_words: 'больно, опасно',
      min_uniqueness: 92,
      texts_count: 35,
      avg_uniqueness: 93
    },
    {
      id: 'p8',
      client_id: 'c4',
      name: 'Категории AutoParts',
      content_type: 'category',
      tov: 'Технический, экспертный.',
      requirements: '1500-2500 знаков. Описание категории + особенности выбора + бренды.',
      context: 'AutoParts - интернет-магазин автозапчастей. Тексты для категорий каталога.',
      target_audience: 'Автовладельцы 25-55 лет',
      forbidden_words: 'дешевый, подделка',
      min_uniqueness: 90,
      texts_count: 78,
      avg_uniqueness: 91
    },
    {
      id: 'p9',
      client_id: 'c4',
      name: 'Карточки запчастей',
      content_type: 'product_card',
      tov: 'Технический, конкретный.',
      requirements: '800-1500 знаков. Совместимость + характеристики + установка.',
      context: 'AutoParts - карточки товаров для каталога запчастей.',
      target_audience: 'Автомеханики и владельцы авто',
      forbidden_words: 'дешевый',
      min_uniqueness: 85,
      texts_count: 210,
      avg_uniqueness: 87
    },
    {
      id: 'p10',
      client_id: 'c4',
      name: 'Блог AutoParts',
      content_type: 'blog',
      tov: 'Практичный, полезный, для автолюбителей.',
      requirements: '3000-5000 знаков. Практические советы, инструкции.',
      context: 'AutoParts - блог об обслуживании автомобилей.',
      target_audience: 'Автовладельцы',
      forbidden_words: 'дешевый, своими руками без опыта',
      min_uniqueness: 90,
      texts_count: 56,
      avg_uniqueness: 92
    }
  ];

  // --- Шаблоны промтов ---
  var templates = [
    {
      id: 't1',
      name: 'Статья для блога',
      category: 'blog',
      system_prompt: 'Ты - опытный SEO-копирайтер с 10-летним стажем. Пишешь экспертные статьи для блогов интернет-магазинов и сервисных компаний. Твои тексты информативные, структурированные, оптимизированные под поисковые системы. Используешь подзаголовки H2-H3, маркированные списки, короткие абзацы. Никогда не используешь воду и канцеляризмы.',
      user_prompt: 'Напиши статью на тему: {тема}\n\nURL страницы: {url}\nОсновные ключевые слова: {ключи}\nДополнительное ТЗ: {тз}\n\nТребования:\n- Уникальность не менее 90%\n- Структура: H1 (1 шт), H2 (3-5 шт), H3 по необходимости\n- Абзацы по 2-4 предложения\n- Естественное вхождение ключей',
      variables: ['url', 'ключи', 'тема', 'тз'],
      version: 3,
      usage_count: 142,
      avg_uniqueness: 93
    },
    {
      id: 't2',
      name: 'Категория с фильтром',
      category: 'category',
      system_prompt: 'Ты - SEO-специалист, создающий тексты для страниц категорий интернет-магазинов. Тексты должны быть полезны покупателям и оптимизированы для поисковых систем. Включай описание категории, советы по выбору и ответы на частые вопросы.',
      user_prompt: 'Напиши SEO-текст для страницы категории.\n\nURL: {url}\nКлючевые слова: {ключи}\nКатегория: {тема}\nДополнительное ТЗ: {тз}\n\nСтруктура:\n1. H1 с основным ключом\n2. Вводное описание категории (2-3 абзаца)\n3. Как выбрать (H2 + советы)\n4. FAQ блок (3-5 вопросов)',
      variables: ['url', 'ключи', 'тема', 'тз'],
      version: 2,
      usage_count: 45,
      avg_uniqueness: 95
    },
    {
      id: 't3',
      name: 'Карточка товара',
      category: 'product_card',
      system_prompt: 'Ты - копирайтер для интернет-магазинов. Создаешь продающие описания товаров. Текст должен быть информативным, содержать ключевые характеристики и преимущества товара. Стиль - лаконичный и конкретный.',
      user_prompt: 'Напиши описание для карточки товара.\n\nURL: {url}\nКлючевые слова: {ключи}\nТовар: {тема}\nДополнительное ТЗ: {тз}\n\nСтруктура:\n1. Краткое описание (2-3 предложения)\n2. Основные характеристики (список)\n3. Преимущества (3-5 пунктов)\n4. Для кого подходит',
      variables: ['url', 'ключи', 'тема', 'тз'],
      version: 1,
      usage_count: 320,
      avg_uniqueness: 88
    },
    {
      id: 't4',
      name: 'Описание услуги',
      category: 'service',
      system_prompt: 'Ты - копирайтер для сервисных компаний. Создаешь убедительные описания услуг. Текст должен объяснять суть услуги, процесс, результат и вызывать доверие. Используй факты и конкретику вместо общих фраз.',
      user_prompt: 'Напиши описание услуги для сайта.\n\nURL: {url}\nКлючевые слова: {ключи}\nУслуга: {тема}\nДополнительное ТЗ: {тз}\n\nСтруктура:\n1. Что это за услуга (H1 + описание)\n2. Что включает (список)\n3. Процесс работы (этапы)\n4. Стоимость и сроки\n5. FAQ (3-4 вопроса)',
      variables: ['url', 'ключи', 'тема', 'тз'],
      version: 1,
      usage_count: 59,
      avg_uniqueness: 94
    },
    {
      id: 't5',
      name: 'Лендинг',
      category: 'custom',
      system_prompt: 'Ты - копирайтер-маркетолог. Создаешь тексты для лендингов с высокой конверсией. Используешь формулы AIDA и PAS. Текст должен быть убедительным, с четким призывом к действию.',
      user_prompt: 'Напиши текст для лендинга.\n\nURL: {url}\nКлючевые слова: {ключи}\nТема/продукт: {тема}\nДополнительное ТЗ: {тз}\n\nСтруктура:\n1. Заголовок + подзаголовок (цепляющие)\n2. Проблема (боли ЦА)\n3. Решение (продукт/услуга)\n4. Преимущества (3-5)\n5. Социальное доказательство\n6. CTA',
      variables: ['url', 'ключи', 'тема', 'тз'],
      version: 1,
      usage_count: 12,
      avg_uniqueness: 96
    },
    {
      id: 't6',
      name: 'Гуманизатор',
      category: 'system_humanizer',
      system_prompt: 'Ты - редактор текстов. Твоя задача - сделать текст, написанный AI, более естественным и человечным. Не меняй смысл и структуру, но убери типичные признаки AI-текста: избыточные вводные, шаблонные переходы, однообразную длину предложений. Добавь разговорные элементы, варьируй длину предложений, используй более живые формулировки.',
      user_prompt: 'Перепиши следующий текст, сделав его более естественным и человечным. Сохрани структуру, ключевые слова и смысл.\n\nТекст для обработки:\n{текст}',
      variables: ['текст'],
      version: 1,
      usage_count: 298,
      avg_uniqueness: 91
    }
  ];

  // --- История версий шаблонов ---
  var template_versions = [
    // Статья для блога — 2 предыдущих версии
    {
      id: 'tv_t1_v1',
      template_id: 't1',
      version: 1,
      name: 'Статья для блога',
      category: 'blog',
      system_prompt: 'Ты - SEO-копирайтер. Пишешь статьи для блогов. Текст должен быть информативным и уникальным.',
      user_prompt: 'Напиши статью на тему: {тема}\n\nURL: {url}\nКлючевые слова: {ключи}',
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
      system_prompt: 'Ты - опытный SEO-копирайтер. Пишешь экспертные статьи для блогов. Текст должен быть информативным, структурированным и уникальным. Используешь подзаголовки H2-H3, маркированные списки.',
      user_prompt: 'Напиши статью на тему: {тема}\n\nURL: {url}\nКлючевые слова: {ключи}\nДополнительное ТЗ: {тз}\n\nТребования:\n- Уникальность не менее 90%\n- Структура: H1, H2 (3-5 шт)',
      usage_count: 78,
      avg_uniqueness: 91,
      saved_at: '2026-02-20T14:30:00'
    },
    // Категория с фильтром — 1 предыдущая версия
    {
      id: 'tv_t2_v1',
      template_id: 't2',
      version: 1,
      name: 'Категория с фильтром',
      category: 'category',
      system_prompt: 'Ты - SEO-специалист, создающий тексты для категорий интернет-магазинов. Включай описание категории и советы по выбору.',
      user_prompt: 'Напиши SEO-текст для категории.\n\nURL: {url}\nКлючевые слова: {ключи}\nКатегория: {тема}',
      usage_count: 20,
      avg_uniqueness: 92,
      saved_at: '2026-02-10T09:15:00'
    },
    // Лендинг — 1 предыдущая версия
    {
      id: 'tv_t5_v1',
      template_id: 't5',
      version: 1,
      name: 'Лендинг',
      category: 'custom',
      system_prompt: 'Ты - копирайтер. Создаешь тексты для лендингов. Текст должен быть убедительным.',
      user_prompt: 'Напиши текст для лендинга.\n\nURL: {url}\nТема: {тема}\n\nСтруктура:\n1. Заголовок\n2. Проблема\n3. Решение\n4. CTA',
      usage_count: 5,
      avg_uniqueness: 93,
      saved_at: '2026-03-01T11:00:00'
    }
  ];

  // Update template versions to match (t5 should be v2 since it has history)
  templates[4].version = 2; // Лендинг

  // --- Генерации ---
  var generations = [
    {
      id: 'g1',
      project_id: 'p1',
      template_id: 't1',
      llm_provider: 'anthropic',
      llm_model: 'Claude Sonnet',
      status: 'completed',
      total_texts: 10,
      completed_texts: 10,
      failed_texts: 0,
      options: { humanize: true, check_uniqueness: true, factcheck: false, ai_detector: false },
      created_at: '2026-03-17T10:30:00',
      completed_at: '2026-03-17T11:15:00'
    },
    {
      id: 'g2',
      project_id: 'p1',
      template_id: 't1',
      llm_provider: 'openai',
      llm_model: 'ChatGPT (GPT-4o)',
      status: 'completed',
      total_texts: 8,
      completed_texts: 7,
      failed_texts: 1,
      options: { humanize: true, check_uniqueness: true, factcheck: false, ai_detector: false },
      created_at: '2026-03-18T09:00:00',
      completed_at: '2026-03-18T09:45:00'
    },
    {
      id: 'g3',
      project_id: 'p4',
      template_id: 't1',
      llm_provider: 'anthropic',
      llm_model: 'Claude Sonnet',
      status: 'running',
      total_texts: 5,
      completed_texts: 2,
      failed_texts: 0,
      options: { humanize: true, check_uniqueness: true, factcheck: true, ai_detector: false },
      created_at: '2026-03-19T08:00:00',
      completed_at: null
    },
    {
      id: 'g4',
      project_id: 'p2',
      template_id: 't3',
      llm_provider: 'openai',
      llm_model: 'ChatGPT (GPT-4o-mini)',
      status: 'failed',
      total_texts: 3,
      completed_texts: 1,
      failed_texts: 2,
      options: { humanize: false, check_uniqueness: true, factcheck: false, ai_detector: false },
      created_at: '2026-03-18T14:00:00',
      completed_at: '2026-03-18T14:20:00'
    },
    {
      id: 'g5',
      project_id: 'p8',
      template_id: 't2',
      llm_provider: 'perplexity',
      llm_model: 'Perplexity Online',
      status: 'pending',
      total_texts: 4,
      completed_texts: 0,
      failed_texts: 0,
      options: { humanize: true, check_uniqueness: true, factcheck: false, ai_detector: true },
      created_at: '2026-03-19T12:00:00',
      completed_at: null
    }
  ];

  // --- Сгенерированные тексты ---
  var generated_texts = [];
  var topics_g1 = [
    'Как выбрать 4K телевизор в 2026 году',
    'ТОП-10 ноутбуков для работы и учебы',
    'Робот-пылесос vs обычный: что выбрать',
    'Лучшие смартфоны до 15000 грн',
    'Как выбрать стиральную машину',
    'Обзор игровых мониторов 2026',
    'Кондиционер или вентилятор: сравнение',
    'Умный дом: с чего начать',
    'Как выбрать наушники: полный гайд',
    'Лучшие фитнес-браслеты 2026'
  ];

  // Примеры контента для демо
  var sampleContents = [
    '<h1>Как выбрать 4K телевизор в 2026 году</h1>\n\n<h2>Введение</h2>\n<p>Рынок 4K телевизоров в 2026 году предлагает огромный выбор моделей на любой бюджет. В этой статье мы разберем ключевые характеристики, на которые стоит обращать внимание при выборе нового телевизора.</p>\n\n<h2>Размер экрана и разрешение</h2>\n<p>Оптимальный размер экрана зависит от расстояния просмотра. Для гостиной подойдут модели от 55 дюймов. Разрешение 4K (3840x2160) уже стало стандартом, но обратите внимание на поддержку HDR10+ и Dolby Vision.</p>\n\n<h2>Тип матрицы</h2>\n<p>OLED обеспечивает идеальный черный цвет и широкие углы обзора. QLED от Samsung предлагает высокую яркость. Mini-LED — золотая середина между ценой и качеством.</p>\n\n<h2>Заключение</h2>\n<p>При выборе 4K телевизора ориентируйтесь на размер комнаты, бюджет и основные сценарии использования. Не переплачивайте за функции, которые вам не нужны.</p>',
    '<h1>ТОП-10 ноутбуков для работы и учебы</h1>\n\n<h2>Введение</h2>\n<p>Выбор ноутбука для работы и учебы — ответственная задача. Нужно найти баланс между производительностью, автономностью и ценой. Мы составили рейтинг лучших моделей 2026 года.</p>\n\n<h2>На что обратить внимание</h2>\n<p>Процессор — сердце ноутбука. Для офисных задач хватит Intel Core i5 или AMD Ryzen 5. Оперативная память — минимум 16 ГБ. SSD на 512 ГБ обеспечит быструю работу системы.</p>\n\n<h2>Автономность</h2>\n<p>Для мобильной работы важна автономность от 8 часов. Обращайте внимание на реальные тесты, а не заявления производителей. Модели с процессорами Apple M3 и Qualcomm Snapdragon X лидируют по энергоэффективности.</p>\n\n<h2>Заключение</h2>\n<p>Лучший ноутбук — тот, который решает ваши задачи. Не гонитесь за топовыми характеристиками, если ваша работа не требует высокой производительности.</p>'
  ];

  // Тексты для генерации g1 (completed)
  for (var i = 0; i < 10; i++) {
    generated_texts.push({
      id: 'gt1_' + (i + 1),
      generation_id: 'g1',
      row_number: i + 1,
      source_data: {
        url: '220.ua/blog/' + (i + 1),
        keys: topics_g1[i].toLowerCase().replace(/[^a-zа-яе0-9 ]/gi, ''),
        topic: topics_g1[i],
        tz: ''
      },
      status: 'completed',
      uniqueness_score: 88 + Math.floor(Math.random() * 12),
      ai_score: Math.floor(Math.random() * 25 + 5),
      gdoc_url: 'https://docs.google.com/document/d/fake-g1-' + (i + 1),
      error_message: null,
      content: sampleContents[i] || '<h1>' + topics_g1[i] + '</h1>\n\n<h2>Введение</h2>\n<p>В данной статье мы подробно рассмотрим тему «' + topics_g1[i] + '». Эта информация будет полезна для принятия взвешенного решения.</p>\n\n<h2>Основные критерии выбора</h2>\n<p>Современный рынок предлагает множество вариантов. Важно определиться с приоритетами: бюджет, функциональность, надежность. Рассмотрим каждый аспект подробнее.</p>\n\n<h2>Рекомендации экспертов</h2>\n<p>Специалисты рекомендуют обращать внимание на отзывы реальных пользователей и сравнивать характеристики нескольких моделей перед покупкой.</p>\n\n<h2>Заключение</h2>\n<p>Надеемся, эта статья помогла вам разобраться в вопросе. Делайте выбор осознанно и не переплачивайте за ненужные функции.</p>',
      comment: '',
      regeneration_count: 0
    });
  }

  // Тексты для генерации g2 (completed, 1 failed)
  var topics_g2 = [
    'Как настроить Smart TV',
    'Обзор iPhone 16',
    'Лучшие планшеты для детей',
    'SSD vs HDD: что выбрать',
    'Как выбрать блендер',
    'Обзор экшн-камер 2026',
    'Лучшие электробритвы',
    'Как выбрать микроволновку'
  ];
  for (var i = 0; i < 8; i++) {
    var status = 'completed';
    var score = 87 + Math.floor(Math.random() * 12);
    var error = null;
    var gdoc = 'https://docs.google.com/document/d/fake-g2-' + (i + 1);
    if (i === 5) {
      status = 'failed';
      score = null;
      error = 'API timeout: модель не ответила за 60 сек';
      gdoc = null;
    }
    generated_texts.push({
      id: 'gt2_' + (i + 1),
      generation_id: 'g2',
      row_number: i + 1,
      source_data: {
        url: '220.ua/blog/smart-' + (i + 1),
        keys: topics_g2[i].toLowerCase(),
        topic: topics_g2[i],
        tz: ''
      },
      status: status,
      uniqueness_score: score,
      ai_score: status === 'completed' ? Math.floor(Math.random() * 25 + 5) : null,
      gdoc_url: gdoc,
      error_message: error,
      content: status === 'completed' ? '<h1>' + topics_g2[i] + '</h1>\n\n<h2>Введение</h2>\n<p>Разбираемся в теме «' + topics_g2[i] + '» — на что обратить внимание, какие есть нюансы и как сделать правильный выбор.</p>\n\n<h2>Ключевые моменты</h2>\n<p>Рынок предлагает разнообразные решения. Мы отобрали наиболее важные критерии для сравнения.</p>\n\n<h2>Заключение</h2>\n<p>Используйте наши рекомендации для принятия оптимального решения.</p>' : null,
      comment: '',
      regeneration_count: 0
    });
  }

  // Тексты для генерации g3 (running: 2 completed, 3 pending/generating)
  var topics_g3 = [
    'Как зарегистрировать ФОП в 2026',
    'Налоги для ФОП: полный гайд',
    'Ликвидация ООО: пошаговая инструкция',
    'Трудовой договор: на что обратить внимание',
    'Защита прав потребителя'
  ];
  var g3_statuses = ['completed', 'completed', 'generating', 'pending', 'pending'];
  for (var i = 0; i < 5; i++) {
    generated_texts.push({
      id: 'gt3_' + (i + 1),
      generation_id: 'g3',
      row_number: i + 1,
      source_data: {
        url: 'technolex.com.ua/blog/' + (i + 1),
        keys: topics_g3[i].toLowerCase(),
        topic: topics_g3[i],
        tz: ''
      },
      status: g3_statuses[i],
      uniqueness_score: g3_statuses[i] === 'completed' ? 94 + Math.floor(Math.random() * 5) : null,
      ai_score: g3_statuses[i] === 'completed' ? Math.floor(Math.random() * 20 + 5) : null,
      gdoc_url: g3_statuses[i] === 'completed' ? 'https://docs.google.com/document/d/fake-g3-' + (i + 1) : null,
      error_message: null,
      content: g3_statuses[i] === 'completed' ? '<h1>' + topics_g3[i] + '</h1>\n\n<p>Подробный разбор темы «' + topics_g3[i] + '» с учетом актуального законодательства Украины.</p>\n\n<h2>Основные положения</h2>\n<p>Рассматриваем ключевые правовые аспекты и практические рекомендации для предпринимателей.</p>' : null,
      comment: '',
      regeneration_count: 0
    });
  }

  // Тексты для генерации g4 (failed: 1 completed, 2 failed)
  var topics_g4 = [
    'Чехол для iPhone 16 Pro',
    'Зарядное устройство USB-C 100W',
    'Защитное стекло Samsung Galaxy'
  ];
  var g4_statuses = ['completed', 'failed', 'failed'];
  for (var i = 0; i < 3; i++) {
    generated_texts.push({
      id: 'gt4_' + (i + 1),
      generation_id: 'g4',
      row_number: i + 1,
      source_data: {
        url: '220.ua/product/' + (i + 1),
        keys: topics_g4[i].toLowerCase(),
        topic: topics_g4[i],
        tz: ''
      },
      status: g4_statuses[i],
      uniqueness_score: g4_statuses[i] === 'completed' ? 86 : null,
      ai_score: g4_statuses[i] === 'completed' ? 12 : null,
      gdoc_url: g4_statuses[i] === 'completed' ? 'https://docs.google.com/document/d/fake-g4-1' : null,
      error_message: g4_statuses[i] === 'failed' ? 'Rate limit exceeded' : null,
      content: g4_statuses[i] === 'completed' ? '<h1>' + topics_g4[i] + '</h1>\n\n<p>Описание товара с ключевыми характеристиками и преимуществами.</p>\n\n<h2>Характеристики</h2>\n<p>Высокое качество материалов, совместимость с популярными моделями устройств.</p>' : null,
      comment: '',
      regeneration_count: 0
    });
  }

  // Тексты для генерации g5 (pending: все pending)
  var topics_g5 = [
    'Тормозные колодки: как выбрать',
    'Масляные фильтры: обзор брендов',
    'Аккумуляторы для авто: гайд',
    'Автомобильные шины: зима vs лето'
  ];
  for (var i = 0; i < 4; i++) {
    generated_texts.push({
      id: 'gt5_' + (i + 1),
      generation_id: 'g5',
      row_number: i + 1,
      source_data: {
        url: 'autoparts.ua/category/' + (i + 1),
        keys: topics_g5[i].toLowerCase(),
        topic: topics_g5[i],
        tz: ''
      },
      status: 'pending',
      uniqueness_score: null,
      ai_score: null,
      gdoc_url: null,
      error_message: null,
      content: null,
      comment: '',
      regeneration_count: 0
    });
  }

  // Сохраняем все данные
  props.setProperty('clients', JSON.stringify(clients));
  props.setProperty('projects', JSON.stringify(projects));
  props.setProperty('prompt_templates', JSON.stringify(templates));
  props.setProperty('template_versions', JSON.stringify(template_versions));
  props.setProperty('generations', JSON.stringify(generations));
  props.setProperty('generated_texts', JSON.stringify(generated_texts));

  Logger.log('Демо-данные успешно загружены!');
  Logger.log('Клиентов: ' + clients.length);
  Logger.log('Проектов: ' + projects.length);
  Logger.log('Шаблонов: ' + templates.length);
  Logger.log('Версий шаблонов: ' + template_versions.length);
  Logger.log('Генераций: ' + generations.length);
  Logger.log('Текстов: ' + generated_texts.length);

  return 'Данные загружены: ' + clients.length + ' клиентов, ' + projects.length + ' проектов, ' + templates.length + ' шаблонов, ' + template_versions.length + ' версий, ' + generations.length + ' генераций, ' + generated_texts.length + ' текстов';
}

/**
 * Очищает все данные и заполняет заново
 */
function resetData() {
  var props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();
  return seedData();
}
