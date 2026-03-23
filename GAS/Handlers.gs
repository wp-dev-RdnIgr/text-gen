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
    if (!taskData.columns) {
      taskData.columns = [
        { key: 'url', label: 'URL', type: 'short' },
        { key: 'keywords', label: 'Ключевые слова', type: 'short' },
        { key: 'topic', label: 'Тема', type: 'short' },
        { key: 'brief', label: 'ТЗ', type: 'long' }
      ];
    }
    if (!taskData.rows) {
      taskData.rows = [];
    }
    if (!taskData.status) {
      taskData.status = 'draft';
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
    var texts = _getAll('generated_texts');
    texts = texts.filter(function(t) { return t.task_id !== taskId; });
    _saveAll('generated_texts', texts);
    return _deleteItem('tasks', taskId);
  } catch (e) {
    throw new Error('Ошибка удаления задачи: ' + e.message);
  }
}

function startTask(taskId) {
  try {
    var task = _findById('tasks', taskId);
    if (!task) throw new Error('Задача не найдена');

    var filledRows = (task.rows || []).filter(function(r) {
      for (var k in r) { if (r[k]) return true; }
      return false;
    });
    if (!filledRows.length) throw new Error('Нет данных для генерации');

    task.status = 'running';
    task.total_texts = filledRows.length;
    task.completed_texts = 0;
    task.failed_texts = 0;
    task.started_at = new Date().toISOString();
    task.completed_at = null;
    _saveItem('tasks', task, 'task_');

    var texts = _getAll('generated_texts');
    var newTexts = [];
    for (var i = 0; i < filledRows.length; i++) {
      var text = {
        id: 'gt' + Date.now() + '_' + i,
        task_id: taskId,
        row_number: i + 1,
        source_data: filledRows[i],
        status: 'pending',
        uniqueness_score: null,
        ai_score: null,
        gdoc_url: null,
        error_message: null,
        comment: '',
        regeneration_count: 0
      };
      newTexts.push(text);
    }
    texts = texts.concat(newTexts);
    _saveAll('generated_texts', texts);

    return { task: task, texts: newTexts };
  } catch (e) {
    throw new Error('Ошибка запуска задачи: ' + e.message);
  }
}

// --- Шаблоны ---

function getTemplates(category) {
  try {
    if (category) {
      return _filterBy('prompt_templates', 'category', category);
    }
    return _getAll('prompt_templates');
  } catch (e) {
    throw new Error('Ошибка загрузки шаблонов: ' + e.message);
  }
}

function getTemplate(templateId) {
  try {
    return _findById('prompt_templates', templateId);
  } catch (e) {
    throw new Error('Ошибка загрузки шаблона: ' + e.message);
  }
}

function saveTemplate(templateData) {
  try {
    if (templateData.id) {
      var existing = _findById('prompt_templates', templateData.id);
      if (existing) {
        var versionSnapshot = {
          id: 'tv_' + existing.id + '_v' + (existing.version || 1),
          template_id: existing.id,
          version: existing.version || 1,
          name: existing.name,
          category: existing.category,
          system_prompt: existing.system_prompt,
          user_prompt: existing.user_prompt,
          usage_count: existing.usage_count || 0,
          avg_uniqueness: existing.avg_uniqueness || 0,
          saved_at: new Date().toISOString()
        };
        var versions = _getAll('template_versions');
        var exists = versions.some(function(v) { return v.id === versionSnapshot.id; });
        if (!exists) {
          versions.push(versionSnapshot);
          _saveAll('template_versions', versions);
        }
        templateData.version = (existing.version || 1) + 1;
      }
    } else {
      templateData.version = 1;
      templateData.usage_count = 0;
      templateData.avg_uniqueness = 0;
    }
    return _saveItem('prompt_templates', templateData, 't');
  } catch (e) {
    throw new Error('Ошибка сохранения шаблона: ' + e.message);
  }
}

function deleteTemplate(templateId) {
  try {
    var versions = _getAll('template_versions');
    versions = versions.filter(function(v) { return v.template_id !== templateId; });
    _saveAll('template_versions', versions);
    return _deleteItem('prompt_templates', templateId);
  } catch (e) {
    throw new Error('Ошибка удаления шаблона: ' + e.message);
  }
}

function getTemplateVersions(templateId) {
  try {
    var versions = _filterBy('template_versions', 'template_id', templateId);
    versions.sort(function(a, b) { return (b.version || 0) - (a.version || 0); });
    return versions;
  } catch (e) {
    throw new Error('Ошибка загрузки версий шаблона: ' + e.message);
  }
}

function restoreTemplateVersion(templateId, versionId) {
  try {
    var version = _findById('template_versions', versionId);
    if (!version) throw new Error('Версия не найдена');
    var current = _findById('prompt_templates', templateId);
    if (!current) throw new Error('Шаблон не найден');

    var snapshot = {
      id: 'tv_' + current.id + '_v' + (current.version || 1),
      template_id: current.id,
      version: current.version || 1,
      name: current.name,
      category: current.category,
      system_prompt: current.system_prompt,
      user_prompt: current.user_prompt,
      usage_count: current.usage_count || 0,
      avg_uniqueness: current.avg_uniqueness || 0,
      saved_at: new Date().toISOString()
    };
    var versions = _getAll('template_versions');
    var exists = versions.some(function(v) { return v.id === snapshot.id; });
    if (!exists) {
      versions.push(snapshot);
      _saveAll('template_versions', versions);
    }

    current.system_prompt = version.system_prompt;
    current.user_prompt = version.user_prompt;
    current.version = (current.version || 1) + 1;
    return _saveItem('prompt_templates', current, 't');
  } catch (e) {
    throw new Error('Ошибка восстановления версии: ' + e.message);
  }
}

// --- Тексты ---

function getGeneratedTexts(taskId) {
  try {
    return _filterBy('generated_texts', 'task_id', taskId);
  } catch (e) {
    throw new Error('Ошибка загрузки текстов: ' + e.message);
  }
}

function updateGeneratedText(textId, updates) {
  try {
    return _updateItem('generated_texts', textId, updates);
  } catch (e) {
    throw new Error('Ошибка обновления текста: ' + e.message);
  }
}

function updateTask(taskId, updates) {
  try {
    return _updateItem('tasks', taskId, updates);
  } catch (e) {
    throw new Error('Ошибка обновления задачи: ' + e.message);
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
