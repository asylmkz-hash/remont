# Ремонт — учёт

Сайт: https://asylmkz-hash.github.io/remont/ (GitHub Pages, ветка `main`, корень).

## Как устроено
- **Одна страница** `index.html` — собирается из `src/app.html` (всё приложение) и `src/fbshim.js` (подключение к Firebase: вход, база, файлы).
- **База:** Firebase-проект `remont-uchet`, Firestore, ID базы **`default`** (без скобок; бесплатный тариф Spark, одна база).
- **Вход:** владелец — Google (`asyl.m.kz@gmail.com`, задано в `src/fbshim.js` и `firestore.rules`); строители и поставщики — по личным ссылкам `#b=…` / `#s=…` (анонимный вход + привязка к ссылке).
- **Правила доступа:** `firestore.rules` — после изменения вставить в Firebase → Firestore → база `default` → Rules → Publish.
- **Офлайн:** `sw.js` кэширует сайт; Firestore хранит данные на устройстве и досылает при появлении связи.
- `fbsdk.js` — собранный Firebase SDK (`src/fbsdk-entry.js`, версии в `src/package.json`), `lib/` — библиотеки для Excel/Word/PDF/ZIP.

## Как вносить изменения
1. Править `src/app.html` (и при необходимости `src/fbshim.js`), увеличить `VER` в `src/app.html`.
2. `python3 src/build.py` — пересобирает `index.html` и `sw.js`.
3. Закоммитить и отправить в `main`. Через 1–2 минуты сайт обновится; на телефонах — при следующем открытии (иногда нужно открыть дважды).

Данные в базе при обновлении кода не меняются. Перед крупными изменениями — «Ещё» → «Скачать полную копию (.json)».
