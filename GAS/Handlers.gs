// ===========================================
// Handlers.gs - Серверные обработчики
// Все данные хранятся в PostgreSQL через n8n webhook
// ===========================================

var N8N_SQL_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-sql';

// --- SQL Helper ---
function execSQL(query) {
  var response = UrlFetchApp.fetch(N8N_SQL_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ query: query }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code !== 200 || !text) throw new Error('DB error (' + code + ')');
  return JSON.parse(text);
}

function escSQL(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function jsonSQL(obj) {
  if (!obj) return "'{}'::jsonb";
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

// --- Клиенты ---

function getClients() {
  return execSQL('SELECT * FROM textgen.clients ORDER BY name');
}

function saveClient(d) {
  if (d.id) {
    var rows = execSQL("UPDATE textgen.clients SET name=" + escSQL(d.name) + ", website=" + escSQL(d.website) + ", niche=" + escSQL(d.niche) + ", notes=" + escSQL(d.notes) + " WHERE id=" + d.id + " RETURNING *");
    return rows[0];
  } else {
    var rows = execSQL("INSERT INTO textgen.clients (name, website, niche, notes) VALUES (" + escSQL(d.name) + "," + escSQL(d.website) + "," + escSQL(d.niche) + "," + escSQL(d.notes) + ") RETURNING *");
    return rows[0];
  }
}

function deleteClient(clientId) {
  execSQL("DELETE FROM textgen.clients WHERE id=" + clientId);
  return true;
}

// --- Задачи ---

function getTasks(clientId) {
  if (clientId) {
    return execSQL("SELECT * FROM textgen.tasks WHERE client_id=" + clientId + " ORDER BY created_at DESC");
  }
  return execSQL("SELECT * FROM textgen.tasks ORDER BY created_at DESC");
}

function getTask(taskId) {
  var rows = execSQL("SELECT * FROM textgen.tasks WHERE id=" + taskId);
  return rows[0] || null;
}

function saveTask(d) {
  if (d.id) {
    var rows = execSQL("UPDATE textgen.tasks SET client_id=" + d.client_id +
      ", template_id=" + (d.template_id || 'NULL') +
      ", name=" + escSQL(d.name) +
      ", system_prompt=" + escSQL(d.system_prompt) +
      ", user_prompt=" + escSQL(d.user_prompt) +
      ", core_fields=" + jsonSQL(d.core_fields) +
      ", flex_blocks=" + jsonSQL(d.flex_blocks) +
      ", active_flex_blocks=" + jsonSQL(d.active_flex_blocks) +
      ", field_values=" + jsonSQL(d.field_values) +
      ", llm_provider=" + escSQL(d.llm_provider) +
      ", llm_model=" + escSQL(d.llm_model) +
      ", options=" + jsonSQL(d.options) +
      ", status=" + escSQL(d.status || 'active') +
      " WHERE id=" + d.id + " RETURNING *");
    return rows[0];
  } else {
    var rows = execSQL("INSERT INTO textgen.tasks (client_id, template_id, name, system_prompt, user_prompt, core_fields, flex_blocks, active_flex_blocks, field_values, llm_provider, llm_model, options, status) VALUES (" +
      d.client_id + "," +
      (d.template_id || 'NULL') + "," +
      escSQL(d.name) + "," +
      escSQL(d.system_prompt) + "," +
      escSQL(d.user_prompt) + "," +
      jsonSQL(d.core_fields) + "," +
      jsonSQL(d.flex_blocks) + "," +
      jsonSQL(d.active_flex_blocks) + "," +
      jsonSQL(d.field_values) + "," +
      escSQL(d.llm_provider) + "," +
      escSQL(d.llm_model) + "," +
      jsonSQL(d.options) + "," +
      escSQL(d.status || 'active') +
      ") RETURNING *");
    return rows[0];
  }
}

function deleteTask(taskId) {
  execSQL("DELETE FROM textgen.tasks WHERE id=" + taskId);
  return true;
}

function updateTask(taskId, updates) {
  var sets = [];
  for (var k in updates) {
    var v = updates[k];
    if (typeof v === 'object' && v !== null) sets.push(k + "=" + jsonSQL(v));
    else if (typeof v === 'number') sets.push(k + "=" + v);
    else if (v === null) sets.push(k + "=NULL");
    else sets.push(k + "=" + escSQL(v));
  }
  if (!sets.length) return null;
  var rows = execSQL("UPDATE textgen.tasks SET " + sets.join(", ") + " WHERE id=" + taskId + " RETURNING *");
  return rows[0] || null;
}

// --- Шаблоны задач ---

function getTaskTemplates() {
  return execSQL("SELECT * FROM textgen.task_templates ORDER BY name");
}

function getTaskTemplate(id) {
  var rows = execSQL("SELECT * FROM textgen.task_templates WHERE id=" + id);
  return rows[0] || null;
}

function saveTaskTemplate(d) {
  if (d.id) {
    var rows = execSQL("UPDATE textgen.task_templates SET name=" + escSQL(d.name) +
      ", description=" + escSQL(d.description) +
      ", client_ids=" + jsonSQL(d.client_ids) +
      ", system_prompt=" + escSQL(d.system_prompt) +
      ", user_prompt=" + escSQL(d.user_prompt) +
      ", core_fields=" + jsonSQL(d.core_fields) +
      ", flex_blocks=" + jsonSQL(d.flex_blocks) +
      ", llm_provider=" + escSQL(d.llm_provider) +
      ", llm_model=" + escSQL(d.llm_model) +
      ", options=" + jsonSQL(d.options) +
      " WHERE id=" + d.id + " RETURNING *");
    return rows[0];
  } else {
    var rows = execSQL("INSERT INTO textgen.task_templates (name, description, client_ids, system_prompt, user_prompt, core_fields, flex_blocks, llm_provider, llm_model, options) VALUES (" +
      escSQL(d.name) + "," +
      escSQL(d.description) + "," +
      jsonSQL(d.client_ids) + "," +
      escSQL(d.system_prompt) + "," +
      escSQL(d.user_prompt) + "," +
      jsonSQL(d.core_fields) + "," +
      jsonSQL(d.flex_blocks) + "," +
      escSQL(d.llm_provider) + "," +
      escSQL(d.llm_model) + "," +
      jsonSQL(d.options) +
      ") RETURNING *");
    return rows[0];
  }
}

function deleteTaskTemplate(id) {
  execSQL("DELETE FROM textgen.task_templates WHERE id=" + id);
  return true;
}

// --- Генерация текста (OpenAI) ---

function getOpenAIKey() {
  var key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) throw new Error('OpenAI API key не встановлено');
  return key;
}

function setOpenAIKey(key) {
  PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY', key);
  return 'OK';
}

function hasOpenAIKey() {
  return !!PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
}

function callOpenAI(systemPrompt, userPrompt, model) {
  model = model || 'gpt-4o-mini';
  var payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt || '' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  };
  var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + getOpenAIKey() },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code !== 200) {
    var err = '';
    try { err = JSON.parse(body).error.message; } catch(e) { err = body.substring(0, 200); }
    throw new Error('OpenAI error (' + code + '): ' + err);
  }
  return JSON.parse(body).choices[0].message.content;
}

