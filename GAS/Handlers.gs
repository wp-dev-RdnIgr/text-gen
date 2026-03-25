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

function generateText(taskId, userInput) {
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
