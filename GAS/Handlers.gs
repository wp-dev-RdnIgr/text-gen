// ===========================================
// Handlers.gs - Серверные обработчики
// Вызываются через google.script.run
// ===========================================

// --- Клиенты ---

function getClients() {
  try {
    return _getAll('clients');
  } catch (e) {
    throw new Error('Ошибка загрузки клиентов: ' + e.message);
  }
}

function saveClient(clientData) {
  try {
    return _saveItem('clients', clientData, 'c');
  } catch (e) {
    throw new Error('Ошибка сохранения клиента: ' + e.message);
  }
}

function deleteClient(clientId) {
  try {
    var tasks = _filterBy('tasks', 'client_id', clientId);
    tasks.forEach(function(t) {
      deleteTask(t.id);
    });
    return _deleteItem('clients', clientId);
  } catch (e) {
    throw new Error('Ошибка удаления клиента: ' + e.message);
  }
}

// --- Задачи (Tasks) ---

function getTasks(clientId) {
  try {
    if (clientId) {
      return _filterBy('tasks', 'client_id', clientId);
    }
    return _getAll('tasks');
  } catch (e) {
    throw new Error('Ошибка загрузки задач: ' + e.message);
  }
}

function getTask(taskId) {
  try {
    return _findById('tasks', taskId);
  } catch (e) {
    throw new Error('Ошибка загрузки задачи: ' + e.message);
  }
}

function saveTask(taskData) {
  try {
    if (!taskData.status) {
      taskData.status = 'active';
    }
    if (!taskData.created_at) {
      taskData.created_at = new Date().toISOString();
    }
    return _saveItem('tasks', taskData, 'task_');
  } catch (e) {
    throw new Error('Ошибка сохранения задачи: ' + e.message);
  }
}

function deleteTask(taskId) {
  try {
    // Удалить все тексты задачи
    var texts = _getAll('generated_texts');
    texts = texts.filter(function(t) { return t.task_id !== taskId; });
    _saveAll('generated_texts', texts);
    return _deleteItem('tasks', taskId);
  } catch (e) {
    throw new Error('Ошибка удаления задачи: ' + e.message);
  }
}

function updateTask(taskId, updates) {
  try {
    return _updateItem('tasks', taskId, updates);
  } catch (e) {
    throw new Error('Ошибка обновления задачи: ' + e.message);
  }
}

// --- Генерация текста ---

/**
 * Получить API-ключ OpenAI из настроек скрипта.
 * Устанавливается через: setOpenAIKey('sk-...')
 */
function getOpenAIKey() {
  var key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) throw new Error('OpenAI API key не установлен. Выполните setOpenAIKey("sk-...") в редакторе скриптов.');
  return key;
}

/**
 * Установить API-ключ OpenAI (вызвать один раз вручную из редактора скриптов)
 */
function setOpenAIKey(key) {
  PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY', key);
  return 'OpenAI API key установлен';
}

/**
 * Вызов OpenAI API
 */
function callOpenAI(systemPrompt, userPrompt, model) {
  model = model || 'gpt-4o-mini';
  var url = 'https://api.openai.com/v1/chat/completions';

  var payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt || 'Ты — профессиональный SEO-копирайтер.' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + getOpenAIKey()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    var err = '';
    try { err = JSON.parse(body).error.message; } catch(e) { err = body.substring(0, 200); }
    throw new Error('OpenAI API error (' + code + '): ' + err);
  }

  var json = JSON.parse(body);
  return json.choices[0].message.content;
}

/**
 * Парсинг HTML-текста в блоки (серверная версия)
 */
