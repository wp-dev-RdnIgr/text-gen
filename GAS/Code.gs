// ===========================================
// Code.gs — Точка входу, роутинг, меню
// ===========================================

/**
 * Створює меню в Google Sheets (якщо використовується як add-on)
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Генератор текстів')
    .addItem('Відкрити панель', 'openSidebar')
    .addItem('Заповнити демо-дані', 'seedData')
    .addItem('Скинути дані', 'resetData')
    .addToUi();
}

/**
 * Відкриває sidebar
 */
function openSidebar() {
  var html = HtmlService.createTemplateFromFile('webapp')
    .evaluate()
    .setTitle('Генератор текстів')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Точка входу для Web App (standalone)
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('webapp');
  return template.evaluate()
    .setTitle('TextGen — Генератор контенту')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Підключає HTML-файл (для include)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
