// ===========================================
// Handlers.gs - Все данные через n8n → PostgreSQL
// OpenAI и AI-маппинг тоже через n8n
// ===========================================

var N8N_API_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-api';
var N8N_SQL_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-sql';
var N8N_GEN_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-generate';

// --- Хелперы ---

function callCrudApi(action, params) {
  var response = UrlFetchApp.fetch(N8N_API_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ action: action, params: params || {} }),
    muteHttpExceptions: true
  });
  var text = response.getContentText();
  if (!text) return [];
  return JSON.parse(text);
}

function callSQL(query) {
  var response = UrlFetchApp.fetch(N8N_SQL_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ query: query }),
    muteHttpExceptions: true
  });
  var text = response.getContentText();
  if (!text) return [];
  return JSON.parse(text);
}

function callGenApi(action, params) {
  var response = UrlFetchApp.fetch(N8N_GEN_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ action: action, params: params || {} }),
    muteHttpExceptions: true
  });
  var text = response.getContentText();
  if (!text) throw new Error('Порожня відповідь від AI сервісу');
  var data = JSON.parse(text);
  if (Array.isArray(data)) return data[0] || {};
  return data;
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
  return callCrudApi('getClients');
}

function saveClient(d) {
  var rows = callCrudApi('saveClient', d);
  return Array.isArray(rows) ? rows[0] : rows;
}

function deleteClient(clientId) {
  callCrudApi('deleteClient', { id: clientId });
  return true;
}

// --- Задачі ---

function getTasks(clientId) {
  return callCrudApi('getTasks', { clientId: clientId });
}

