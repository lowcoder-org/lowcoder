import fs from "node:fs";
import path, { dirname } from "node:path";
import axios from "axios";

const translationsDir = './packages/lowcoder/src/i18n/locales'; // Directory where language files are stored
const masterLang = 'en'; // Master language code
const DEEPL_API_URL = 'https://api.deepl.com/v2/translate';

// Function to send a request to the DeepL API for translation
async function translateText(texts, context, sourceLang = 'en', targetLang = 'de', apiKey) {
    try {
        const requestBody = {
            text: texts,
            source_lang: sourceLang,
            target_lang: targetLang,
            context: context,
            split_sentences: '1',
            preserve_formatting: true,
            formality: 'default',
            outline_detection: true
        };

        const response = await axios.post(DEEPL_API_URL, requestBody, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.translations.map((translation) => translation.text);
    } catch (error) {
        console.error('Translation error:', error);
        return [];
    }
}

// Recursive function to translate and update untranslated keys
async function translateNestedKeys(object, targetObject, context = '', lang, apiKey) {
    for (const key in object) {
        if (typeof object[key] === 'string' && (!targetObject[key] || targetObject[key] === object[key])) {
            console.log(`Translating key: ${context}.${key}`);
            const translatedTexts = await translateText([object[key]], `${context}.${key}`, masterLang, lang, apiKey);
            targetObject[key] = translatedTexts[0];
        } else if (typeof object[key] === 'object' && object[key] !== null && !(object[key] instanceof Array)) {
            targetObject[key] = targetObject[key] || {};
            await translateNestedKeys(object[key], targetObject[key], context ? `${context}.${key}` : key, lang, apiKey);
        }
    }
}

// Main function to load translation files and start the translation process
async function translateAndUpdate(lang, apiKey) {
    const sourcePath = path.join(`${masterLang}.ts`);
    const targetPath = path.join(`${lang}.ts`);

    process.chdir(translationsDir);

    console.log("Current working directory:", process.cwd());
    console.log(`Translating from ${sourcePath} to ${targetPath}...`);

    try {
        // Import source and target asynchronously
        const sourceModule = await import(sourcePath);
        const targetModule = await import(targetPath);

        // Extract the exported objects assuming default exports
        const source = sourceModule[masterLang];
        const target = targetModule[lang] || {};

        console.log(`Source productDesc: ${target.productDesc},`);

        // await translateNestedKeys(source, target, '', lang, apiKey);
        // fs.writeFileSync(targetPath, `export const ${lang}: typeof ${masterLang} = ${JSON.stringify(target, null, 2)};`, 'utf8');
        console.log(`Updated ${lang} translation file.`);

    } catch (error) {
        console.error('Error loading translation files or translating:', error);
    }
}

// Get language code and API key from the command line arguments
const langCode = process.argv[2] || 'de'; // Default to 'de' if no argument provided
const apiKey = process.argv[3]; // Use the provided API key

console.log(`Translating to ${langCode} with API key: ${apiKey}`);

// Uncomment the line below to activate translation when you run the script
translateAndUpdate(langCode, apiKey).catch(console.error);
