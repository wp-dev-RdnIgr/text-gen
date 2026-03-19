// ===========================================
// DataStore.gs - CRUD для моковых данных
// Хранилище: PropertiesService (ScriptProperties)
// ===========================================

// Ключи хранилища (используются как строковые литералы во всех файлах):
// 'clients', 'projects', 'prompt_templates', 'generations', 'generated_texts'

// --- Базовые операции ---

/**
 * Получить массив из хранилища по ключу
 */
function _getAll(key) {
  var props = PropertiesService.getScriptProperties();
  var data = props.getProperty(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

/**
 * Сохранить массив в хранилище по ключу
 */
function _saveAll(key, items) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(key, JSON.stringify(items));
}

/**
 * Найти элемент по id
 */
function _findById(key, id) {
  var items = _getAll(key);
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) return items[i];
  }
  return null;
}

/**
 * Сохранить элемент (создание или обновление)
 */
function _saveItem(key, item, prefix) {
  var items = _getAll(key);
  if (!item.id) {
    // Создание нового элемента
    item.id = prefix + Date.now();
    items.push(item);
  } else {
    // Обновление существующего
    var found = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === item.id) {
        items[i] = item;
        found = true;
        break;
      }
    }
    if (!found) items.push(item);
  }
  _saveAll(key, items);
  return item;
}

/**
 * Удалить элемент по id
 */
function _deleteItem(key, id) {
  var items = _getAll(key);
  var filtered = items.filter(function(item) { return item.id !== id; });
  if (filtered.length === items.length) return false;
  _saveAll(key, filtered);
  return true;
}

/**
 * Обновить поля элемента по id
 */
function _updateItem(key, id, updates) {
  var items = _getAll(key);
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      for (var prop in updates) {
        items[i][prop] = updates[prop];
      }
      _saveAll(key, items);
      return items[i];
    }
  }
  return null;
}

/**
 * Фильтровать элементы по полю
 */
function _filterBy(key, field, value) {
  var items = _getAll(key);
  if (!value) return items;
  return items.filter(function(item) { return item[field] === value; });
}