function getTask(taskId) {
  var rows = callCrudApi('getTask', { id: taskId });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

function saveTask(d) {
  var rows = callCrudApi('saveTask', d);
  return Array.isArray(rows) ? rows[0] : rows;
}

function deleteTask(taskId) {
  callCrudApi('deleteTask', { id: taskId });
  return true;
}

function updateTask(taskId, updates) {
  var rows = callCrudApi('updateTask', { id: taskId, updates: updates });
  return Array.isArray(rows) ? rows[0] : rows;
}

// --- Шаблони задач ---

function getTaskTemplates() {
  return callCrudApi('getTaskTemplates');
}

function getTaskTemplate(id) {
  var rows = callCrudApi('getTaskTemplate', { id: id });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

function saveTaskTemplate(d) {
  var rows = callCrudApi('saveTaskTemplate', d);
  return Array.isArray(rows) ? rows[0] : rows;
}

function deleteTaskTemplate(id) {
  callCrudApi('deleteTaskTemplate', { id: id });
  return true;
}

// --- Тексти ---

function getGeneratedTexts(taskId) {
  return callCrudApi('getGeneratedTexts', { taskId: taskId });
}

function getGeneratedText(textId) {
  var rows = callCrudApi('getGeneratedText', { id: textId });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

function updateGeneratedText(textId, updates) {
  var rows = callCrudApi('updateGeneratedText', { id: textId, updates: updates });
  return Array.isArray(rows) ? rows[0] : rows;
}

function deleteGeneratedText(textId) {
  callCrudApi('deleteGeneratedText', { id: textId });
  return true;
}

// --- Генерація через OpenAI (n8n) ---

function generateTextWithAI(taskId, assembledPrompt, fieldValues) {
  try {
    var task = getTask(taskId);
    if (!task) throw new Error('Задачу не знайдено');

    // Викликаємо n8n AI генерацію
    var aiResult = callGenApi('generateTextWithAI', {
      taskId: taskId,
      assembledPrompt: assembledPrompt,
      fieldValues: fieldValues || {},
      systemPrompt: task.system_prompt || '',
      userPrompt: task.user_prompt || ''
    });

    var rawContent = aiResult.content || '';

    // Конвертація в HTML якщо потрібно
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

    // Парсинг блоків
    var blocks = parseContentToBlocksServer(rawContent);

    // Зберегти в БД
    var rows = callSQL("INSERT INTO textgen.generated_texts (task_id, user_input, used_system_prompt, used_user_prompt, used_llm_model, used_field_values, content, blocks, status) VALUES (" +
      taskId + "," + escSQL(assembledPrompt) + "," + escSQL(task.system_prompt) + "," + escSQL(task.user_prompt) + ",'GPT-4o-mini'," + jsonSQL(fieldValues) + "," + escSQL(rawContent) + "," + jsonSQL(blocks) + ",'completed') RETURNING *");
    return rows[0];
  } catch (e) {
    try {
      callSQL("INSERT INTO textgen.generated_texts (task_id, user_input, used_llm_model, status, error_message) VALUES (" +
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

    var aiResult = callGenApi('regenerateBlockWithAI', {
      textId: textId,
      blockIndex: blockIndex,
      comment: comment || '',
      usedSystemPrompt: text.used_system_prompt || '',
      blocks: blocks,
      regenerationCount: text.regeneration_count || 0
    });

    var newContent = (aiResult.content || '').replace(/<[^>]+>/g, '').trim();
    blocks[blockIndex].content = newContent;

    var fullContent = blocks.map(function(b) {
      if (b.type === 'heading') return '<' + b.tag + '>' + b.content + '</' + b.tag + '>';
      if (b.type === 'list') return b.content;
      return '<p>' + b.content + '</p>';
    }).join('\n');

    var rows = callSQL("UPDATE textgen.generated_texts SET content=" + escSQL(fullContent) +
      ", blocks=" + jsonSQL(blocks) + ", regeneration_count=" + ((text.regeneration_count || 0) + 1) +
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

    var aiResult = callGenApi('regenerateFullTextWithAI', {
      textId: textId,
      comment: comment || '',
      userInput: text.user_input || '',
      usedSystemPrompt: text.used_system_prompt || '',
      regenerationCount: text.regeneration_count || 0
    });

    var rawContent = aiResult.content || '';
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

    var blocks = parseContentToBlocksServer(rawContent);

    var rows = callSQL("UPDATE textgen.generated_texts SET content=" + escSQL(rawContent) +
      ", blocks=" + jsonSQL(blocks) + ", regeneration_count=" + ((text.regeneration_count || 0) + 1) +
      (comment ? ", comment=" + escSQL(comment) : '') +
      " WHERE id=" + textId + " RETURNING *");
    return rows[0];
  } catch (e) {
    throw new Error('Помилка перегенерації: ' + e.message);
  }
}

// --- AI маппінг колонок ---

function mapSheetRowToFields(sheetHeaders, rowCells, taskFieldNames) {
  try {
    var aiResult = callGenApi('mapSheetRowToFields', {
      sheetHeaders: sheetHeaders,
      rowCells: rowCells,
      taskFieldNames: taskFieldNames
    });

    var content = aiResult.content || '';
    content = content.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Помилка маппінгу: ' + e.message);
  }
}

// --- Парсинг HTML → блоки ---

function parseContentToBlocksServer(html) {
  if (!html) return [];
  var blocks = [];
  var tagRegex = /<(h[1-3]|p|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  var match, idx = 0;
  while ((match = tagRegex.exec(html)) !== null) {
    var tag = match[1].toLowerCase();
    var content = match[2].trim();
    if (!content) continue;
    var type = (tag === 'h1' || tag === 'h2' || tag === 'h3') ? 'heading' : (tag === 'ul' || tag === 'ol') ? 'list' : 'paragraph';
    blocks.push({ id: 'b_' + Date.now() + '_' + idx, type: type, tag: tag, content: type === 'list' ? match[0] : content });
    idx++;
  }
  if (!blocks.length) {
    var lines = html.split(/\n\n+/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line) blocks.push({ id: 'b_' + Date.now() + '_' + i, type: 'paragraph', tag: 'p', content: line.replace(/<[^>]+>/g, '') });
    }
  }
  return blocks;
}

// --- Google Sheets Import (залишаємо в GAS — нативний доступ) ---

function getSheetHeaders(sheetUrl) {
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
}

function getSheetRows(sheetUrl) {
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
    var hasData = false, cells = {};
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
}

// --- API Key (залишаємо в GAS для сумісності з UI) ---

function setOpenAIKey(key) {
  PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY', key);
  return 'OK';
}

function hasOpenAIKey() {
  // OpenAI тепер в n8n — завжди true
  return true;
}

// --- Dashboard ---

function getAllDataForDashboard(clientId) {
  if (!clientId) return { client: null, tasks: [] };
  var clientRows = callSQL("SELECT * FROM textgen.clients WHERE id=" + clientId);
  var taskRows = callSQL("SELECT * FROM textgen.tasks WHERE client_id=" + clientId + " ORDER BY created_at DESC");
  return { client: clientRows[0] || null, tasks: taskRows };
}
