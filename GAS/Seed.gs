// ===========================================
// Seed.gs — Демо-дані (PostgreSQL)
// ===========================================

function seedData() {
  // Очистити таблиці
  execSQL("DELETE FROM textgen.generated_texts");
  execSQL("DELETE FROM textgen.tasks");
  execSQL("DELETE FROM textgen.task_templates");
  execSQL("DELETE FROM textgen.clients");

  // Клієнти
  execSQL("INSERT INTO textgen.clients (id, name, website, niche, notes) VALUES (1, '220Volt', 'https://220volt.com.ua', 'Електроніка та побутова техніка', '')");
  execSQL("INSERT INTO textgen.clients (id, name, website, niche, notes) VALUES (2, 'Technolex', 'https://technolex.com.ua', 'Юридичні послуги', 'Важливо: юридична точність формулювань')");
  execSQL("INSERT INTO textgen.clients (id, name, website, niche, notes) VALUES (3, 'MedService', 'https://medservice.ua', 'Медичні послуги', 'Не давати медичних рекомендацій')");

  // Шаблони задач
  execSQL("INSERT INTO textgen.task_templates (id, name, description, client_ids, system_prompt, user_prompt, core_fields, flex_blocks, llm_provider, llm_model, options) VALUES (1, 'SEO-стаття для блогу', 'Генерація експертних SEO-статей для блогу.', '[1]'::jsonb, 'Ти — досвідчений SEO-копірайтер з 10-річним стажем.', 'Напиши SEO-статтю.\nURL: {{url}}\nАнкор: {{keywords}}\nТема: {{topic}}\nМова: {{language}}\nОбсяг: {{volume}} збп', '{\"url\":true,\"keywords\":true,\"topic\":true,\"language\":true,\"volume\":true}'::jsonb, '[{\"key\":\"h2_structure\",\"label\":\"Структура H2\",\"type\":\"repeatable\",\"enabled\":true},{\"key\":\"notes\",\"label\":\"Примітки\",\"type\":\"textarea\",\"enabled\":false}]'::jsonb, 'anthropic', 'Claude Sonnet', '{\"humanize\":true,\"uniqueness\":true,\"factcheck\":false,\"ai_detector\":true}'::jsonb)");

  execSQL("INSERT INTO textgen.task_templates (id, name, description, client_ids, system_prompt, user_prompt, core_fields, flex_blocks, llm_provider, llm_model, options) VALUES (2, 'Картка товару', 'Продаючий опис товару для інтернет-магазину.', '[1]'::jsonb, 'Ти — копірайтер для інтернет-магазинів.', 'Напиши опис товару.\nURL: {{url}}\nНазва: {{topic}}\nКлючові слова: {{keywords}}\nОбсяг: {{volume}} збп', '{\"url\":true,\"keywords\":true,\"topic\":true,\"language\":false,\"volume\":true}'::jsonb, '[{\"key\":\"notes\",\"label\":\"Примітки\",\"type\":\"textarea\",\"enabled\":false}]'::jsonb, 'openai', 'ChatGPT (GPT-4o)', '{\"humanize\":false,\"uniqueness\":true,\"factcheck\":false,\"ai_detector\":false}'::jsonb)");

  // Сбросить sequences
  execSQL("SELECT setval('textgen.clients_id_seq', (SELECT MAX(id) FROM textgen.clients))");
  execSQL("SELECT setval('textgen.task_templates_id_seq', (SELECT MAX(id) FROM textgen.task_templates))");

  return 'Демо-дані завантажено';
}

function resetData() {
  execSQL("DELETE FROM textgen.generated_texts");
  execSQL("DELETE FROM textgen.tasks");
  execSQL("DELETE FROM textgen.task_templates");
  execSQL("DELETE FROM textgen.clients");
  return 'Дані скинуто';
}
