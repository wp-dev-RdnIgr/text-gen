// ===========================================
// Handlers.gs - Серверные обработчики
// Вызываются через google.script.run
// ===========================================

// --- Клиенты ---

function getClients() {
  try {
    return _getAll(STORE_KEYS.CLIENTS);
  } catch (e) {
    throw new Error('Ошибка загрузки клиентов: ' + e.message);
  }
}

function saveClient(clientData) {
  try {
    return _saveItem(STORE_KEYS.CLIENTS, clientData, 'c');
  } catch (e) {
    throw new Error('Ошибка сохранения клиента: ' + e.message);
  }
}

function deleteClient(clientId) {
  try {
    // Удалить связанные проекты
    var projects = _filterBy(STORE_KEYS.PROJECTS, 'client_id', clientId);
    projects.forEach(function(p) {
      deleteProject(p.id);
    });
    return _deleteItem(STORE_KEYS.CLIENTS, clientId);
  } catch (e) {
    throw new Error('Ошибка удаления клиента: ' + e.message);
  }
}

// --- Проекты ---

function getProjects(clientId) {
  try {
    if (clientId) {
      return _filterBy(STORE_KEYS.PROJECTS, 'client_id', clientId);
    }
    return _getAll(STORE_KEYS.PROJECTS);
  } catch (e) {
    throw new Error('Ошибка загрузки проектов: ' + e.message);
  }
}

function getProject(projectId) {
  try {
    return _findById(STORE_KEYS.PROJECTS, projectId);
  } catch (e) {
    throw new Error('Ошибка загрузки проекта: ' + e.message);
  }
}

function saveProject(projectData) {
  try {
    return _saveItem(STORE_KEYS.PROJECTS, projectData, 'p');
  } catch (e) {
    throw new Error('Ошибка сохранения проекта: ' + e.message);
  }
}

function deleteProject(projectId) {
  try {
    // Удалить связанные генерации и тексты
    var generations = _filterBy(STORE_KEYS.GENERATIONS, 'project_id', projectId);
    generations.forEach(function(g) {
      deleteGenerationData(g.id);
    });
    return _deleteItem(STORE_KEYS.PROJECTS, projectId);
  } catch (e) {
    throw new Error('Ошибка удаления проекта: ' + e.message);
  }
}

// --- Шаблоны ---

function getTemplates(category) {
  try {
    if (category) {
      return _filterBy(STORE_KEYS.TEMPLATES, 'category', category);
    }
    return _getAll(STORE_KEYS.TEMPLATES);
  } catch (e) {
    throw new Error('Ошибка загрузки шаблонов: ' + e.message);
  }
}

function getTemplate(templateId) {
  try {
    return _findById(STORE_KEYS.TEMPLATES, templateId);
  } catch (e) {
    throw new Error('Ошибка загрузки шаблона: ' + e.message);
  }
}

function saveTemplate(templateData) {
  try {
    // Увеличить версию при обновлении
    if (templateData.id) {
      var existing = _findById(STORE_KEYS.TEMPLATES, templateData.id);
      if (existing) {
        templateData.version = (existing.version || 1) + 1;
      }
    } else {
      templateData.version = 1;
      templateData.usage_count = 0;
      templateData.avg_uniqueness = 0;
    }
    return _saveItem(STORE_KEYS.TEMPLATES, templateData, 't');
  } catch (e) {
    throw new Error('Ошибка сохранения шаблона: ' + e.message);
  }
}

function deleteTemplate(templateId) {
  try {
    return _deleteItem(STORE_KEYS.TEMPLATES, templateId);
  } catch (e) {
    throw new Error('Ошибка удаления шаблона: ' + e.message);
  }
}

// --- Генерации ---

function getGenerations(projectId) {
  try {
    if (projectId) {
      return _filterBy(STORE_KEYS.GENERATIONS, 'project_id', projectId);
    }
    return _getAll(STORE_KEYS.GENERATIONS);
  } catch (e) {
    throw new Error('Ошибка загрузки генераций: ' + e.message);
  }
}

function getGeneration(generationId) {
  try {
    return _findById(STORE_KEYS.GENERATIONS, generationId);
  } catch (e) {
    throw new Error('Ошибка загрузки генерации: ' + e.message);
  }
}

function createGeneration(data) {
  try {
    var generation = {
      project_id: data.project_id,
      template_id: data.template_id,
      llm_provider: data.llm_provider,
      llm_model: data.llm_model,
      status: 'pending',
      total_texts: data.rows.length,
      completed_texts: 0,
      failed_texts: 0,
      options: data.options || {},
      created_at: new Date().toISOString(),
      completed_at: null
    };
    generation = _saveItem(STORE_KEYS.GENERATIONS, generation, 'g');

    // Создать generated_texts для каждой строки
    var texts = _getAll(STORE_KEYS.TEXTS);
    var newTexts = [];
    for (var i = 0; i < data.rows.length; i++) {
      var text = {
        id: 'gt' + Date.now() + '_' + i,
        generation_id: generation.id,
        row_number: i + 1,
        source_data: data.rows[i],
        status: 'pending',
        uniqueness_score: null,
        ai_score: null,
        gdoc_url: null,
        error_message: null
      };
      newTexts.push(text);
    }
    texts = texts.concat(newTexts);
    _saveAll(STORE_KEYS.TEXTS, texts);

    return { generation: generation, texts: newTexts };
  } catch (e) {
    throw new Error('Ошибка создания генерации: ' + e.message);
  }
}

function getGeneratedTexts(generationId) {
  try {
    return _filterBy(STORE_KEYS.TEXTS, 'generation_id', generationId);
  } catch (e) {
    throw new Error('Ошибка загрузки текстов: ' + e.message);
  }
}

function updateGeneratedText(textId, updates) {
  try {
    return _updateItem(STORE_KEYS.TEXTS, textId, updates);
  } catch (e) {
    throw new Error('Ошибка обновления текста: ' + e.message);
  }
}

function updateGeneration(genId, updates) {
  try {
    return _updateItem(STORE_KEYS.GENERATIONS, genId, updates);
  } catch (e) {
    throw new Error('Ошибка обновления генерации: ' + e.message);
  }
}

// Удалить данные генерации (тексты)
function deleteGenerationData(generationId) {
  var texts = _getAll(STORE_KEYS.TEXTS);
  texts = texts.filter(function(t) { return t.generation_id !== generationId; });
  _saveAll(STORE_KEYS.TEXTS, texts);
  _deleteItem(STORE_KEYS.GENERATIONS, generationId);
}

// --- Утилиты ---

function getAllDataForDashboard(clientId) {
  try {
    var client = clientId ? _findById(STORE_KEYS.CLIENTS, clientId) : null;
    var projects = clientId ? _filterBy(STORE_KEYS.PROJECTS, 'client_id', clientId) : [];
    var allGenerations = _getAll(STORE_KEYS.GENERATIONS);
    var generations = [];
    if (clientId) {
      var projectIds = projects.map(function(p) { return p.id; });
      generations = allGenerations.filter(function(g) {
        return projectIds.indexOf(g.project_id) !== -1;
      });
    }
    return {
      client: client,
      projects: projects,
      generations: generations
    };
  } catch (e) {
    throw new Error('Ошибка загрузки данных дашборда: ' + e.message);
  }
}
