// ===========================================
// Code.gs - Точка входа, роутинг, меню
// ===========================================

/**
 * Создает меню в Google Sheets (если используется как add-on)
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SEO-тексты')
    .addItem('Открыть панель', 'openSidebar')
    .addItem('Заполнить демо-данные', 'seedData')
    .addItem('Сбросить данные', 'resetData')
    .addToUi();
}

/**
 * Открывает sidebar
 */
function openSidebar() {
  var html = HtmlService.createTemplateFromFile('webapp')
    .evaluate()
    .setTitle('SEO-тексты')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Точка входа для Web App (standalone)
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('webapp');
  return template.evaluate()
    .setTitle('SEO-тексты - Генератор контента')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Подключает HTML-файл (для include)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
