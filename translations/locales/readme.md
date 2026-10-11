# Lowcoder Translation Script

This script is used to automatically update translation files for Lowcoder using DeepL as translation provider.
It allows you to keep your non-English translation files in sync with the master English translation, and automatically fill any missing keys.

---

## Translation Files Structure

The translation files follow a very simple ES Module export format.

**English file (`en.js` — master file):**

```javascript
export const en = {
  "productName": "Lowcoder",
  "productDesc": "Create software applications for your company and customers with minimal coding experience. Lowcoder is an excellent alternative to Retool, Appsmith, and Tooljet.",
  "create": "Create",
  "api": {
    "publishSuccess": "Published Successfully",
    "recoverFailed": "Recovery Failed",
    "needUpdate": "Your current version is outdated. Please upgrade to the latest version."
  },
  ...
};
```

**Target language files (`de.js`, `fr.js`, etc):**

```javascript
export const de = {
  ...en,
  "productName": "Lowcoder",
  "productDesc": "",          // missing translation will be auto-filled
  "notSupportedBrowser": "Ihr aktueller Browser ist möglicherweise nicht kompatibel...",
  "create": "Erstellen",
  "api": {
    ...en.api,

  "publishSuccess": "Erfolgreich veröffentlicht",
  "recoverFailed": "Wiederherstellung fehlgeschlagen",
  "needUpdate": "Deine aktuelle Version ist veraltet. Bitte aktualisiere auf die neueste Version.",
  },
  ...
};
```

> Missing or empty keys will be automatically translated and filled.

---

## How The Script Works

* Uses `en.js` as master translation source.
* Loads the target language file (e.g. `de.js`).
* Recursively checks all keys.
* For any missing keys or empty values, uses **DeepL API** to translate from English.
* Safely preserves placeholders (e.g. `{name}`, `{count}`) during translation.
* Saves the updated file as `de-updated.js` (non-destructive overwrite).

---

## Folder Structure

All translation files and the script should be located inside:

```
/translations/locales/
    ├── en.js
    ├── de.js
    ├── fr.js
    └── translate.js
```

---

## 🚀 Running The Script

You must execute the script from inside the `/translations/locales/` directory.

```bash
cd translations/locales
node translate.js <targetLang> <targetFile> <deeplApiKey>
```

### Example:

```bash
node translate.js de ./de.js YOUR_DEEPL_API_KEY
```

Where:

* `de` — The target language code (ISO 639-1, e.g. `de`, `fr`, `es`, `it`, etc.)
* `./de.js` — Path to the existing target translation file.
* `YOUR_DEEPL_API_KEY` — Your personal DeepL API key.

---

## DeepL API Key

You need a valid DeepL API Key to perform automatic translations.

* You can get a free developer account at [https://www.deepl.com/pro-api](https://www.deepl.com/pro-api)
* Store your key securely.

---

## Notes

* The script preserves all existing translations.
* Only missing or empty fields will be translated.
* Placeholders inside curly braces (e.g. `{count}`, `{userName}`) are automatically detected and protected.
* Output will be saved into a new file `de-updated.js` to avoid overwriting your existing file directly.

---

## Typical Workflow

1️⃣ Start by maintaining your master file `en.js` with new keys.
2️⃣ Update (or create) your target language file (e.g. `de.js`), even if empty.
3️⃣ Run the script to automatically fill in missing keys.

```bash
node translate.js de ./de.js YOUR_DEEPL_API_KEY
```

4️⃣ Review and manually adjust translations if needed.
5️⃣ Rename or replace `de-updated.js` into `de.js` after verification.

---

Happy Translating! 🌍
