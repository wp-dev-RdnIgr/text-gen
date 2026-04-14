// ===========================================
// Handlers.gs — Усі дані через n8n → PostgreSQL
// OpenAI и AI-маппинг тоже через n8n
// ===========================================

var N8N_API_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-api';
var N8N_PROMPT_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-prompt';
var N8N_AGENT_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-seo-agent';
var N8N_GDOC_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-save-gdoc';

// --- Хелперы ---

function callCrudApi(action, params) {
  try {
    var response = UrlFetchApp.fetch(N8N_API_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ action: action, params: params || {} }),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var text = response.getContentText();
    if (code !== 200) throw new Error('API error ' + code + ': ' + text.substring(0, 200));
    if (!text || text === '[]') return [];
    var parsed = JSON.parse(text);
    Logger.log('callCrudApi(' + action + ') → ' + text.substring(0, 200));
    return parsed;
  } catch (e) {
    Logger.log('callCrudApi(' + action + ') ERROR: ' + e.message);
    throw new Error('callCrudApi(' + action + '): ' + e.message);
  }
}

// callSQL видалено — весь SQL тепер в n8n

// callGenApi видалено — AI тепер через Prompt Engine

/**
 * Prompt Engine — тонкий прокси до n8n, вся логіка там
 */
function callPromptEngine(systemPrompt, userPrompt, options) {
  var payload = {
    systemPrompt: systemPrompt || '',
    userPrompt: userPrompt || '',
    model: (options && options.model) || 'gpt-4o-mini',
    temperature: (options && options.temperature) || 0.7,
    maxTokens: (options && options.maxTokens) || 4000,
    humanize: (options && options.humanize) || false,
    action: (options && options.action) || 'generate',
    taskId: (options && options.taskId) || null,
    textId: (options && options.textId) || null,
    fieldValues: (options && options.fieldValues) || {},
    referenceTexts: (options && options.referenceTexts) || [],
    topic: (options && options.topic) || '',
    blockIndex: (options && options.blockIndex != null) ? options.blockIndex : null,
    comment: (options && options.comment) || ''
  };
  var response = UrlFetchApp.fetch(N8N_PROMPT_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code !== 200 || !text) throw new Error('Prompt Engine error (' + code + ')');
  return JSON.parse(text);
}

// escSQL, jsonSQL видалено — весь SQL тепер в n8n

// --- Клієнти ---

function getClients() {
  return callCrudApi('getClients');
}

function saveClient(d) {
  var rows = callCrudApi('saveClient', d);
  var result = Array.isArray(rows) ? (rows[0] || null) : rows;
  if (!result || !result.id) throw new Error('Не вдалося зберегти клієнта');
  return result;
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
  var result = Array.isArray(rows) ? (rows[0] || null) : rows;
  if (!result || !result.id) throw new Error('Не вдалося зберегти задачу');
  return result;
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
  var result = Array.isArray(rows) ? (rows[0] || null) : rows;
  if (!result || !result.id) {
    // Fallback: повернути обʼєкт з id з params якщо є
    if (d.id) { result = d; }
    else { throw new Error('Не вдалося зберегти шаблон'); }
  }
  return result;
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

// --- Voice Clone: аналіз голосового профілю (бекенд в n8n) ---

function analyzeVoiceProfile(taskId, referenceTexts) {
  var result = callPromptEngine('', referenceTexts.join('\n\n---\n\n'), {
    action: 'analyzeVoice',
    taskId: taskId,
    referenceTexts: referenceTexts
  });
  return result.content || '';
}

// --- Interview: генерація питань (бекенд в n8n) ---

function generateInterviewQuestions(taskId, topic) {
  var result = callPromptEngine('', topic, {
    action: 'generateInterview',
    taskId: taskId,
    topic: topic
  });
  return result.questions || JSON.parse(result.content || '[]');
}

// --- Генерація тексту (через AI Agent в n8n) ---

function generateTextWithAI(taskId, assembledPrompt, fieldValues) {
  var task = getTask(taskId);
  var sessionId = 'gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  var response = UrlFetchApp.fetch(N8N_AGENT_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      sessionId: sessionId,
      taskId: taskId,
      assembledPrompt: assembledPrompt,
      systemPrompt: task ? task.system_prompt || '' : '',
      userPrompt: assembledPrompt,
      fieldValues: fieldValues || {},
      llm_provider: task ? task.llm_provider : ''
    }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code !== 200 || !text) throw new Error('Agent error (' + code + ')');
  var result = JSON.parse(text);
  result.sessionId = sessionId;
  return result;
}

// --- Останні етапи генерації для задачі (знайти активну сесію) ---