function parseContentToBlocksServer(html) {
  if (!html) return [];
  var blocks = [];
  // Простой парсинг по тегам
  var tagRegex = /<(h[1-3]|p|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  var match;
  var idx = 0;
  while ((match = tagRegex.exec(html)) !== null) {
    var tag = match[1].toLowerCase();
    var content = match[2].trim();
    if (!content) continue;
    var type = 'paragraph';
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') type = 'heading';
    if (tag === 'ul' || tag === 'ol') type = 'list';
    blocks.push({
      id: 'b_' + Date.now() + '_' + idx,
      type: type,
      tag: tag,
      content: type === 'list' ? match[0] : content
    });
    idx++;
  }
  // Если парсинг не нашел тегов — разбить по абзацам
  if (blocks.length === 0) {
    var lines = html.split(/\n\n+/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      blocks.push({
        id: 'b_' + Date.now() + '_' + i,
        type: 'paragraph',
        tag: 'p',
        content: line.replace(/<[^>]+>/g, '')
      });
    }
  }
  return blocks;
}

/**
 * Создать запись и сгенерировать текст через OpenAI
 */
function generateTextWithAI(taskId, assembledPrompt, fieldValues) {
  try {
    var task = _findById('tasks', taskId);
    if (!task) throw new Error('Задача не найдена');

    // Вызов OpenAI
    var systemPrompt = task.system_prompt || 'Ты — профессиональный SEO-копирайтер. Пиши структурированные тексты с HTML-тегами (h1, h2, h3, p, ul, li).';
    var fullSystemPrompt = systemPrompt + '\n\nВАЖНО: Форматируй текст используя HTML-теги: <h1>, <h2>, <h3> для заголовков, <p> для абзацев, <ul><li> для списков. Не используй Markdown.';

    var rawContent = callOpenAI(fullSystemPrompt, assembledPrompt, 'gpt-4o-mini');

    // Убедиться что контент в HTML
    if (rawContent.indexOf('<') === -1) {
      // Конвертировать plain text в HTML
      rawContent = rawContent.split(/\n\n+/).map(function(p) {
        p = p.trim();
        if (!p) return '';
        if (p.match(/^#{1,3}\s/)) {
          var level = p.match(/^(#{1,3})\s/)[1].length;
          return '<h' + level + '>' + p.replace(/^#{1,3}\s/, '') + '</h' + level + '>';
        }
        return '<p>' + p + '</p>';
      }).join('\n');
    }

    var blocks = parseContentToBlocksServer(rawContent);

    var text = {
      id: 'gt_' + Date.now(),
      task_id: taskId,
      user_input: assembledPrompt || '',
      used_system_prompt: task.system_prompt || '',
      used_user_prompt: task.user_prompt || '',
      used_llm_model: 'GPT-4o-mini',
      used_field_values: fieldValues || {},
      content: rawContent,
      blocks: blocks,
      status: 'completed',
      error_message: null,
      uniqueness_score: null,
      ai_score: null,
      regeneration_count: 0,
      comment: '',
      created_at: new Date().toISOString()
    };

    var texts = _getAll('generated_texts');
    texts.push(text);
    _saveAll('generated_texts', texts);

    return text;
  } catch (e) {
    // Сохранить запись об ошибке
    var errorText = {
      id: 'gt_' + Date.now(),
      task_id: taskId,
      user_input: assembledPrompt || '',
      used_system_prompt: (task && task.system_prompt) || '',
      used_user_prompt: (task && task.user_prompt) || '',
      used_llm_model: 'GPT-4o-mini',
      used_field_values: fieldValues || {},
      content: '',
      blocks: [],
      status: 'failed',
      error_message: e.message,
      uniqueness_score: null,
      ai_score: null,
      regeneration_count: 0,
      comment: '',
      created_at: new Date().toISOString()
    };
    var texts = _getAll('generated_texts');
    texts.push(errorText);
    _saveAll('generated_texts', texts);

    throw new Error('Помилка генерації: ' + e.message);
  }
}

/**
 * Перегенерация блока через OpenAI
 */
function regenerateBlockWithAI(textId, blockIndex, comment) {
  try {
    var text = _findById('generated_texts', textId);
    if (!text) throw new Error('Текст не найден');
    if (!text.blocks || blockIndex >= text.blocks.length) throw new Error('Блок не найден');

    var block = text.blocks[blockIndex];
    var contextBlocks = text.blocks.map(function(b, i) {
      return (i === blockIndex ? '[ЭТОТ БЛОК НУЖНО ПЕРЕПИСАТЬ]: ' : '') + b.content;
    }).join('\n\n');

    var prompt = 'Перепиши ТОЛЬКО выделенный блок текста.\n\n';
    prompt += 'Полный текст для контекста:\n' + contextBlocks + '\n\n';
    prompt += 'Перепиши блок: "' + block.content + '"\n';
    if (comment) prompt += 'Учти комментарий: ' + comment + '\n';
    prompt += '\nВерни ТОЛЬКО переписанный блок (один абзац или заголовок), без HTML-тегов, без пояснений.';

    var newContent = callOpenAI(text.used_system_prompt || '', prompt, 'gpt-4o-mini');
    newContent = newContent.replace(/<[^>]+>/g, '').trim();

    text.blocks[blockIndex].content = newContent;
    text.content = text.blocks.map(function(b) {
      if (b.type === 'heading') return '<' + b.tag + '>' + b.content + '</' + b.tag + '>';
      if (b.type === 'list') return b.content;
      return '<p>' + b.content + '</p>';
    }).join('\n');
    text.regeneration_count = (text.regeneration_count || 0) + 1;

    return _saveItem('generated_texts', text, 'gt_');
  } catch (e) {
    throw new Error('Помилка регенерації блоку: ' + e.message);
  }
}

/**
 * Полная перегенерация текста через OpenAI
 */
function regenerateFullTextWithAI(textId, comment) {
  try {
    var text = _findById('generated_texts', textId);
    if (!text) throw new Error('Текст не найден');

    var prompt = text.user_input || '';
    if (comment) prompt += '\n\nДодаткові інструкції до перегенерації:\n' + comment;

    var systemPrompt = (text.used_system_prompt || 'Ты — SEO-копирайтер.') +
      '\n\nВАЖНО: Форматируй текст используя HTML-теги: <h1>, <h2>, <h3> для заголовков, <p> для абзацев, <ul><li> для списков.';

    var rawContent = callOpenAI(systemPrompt, prompt, 'gpt-4o-mini');

    if (rawContent.indexOf('<') === -1) {
      rawContent = rawContent.split(/\n\n+/).map(function(p) {
        p = p.trim();
        if (!p) return '';
        if (p.match(/^#{1,3}\s/)) {
          var level = p.match(/^(#{1,3})\s/)[1].length;
          return '<h' + level + '>' + p.replace(/^#{1,3}\s/, '') + '</h' + level + '>';
        }
        return '<p>' + p + '</p>';
      }).join('\n');
    }

    text.content = rawContent;
    text.blocks = parseContentToBlocksServer(rawContent);
    text.regeneration_count = (text.regeneration_count || 0) + 1;
    if (comment) text.comment = comment;

    return _saveItem('generated_texts', text, 'gt_');
  } catch (e) {
    throw new Error('Помилка перегенерації: ' + e.message);
  }
}

function generateText(taskId, userInput, fieldValues) {
  try {
    var task = _findById('tasks', taskId);
    if (!task) throw new Error('Задача не найдена');

    var text = {
      id: 'gt_' + Date.now(),
      task_id: taskId,
      user_input: userInput || '',
      used_system_prompt: task.system_prompt || '',
      used_user_prompt: task.user_prompt || '',
      used_llm_model: task.llm_model || '',
      used_field_values: fieldValues || {},
      content: '',
      blocks: [],
      status: 'pending',
      error_message: null,
      uniqueness_score: null,
      ai_score: null,
      regeneration_count: 0,
      comment: '',
      created_at: new Date().toISOString()
    };

    var texts = _getAll('generated_texts');
    texts.push(text);
    _saveAll('generated_texts', texts);

    return text;
  } catch (e) {
    throw new Error('Ошибка создания текста: ' + e.message);
  }
}

// --- Тексты ---

function getGeneratedTexts(taskId) {
  try {
    var texts = _filterBy('generated_texts', 'task_id', taskId);
    texts.sort(function(a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return texts;
  } catch (e) {
    throw new Error('Ошибка загрузки текстов: ' + e.message);
  }
}

function getGeneratedText(textId) {
  try {
    return _findById('generated_texts', textId);
  } catch (e) {
    throw new Error('Ошибка загрузки текста: ' + e.message);
  }
}

function updateGeneratedText(textId, updates) {
  try {
    return _updateItem('generated_texts', textId, updates);
  } catch (e) {
    throw new Error('Ошибка обновления текста: ' + e.message);
  }
}

function deleteGeneratedText(textId) {
  try {
    return _deleteItem('generated_texts', textId);
  } catch (e) {
    throw new Error('Ошибка удаления текста: ' + e.message);
  }
}

// --- Обновление блока текста ---

function updateTextBlock(textId, blockIndex, newContent) {
  try {
    var text = _findById('generated_texts', textId);
    if (!text) throw new Error('Текст не найден');
    if (!text.blocks || blockIndex >= text.blocks.length) throw new Error('Блок не найден');

    text.blocks[blockIndex].content = newContent;

    // Пересобрать полный контент из блоков
    text.content = text.blocks.map(function(b) {
      if (b.type === 'heading') return '<' + b.tag + '>' + b.content + '</' + b.tag + '>';
      if (b.type === 'list') return b.content;
      return '<p>' + b.content + '</p>';
    }).join('\n');

    return _saveItem('generated_texts', text, 'gt_');
  } catch (e) {
    throw new Error('Ошибка обновления блока: ' + e.message);
  }
}

// --- Разбивка / объединение блоков ---

function splitTextBlock(textId, blockIndex, splitPosition) {
  try {
    var text = _findById('generated_texts', textId);
    if (!text || !text.blocks || blockIndex >= text.blocks.length) throw new Error('Блок не найден');

    var block = text.blocks[blockIndex];
    var content = block.content;
    var part1 = content.substring(0, splitPosition).trim();
    var part2 = content.substring(splitPosition).trim();

    if (!part1 || !part2) throw new Error('Невозможно разбить — одна из частей пуста');

    var newBlock = { id: 'b_' + Date.now(), type: block.type, tag: block.tag, content: part2 };
    block.content = part1;
    text.blocks.splice(blockIndex + 1, 0, newBlock);

    // Пересобрать контент
    text.content = rebuildContentFromBlocks(text.blocks);
    return _saveItem('generated_texts', text, 'gt_');
  } catch (e) {
    throw new Error('Ошибка разбивки блока: ' + e.message);
  }
}

function mergeTextBlocks(textId, blockIndex) {
  try {
    var text = _findById('generated_texts', textId);
    if (!text || !text.blocks || blockIndex + 1 >= text.blocks.length) throw new Error('Невозможно объединить');

    var block = text.blocks[blockIndex];
    var nextBlock = text.blocks[blockIndex + 1];
    block.content = block.content + ' ' + nextBlock.content;
    text.blocks.splice(blockIndex + 1, 1);

    text.content = rebuildContentFromBlocks(text.blocks);
    return _saveItem('generated_texts', text, 'gt_');
  } catch (e) {
    throw new Error('Ошибка объединения блоков: ' + e.message);
  }
}

function rebuildContentFromBlocks(blocks) {
  return blocks.map(function(b) {
    if (b.type === 'heading') return '<' + b.tag + '>' + b.content + '</' + b.tag + '>';
    if (b.type === 'list') return b.content;
    return '<p>' + b.content + '</p>';
  }).join('\n');
}

// --- Шаблоны задач (Task Templates) ---

function getTaskTemplates() {
  try {
    return _getAll('task_templates');
  } catch (e) {
    throw new Error('Ошибка загрузки шаблонов задач: ' + e.message);
  }
}

function getTaskTemplate(id) {
  try {
    return _findById('task_templates', id);
  } catch (e) {
    throw new Error('Ошибка загрузки шаблона задачи: ' + e.message);
  }
}

function saveTaskTemplate(data) {
  try {
    if (!data.created_at) {
      data.created_at = new Date().toISOString();
    }
    return _saveItem('task_templates', data, 'tt_');
  } catch (e) {
    throw new Error('Ошибка сохранения шаблона задачи: ' + e.message);
  }
}

function deleteTaskTemplate(id) {
  try {
    return _deleteItem('task_templates', id);
  } catch (e) {
    throw new Error('Ошибка удаления шаблона задачи: ' + e.message);
  }
}

// --- Утилиты ---

function getAllDataForDashboard(clientId) {
  try {
    var client = clientId ? _findById('clients', clientId) : null;
    var tasks = clientId ? _filterBy('tasks', 'client_id', clientId) : [];
    return {
      client: client,
      tasks: tasks
    };
  } catch (e) {
    throw new Error('Ошибка загрузки данных дашборда: ' + e.message);
  }
}
