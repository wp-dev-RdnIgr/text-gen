// ===========================================
// Handlers.gs - Все данные через n8n → PostgreSQL
// OpenAI и AI-маппинг тоже через n8n
// ===========================================

var N8N_API_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-api';
var N8N_SQL_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-sql';
var N8N_GEN_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-generate';
var N8N_PROMPT_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-prompt';
var N8N_GDOC_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-save-gdoc';
var GDRIVE_ROOT_FOLDER = '1Oj6hpJwRQnYwrKQM_NNOA9kIw5wP_oM6';

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

function callSQL(query) {
  try {
    var response = UrlFetchApp.fetch(N8N_SQL_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ query: query }),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var text = response.getContentText();
    if (code !== 200) throw new Error('SQL error ' + code + ': ' + text.substring(0, 200));
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    throw new Error('callSQL: ' + e.message);
  }
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

/**
 * Чистий Prompt Engine — промпти передаються БЕЗ модифікацій
 */
function callPromptEngine(systemPrompt, userPrompt, options) {
  var payload = {
    systemPrompt: systemPrompt || '',
    userPrompt: userPrompt || '',
    model: (options && options.model) || 'gpt-4o-mini',
    temperature: (options && options.temperature) || 0.7,
    maxTokens: (options && options.maxTokens) || 4000,
    action: (options && options.action) || 'generate',
    taskId: (options && options.taskId) || null,
    textId: (options && options.textId) || null
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

// --- Humanizer System Prompt (based on github.com/blader/humanizer v2.5.1) ---
var HUMANIZER_SYSTEM_PROMPT = 'You are a writing editor that removes signs of AI-generated text. Based on Wikipedia "Signs of AI writing" guide.\n\n' +
  'RULES:\n' +
  '1. Remove significance inflation ("marking a pivotal moment", "testament to", "crucial role") - replace with specific facts\n' +
  '2. Remove promotional language ("vibrant", "nestled", "breathtaking", "groundbreaking", "renowned") - use neutral tone\n' +
  '3. Remove superficial -ing analyses ("highlighting", "showcasing", "emphasizing", "fostering")\n' +
  '4. Remove AI vocabulary: "additionally", "delve", "landscape" (abstract), "tapestry", "underscore", "enhance", "foster", "garner", "pivotal", "crucial", "interplay", "intricate"\n' +
  '5. Replace copula avoidance ("serves as", "stands as", "boasts", "features") with simple "is", "has"\n' +
  '6. Remove negative parallelisms ("It\'s not just X, it\'s Y") - state the point directly\n' +
  '7. Remove Rule of Three overuse - use natural number of items\n' +
  '8. Stop synonym cycling - repeat the clearest word instead of rotating synonyms\n' +
  '9. Reduce em dash (—) overuse - prefer commas or periods\n' +
  '10. Remove boldface overuse and inline-header lists - convert to prose\n' +
  '11. Remove emojis from headings and bullets\n' +
  '12. Remove chatbot artifacts ("I hope this helps", "Let me know", "Great question!")\n' +
  '13. Remove filler phrases ("In order to" -> "To", "Due to the fact that" -> "Because")\n' +
  '14. Remove excessive hedging ("could potentially possibly" -> "may")\n' +
  '15. Remove generic conclusions ("The future looks bright") - replace with specific facts/plans\n' +
  '16. Remove false ranges ("from X to Y" where X and Y are not on a scale)\n' +
  '17. Fix passive voice when active is clearer\n' +
  '18. Remove signposting ("Let\'s dive in", "Here\'s what you need to know")\n' +
  '19. Remove hyphenated word pair overuse ("cross-functional, data-driven, client-facing")\n\n' +
  'PERSONALITY - add soul:\n' +
  '- Vary sentence rhythm (short punchy + longer flowing)\n' +
  '- Have opinions where appropriate\n' +
  '- Acknowledge complexity and mixed feelings\n' +
  '- Be specific, not generic\n' +
  '- Let some imperfection in - perfect structure feels algorithmic\n\n' +
  'FINAL PASS: After rewriting, ask yourself "What still makes this obviously AI generated?" and fix those remaining tells.\n\n' +
  'IMPORTANT: Preserve the original HTML structure (h1, h2, h3, p, ul, li tags). Keep the same language as the input text. Keep all factual content intact.';

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
    // Fallback: вернуть объект с id из params если есть
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

// --- Генерація через OpenAI (n8n) ---

function generateTextWithAI(taskId, assembledPrompt, fieldValues) {
  try {
    var task = getTask(taskId);
    if (!task) throw new Error('Задачу не знайдено');

    // Чистий Prompt Engine — промпти йдуть БЕЗ модифікацій
    var aiResult = callPromptEngine(
      task.system_prompt || '',   // системний промт як є
      assembledPrompt,             // зібраний користувацький промт як є
      { action: 'generate', taskId: taskId }
    );

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

    // Гуманізація (якщо увімкнено в опціях задачі)
    var opts = task.options || {};
    if (opts.humanize) {
      var humanizeResult = callPromptEngine(
        HUMANIZER_SYSTEM_PROMPT,
        'Humanize the following text. Keep the same language. Preserve HTML tags (h1, h2, h3, p, ul, li).\n\n' + rawContent,
        { action: 'humanize', taskId: taskId }
      );
      if (humanizeResult.content) {
        rawContent = humanizeResult.content;
        // Повторна конвертація якщо гуманізатор повернув не-HTML
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
      }
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

var N8N_GDOC_URL = 'https://n8n.rnd.webpromo.tools/webhook/textgen-save-gdoc';

// --- Зберігання в Google Doc (через n8n) ---

function saveToGoogleDoc(textId) {
  try {
    var text = getGeneratedText(textId);
    if (!text) throw new Error('Текст не знайдено');
    if (!text.content) throw new Error('Немає контенту');

    var task = getTask(text.task_id);
    var email = (task && task.specialist_email) ? task.specialist_email.trim() : 'unknown';
    var title = (task ? task.name : 'TextGen') + ' — ' + new Date().toLocaleDateString('uk-UA');

    // Очистити HTML для Google Docs (plain text з розмітою)
    var plainContent = text.content
      .replace(/<h1[^>]*>/gi, '# ')
      .replace(/<\/h1>/gi, '\n\n')
      .replace(/<h2[^>]*>/gi, '## ')
      .replace(/<\/h2>/gi, '\n\n')
      .replace(/<h3[^>]*>/gi, '### ')
      .replace(/<\/h3>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    var response = UrlFetchApp.fetch(N8N_GDOC_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        content: plainContent,
        title: title,
        specialistEmail: email
      }),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code !== 200 || !body) throw new Error('n8n error (' + code + '): ' + (body || 'empty').substring(0, 200));

    var result = JSON.parse(body);
    var url = result.url || (Array.isArray(result) ? (result[0] && result[0].url) : null);
    if (!url) throw new Error('Не отримано URL документа');

    // Зберегти URL в БД
    callSQL("UPDATE textgen.generated_texts SET gdoc_url=" + escSQL(url) + " WHERE id=" + textId);

    return url;
  } catch (e) {
    throw new Error('Помилка збереження в Google Doc: ' + e.message);
  }
}

function regenerateBlockWithAI(textId, blockIndex, comment) {
  try {
    var text = getGeneratedText(textId);
    if (!text) throw new Error('Текст не знайдено');
    var blocks = text.blocks || [];
    if (blockIndex >= blocks.length) throw new Error('Блок не знайдено');

    // Побудувати промпт для блоку
    var contextBlocks = [];
    for (var i = 0; i < blocks.length; i++) {
      contextBlocks.push((i === blockIndex ? '[ПЕРЕПИСАТИ]: ' : '') + blocks[i].content);
    }
    var blockPrompt = 'Перепиши ТІЛЬКИ виділений блок.\n\nКонтекст:\n' + contextBlocks.join('\n\n') +
      '\n\nБлок: "' + blocks[blockIndex].content + '"' +
      (comment ? '\nКоментар: ' + comment : '') +
      '\n\nВідповідай ТІЛЬКИ переписаним блоком, без HTML, без пояснень.';

    var aiResult = callPromptEngine(
      text.used_system_prompt || '',
      blockPrompt,
      { action: 'regenerateBlock', textId: textId }
    );

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

    var fullPrompt = text.user_input || '';
    if (comment) fullPrompt += '\n\nДодаткові інструкції:\n' + comment;

    var aiResult = callPromptEngine(
      text.used_system_prompt || '',
      fullPrompt,
      { action: 'regenerateFull', textId: textId }
    );

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