function getRecentGenerationStages(taskId) {
  if (!taskId) return [];
  var response = UrlFetchApp.fetch('https://n8n.rnd.webpromo.tools/webhook/textgen-sql', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      query: "SELECT id, session_id, stage, status, content, chars_count, created_at FROM textgen.generation_stages WHERE task_id=" + parseInt(taskId, 10) + " AND created_at > NOW() - INTERVAL '10 minutes' ORDER BY id ASC"
    }),
    muteHttpExceptions: true
  });
  var text = response.getContentText();
  if (!text) return [];
  try {
    return JSON.parse(text) || [];
  } catch (e) {
    return [];
  }
}

// --- Отримати етапи генерації для session (polling) ---

function getGenerationStages(sessionId) {
  if (!sessionId) return [];
  var response = UrlFetchApp.fetch('https://n8n.rnd.webpromo.tools/webhook/textgen-sql', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      query: "SELECT id, stage, status, content, chars_count, created_at FROM textgen.generation_stages WHERE session_id='" + sessionId.replace(/'/g, "''") + "' ORDER BY id ASC"
    }),
    muteHttpExceptions: true
  });
  var text = response.getContentText();
  if (!text) return [];
  try {
    return JSON.parse(text) || [];
  } catch (e) {
    return [];
  }
}

// --- Запустити генерацію асинхронно (не блокувати UI) ---

function startGenerationAsync(taskId, assembledPrompt, fieldValues) {
  var sessionId = 'gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  var task = getTask(taskId);
  // Не чекаємо відповіді — просто запускаємо
  // GAS UrlFetchApp не підтримує async, тому це блокуючий виклик
  // Але поверне sessionId одразу для polling
  try {
    var response = UrlFetchApp.fetch(N8N_AGENT_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        sessionId: sessionId,
        taskId: taskId,
        assembledPrompt: assembledPrompt,
        systemPrompt: task ? task.system_prompt || '' : '',
        userPrompt: assembledPrompt,
        fieldValues: fieldValues || {},
        llm_provider: task ? task.llm_provider : ''
      }),
      muteHttpExceptions: true
    });
    var text = response.getContentText();
    if (text) {
      var result = JSON.parse(text);
      result.sessionId = sessionId;
      return result;
    }
  } catch (e) {}
  return { sessionId: sessionId };
}

// --- Зберігання в Google Doc (через n8n) ---

function saveToGoogleDoc(textId) {
  var response = UrlFetchApp.fetch(N8N_GDOC_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ textId: textId }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code !== 200 || !body) throw new Error('n8n error (' + code + '): ' + (body || 'empty').substring(0, 200));

  var result = JSON.parse(body);
  return result.url || (Array.isArray(result) ? (result[0] && result[0].url) : null) || '';
}

// --- Регенерація блоку (через Prompt Engine — простий запит без агента) ---

function regenerateBlockWithAI(textId, blockIndex, comment) {
  return callPromptEngine('', '', {
    action: 'regenerateBlock',
    textId: textId,
    blockIndex: blockIndex,
    comment: comment || ''
  });
}

// --- Повна перегенерація (через Prompt Engine) ---

function regenerateFullTextWithAI(textId, comment) {
  return callPromptEngine('', '', {
    action: 'regenerateFull',
    textId: textId,
    comment: comment || ''
  });
}

// --- AI маппінг колонок (через Prompt Engine) ---

function mapSheetRowToFields(sheetHeaders, rowCells, taskFieldNames) {
  var prompt = 'Map these Google Sheet columns to task fields.\n\n' +
    'Sheet column headers: ' + JSON.stringify(sheetHeaders) + '\n\n' +
    'Task fields (key + label): ' + JSON.stringify(taskFieldNames) + '\n\n' +
    'IMPORTANT: Return a JSON object where each KEY is the task field KEY (like "url", "topic", etc.) ' +
    'and each VALUE is the EXACT sheet column header name that matches this field.\n' +
    'Example: {"url": "URL-адреса", "topic": "Тема статті", "keywords": "Анкор"}\n' +
    'Only include fields that have a matching column. Do NOT include cell values, only column header names.';
  var result = callPromptEngine(
    'You are a data mapper. Return only valid JSON mapping task field keys to sheet column header names. No explanation.',
    prompt,
    { action: 'mapFields', maxTokens: 1000 }
  );
  var content = (result.content || '').trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
  return JSON.parse(content);
}

// parseContentToBlocksServer видалено — парсинг блоків тепер в n8n

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

function hasOpenAIKey() {
  return true;
}

// --- Dashboard ---

function getAllDataForDashboard(clientId) {
  if (!clientId) return { client: null, tasks: [] };
  var clients = callCrudApi('getClients', {});
  var client = null;
  for (var i = 0; i < clients.length; i++) {
    if (clients[i].id == clientId) { client = clients[i]; break; }
  }
  var tasks = callCrudApi('getTasks', { clientId: clientId });
  return { client: client, tasks: tasks };
}