function parseContentToBlocksServer(html) {
  if (!html) return [];
  var blocks = [];
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
    blocks.push({ id: 'b_' + Date.now() + '_' + idx, type: type, tag: tag, content: type === 'list' ? match[0] : content });
    idx++;
  }
  if (blocks.length === 0) {
    var lines = html.split(/\n\n+/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      blocks.push({ id: 'b_' + Date.now() + '_' + i, type: 'paragraph', tag: 'p', content: line.replace(/<[^>]+>/g, '') });
    }
  }
  return blocks;
}

function convertToHTML(rawContent) {
  if (rawContent.indexOf('<') !== -1) return rawContent;
  return rawContent.split(/\n\n+/).map(function(p) {
    p = p.trim();
    if (!p) return '';
    if (p.match(/^#{1,3}\s/)) {
      var level = p.match(/^(#{1,3})\s/)[1].length;
      return '<h' + level + '>' + p.replace(/^#{1,3}\s/, '') + '</h' + level + '>';
    }
    return '<p>' + p + '</p>';
  }).join('\n');
}

function generateTextWithAI(taskId, assembledPrompt, fieldValues) {
  try {
    var task = getTask(taskId);
    if (!task) throw new Error('Задача не знайдена');

    var systemPrompt = (task.system_prompt || '') +
      '\n\nВАЖНО: Форматуй текст HTML-тегами: <h1>, <h2>, <h3>, <p>, <ul>, <li>. Не використовуй Markdown.';

    var rawContent = callOpenAI(systemPrompt, assembledPrompt, 'gpt-4o-mini');
    rawContent = convertToHTML(rawContent);
    var blocks = parseContentToBlocksServer(rawContent);

    var rows = execSQL("INSERT INTO textgen.generated_texts (task_id, user_input, used_system_prompt, used_user_prompt, used_llm_model, used_field_values, content, blocks, status) VALUES (" +
      taskId + "," +
      escSQL(assembledPrompt) + "," +
      escSQL(task.system_prompt) + "," +
      escSQL(task.user_prompt) + "," +
      "'GPT-4o-mini'," +
      jsonSQL(fieldValues) + "," +
      escSQL(rawContent) + "," +
      jsonSQL(blocks) + "," +
      "'completed'" +
      ") RETURNING *");
    return rows[0];
  } catch (e) {
    // Сохранить ошибку
    try {
      execSQL("INSERT INTO textgen.generated_texts (task_id, user_input, used_llm_model, status, error_message) VALUES (" +
        taskId + "," + escSQL(assembledPrompt) + ",'GPT-4o-mini','failed'," + escSQL(e.message) + ")");
    } catch(e2) {}
    throw new Error('Помилка генерації: ' + e.message);
  }
}

function regenerateBlockWithAI(textId, blockIndex, comment) {
  try {
    var text = getGeneratedText(textId);
    if (!text) throw new Error('Текст не знайдено');
    var blocks = text.blocks || [];
    if (blockIndex >= blocks.length) throw new Error('Блок не знайдено');

    var block = blocks[blockIndex];
    var contextBlocks = [];
    for (var i = 0; i < blocks.length; i++) {
      contextBlocks.push((i === blockIndex ? '[ПЕРЕПИСАТИ]: ' : '') + blocks[i].content);
    }

    var prompt = 'Перепиши ТІЛЬКИ виділений блок.\n\nКонтекст:\n' + contextBlocks.join('\n\n') +
      '\n\nБлок: "' + block.content + '"' +
      (comment ? '\nКоментар: ' + comment : '') +
      '\n\nВідповідай ТІЛЬКИ переписаним блоком, без HTML, без пояснень.';

    var newContent = callOpenAI(text.used_system_prompt || '', prompt, 'gpt-4o-mini');
    newContent = newContent.replace(/<[^>]+>/g, '').trim();

    blocks[blockIndex].content = newContent;
    var fullContent = blocks.map(function(b) {
      if (b.type === 'heading') return '<' + b.tag + '>' + b.content + '</' + b.tag + '>';
      if (b.type === 'list') return b.content;
      return '<p>' + b.content + '</p>';
    }).join('\n');

    var rows = execSQL("UPDATE textgen.generated_texts SET content=" + escSQL(fullContent) +
      ", blocks=" + jsonSQL(blocks) +
      ", regeneration_count=" + ((text.regeneration_count || 0) + 1) +
      " WHERE id=" + textId + " RETURNING *");
    return rows[0];
  } catch (e) {
    throw new Error('Помилка регенерації блоку: ' + e.message);
  }
}

function regenerateFullTextWithAI(textId, comment) {
  try {
    var text = getGeneratedText(textId);
    if (!text) throw new Error('Текст не знайдено');

    var prompt = text.user_input || '';
    if (comment) prompt += '\n\nДодаткові інструкції:\n' + comment;

    var systemPrompt = (text.used_system_prompt || '') +
      '\n\nВАЖНО: Форматуй HTML-тегами: <h1>, <h2>, <h3>, <p>, <ul>, <li>.';

    var rawContent = callOpenAI(systemPrompt, prompt, 'gpt-4o-mini');
    rawContent = convertToHTML(rawContent);
    var blocks = parseContentToBlocksServer(rawContent);

    var rows = execSQL("UPDATE textgen.generated_texts SET content=" + escSQL(rawContent) +
      ", blocks=" + jsonSQL(blocks) +
      ", regeneration_count=" + ((text.regeneration_count || 0) + 1) +
      (comment ? ", comment=" + escSQL(comment) : '') +
      " WHERE id=" + textId + " RETURNING *");
    return rows[0];
  } catch (e) {
    throw new Error('Помилка перегенерації: ' + e.message);
  }
}

// --- Тексты ---

function getGeneratedTexts(taskId) {
  return execSQL("SELECT * FROM textgen.generated_texts WHERE task_id=" + taskId + " ORDER BY created_at DESC");
}

function getGeneratedText(textId) {
  var rows = execSQL("SELECT * FROM textgen.generated_texts WHERE id=" + textId);
  return rows[0] || null;
}

function updateGeneratedText(textId, updates) {
  var sets = [];
  for (var k in updates) {
    var v = updates[k];
    if (typeof v === 'object' && v !== null) sets.push(k + "=" + jsonSQL(v));
    else if (typeof v === 'number') sets.push(k + "=" + v);
    else if (v === null) sets.push(k + "=NULL");
    else sets.push(k + "=" + escSQL(v));
  }
  if (!sets.length) return null;
  var rows = execSQL("UPDATE textgen.generated_texts SET " + sets.join(", ") + " WHERE id=" + textId + " RETURNING *");
  return rows[0] || null;
}

function deleteGeneratedText(textId) {
  execSQL("DELETE FROM textgen.generated_texts WHERE id=" + textId);
  return true;
}

// --- Google Sheets Import ---

function getSheetHeaders(sheetUrl) {
  try {
    var match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new Error('Невірне посилання');
    var ss = SpreadsheetApp.openById(match[1]);
    var sheet = ss.getSheets()[0];
    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var headers = [];
    for (var i = 0; i < headerRow.length; i++) {
      var val = String(headerRow[i]).trim();
      if (val) headers.push(val);
    }
    if (!headers.length) throw new Error('Не знайдено заголовків');
    return headers;
  } catch (e) {
    throw new Error('Помилка: ' + e.message);
  }
}

function getSheetRows(sheetUrl) {
  try {
    var match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new Error('Невірне посилання');
    var ss = SpreadsheetApp.openById(match[1]);
    var sheet = ss.getSheets()[0];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) throw new Error('Немає рядків з даними');

    var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = [];
    for (var c = 0; c < allData[0].length; c++) {
      headers.push(String(allData[0][c]).trim() || ('Колонка ' + (c + 1)));
    }

    var topicCol = -1;
    var topicKW = ['тема', 'topic', 'h1', 'заголовок'];
    for (var ti = 0; ti < headers.length; ti++) {
      var hL = headers[ti].toLowerCase();
      for (var tk = 0; tk < topicKW.length; tk++) {
        if (hL.indexOf(topicKW[tk]) !== -1) { topicCol = ti; break; }
      }
      if (topicCol !== -1) break;
    }

    var rows = [];
    for (var r = 1; r < allData.length; r++) {
      var hasData = false;
      var cells = {};
      for (var c2 = 0; c2 < headers.length; c2++) {
        var val = String(allData[r][c2]).trim();
        cells[headers[c2]] = val;
        if (val) hasData = true;
      }
      if (!hasData) continue;
      var topic = topicCol !== -1 ? String(allData[r][topicCol]).trim() : '';
      if (!topic) {
        for (var c3 = 0; c3 < allData[r].length; c3++) {
          var v = String(allData[r][c3]).trim();
          if (v && v.length > 3) { topic = v; break; }
        }
      }
      rows.push({
        rowNum: r + 1,
        topic: topic ? (topic.length > 80 ? topic.substring(0, 80) + '...' : topic) : 'Рядок ' + (r + 1),
        cells: cells
      });
    }
    if (!rows.length) throw new Error('Немає рядків з даними');
    return { headers: headers, rows: rows };
  } catch (e) {
    throw new Error('Помилка: ' + e.message);
  }
}

function mapSheetRowToFields(sheetHeaders, rowCells, taskFieldNames) {
  try {
    var prompt = 'Дані з рядка Google-таблиці (ТЗ для копірайтера) та поля системи.\n\nКОЛОНКИ ТАБЛИЦІ:\n';
    for (var i = 0; i < sheetHeaders.length; i++) {
      var val = rowCells[sheetHeaders[i]] || '';
      var preview = val.length > 100 ? val.substring(0, 100) + '...' : val;
      prompt += (i + 1) + '. "' + sheetHeaders[i] + '": "' + preview + '"\n';
    }
    prompt += '\nПОЛЯ СИСТЕМИ:\n';
    for (var j = 0; j < taskFieldNames.length; j++) {
      prompt += '- ' + taskFieldNames[j].key + ' (label: "' + taskFieldNames[j].label + '")\n';
    }
    prompt += '\nВизнач відповідність колонок до полів. Аналізуй назви І вміст.\n';
    prompt += 'Відповідай ТІЛЬКИ JSON: {"field_key": "Назва колонки", ...}\n';
    prompt += 'Кожна колонка — тільки одному полю.';

    var result = callOpenAI('Точний інструмент маппінгу. Відповідай ТІЛЬКИ JSON.', prompt, 'gpt-4o-mini');
    result = result.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
    return JSON.parse(result);
  } catch (e) {
    throw new Error('Помилка маппінгу: ' + e.message);
  }
}

// --- Утилиты ---

function getAllDataForDashboard(clientId) {
  try {
    var client = null;
    var tasks = [];
    if (clientId) {
      var clientRows = execSQL("SELECT * FROM textgen.clients WHERE id=" + clientId);
      client = clientRows[0] || null;
      tasks = execSQL("SELECT * FROM textgen.tasks WHERE client_id=" + clientId + " ORDER BY created_at DESC");
    }
    return { client: client, tasks: tasks };
  } catch (e) {
    throw new Error('Помилка: ' + e.message);
  }
}
