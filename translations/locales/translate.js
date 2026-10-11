import fs from 'fs';
import axios from 'axios';
import path from 'path';

// Function to load a language file dynamically
const loadLanguageFile = async (langFile) => {
    const filePath = path.resolve(langFile);
    const langModule = await import(filePath);
    return langModule;
};

// Helper function to recursively generate the object structure
const generateObjectString = (source, target, parentPath = 'en') => {
    let result = '{\n';
    for (const key in source) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result += `  "${key}": {\n    ...${parentPath}.${key},\n`;
            result += generateObjectString(source[key], target[key] || {}, `${parentPath}.${key}`).slice(1, -1);
            result += '  },\n';
        } else {
            const translatedValue = target[key] ? JSON.stringify(target[key]) : JSON.stringify(source[key]);
            result += `  "${key}": ${translatedValue},\n`;
        }
    }
    result += '}';
    return result;
};

// Function to save the updated language file
const saveUpdatedFile = (lang, updatedContent, originalContent) => {
    const filePath = path.join(process.cwd(), `${lang}-updated.js`);
    const fileContent = `
import { en } from "./en.js";
export const ${lang} = {
    ...en,
    ${generateObjectString(originalContent, updatedContent).slice(1, -1)}
};
`;
    fs.writeFileSync(filePath, fileContent);
    console.log(`Updated file saved as ${lang}-updated.js`);
};

// Function to replace placeholders with markers before translation
const protectPlaceholders = (text) => {
    const placeholders = [];
    const protectedText = text.replace(/{[^}]+}/g, (match) => {
        placeholders.push(match);
        return `___PLACEHOLDER${placeholders.length - 1}___`;
    });
    return { protectedText, placeholders };
};

// Function to restore placeholders after translation
const restorePlaceholders = (translatedText, placeholders) => {
    return translatedText.replace(/___PLACEHOLDER(\d+)___/g, (_, index) => placeholders[index]);
};

// DeepL Translation function with retry logic and placeholder protection
const translateText = async (text, targetLang, deeplApiKey, retryCount = 3) => {
    const { protectedText, placeholders } = protectPlaceholders(text);
    
    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.deepl.com/v2/translate',
            params: {
                auth_key: deeplApiKey,
                text: protectedText,
                target_lang: targetLang.toUpperCase(),
            },
            timeout: 10000  // Timeout of 10 seconds
        });

        const translatedText = response.data.translations[0].text;
        return restorePlaceholders(translatedText, placeholders);
    } catch (error) {
        if (retryCount > 0) {
            console.log(`Retrying translation for text: "${text}". Retries left: ${retryCount}`);
            return translateText(text, targetLang, deeplApiKey, retryCount - 1);
        } else {
            console.error(`Failed to translate text: "${text}" after multiple attempts`);
            throw error;
        }
    }
};

// Recursive function to find and translate missing keys
const findMissingTranslations = async (enData, targetData, targetLang, deeplApiKey) => {
    const updatedData = { ...targetData };

    const recursiveCheck = async (source, target) => {
        for (const key in source) {
            if (typeof source[key] === 'object') {
                if (!target[key]) target[key] = {};
                await recursiveCheck(source[key], target[key]);
            } else {
                if (!target[key] || target[key] === source[key]) {
                    console.log(`Translating key: ${key}`);
                    const translatedText = await translateText(source[key], targetLang, deeplApiKey);
                    target[key] = translatedText;
                }
            }
        }
    };

    await recursiveCheck(enData, updatedData);
    return updatedData;
};

// Main function to run the translation process
const translateMissingKeys = async (targetLang, langFile, deeplApiKey) => {

    // Load the English and target language files
    const enModule = await loadLanguageFile('./en.js');
    const targetModule = await loadLanguageFile(langFile);

    const enData = enModule.en;
    const targetData = targetModule[targetLang];

    // Find missing translations and translate them
    const updatedData = await findMissingTranslations(enData, targetData, targetLang, deeplApiKey);

    // Save the updated target language file with proper structure
    saveUpdatedFile(targetLang, updatedData, enData);
};

// Run the script with a given language argument and filename argument
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Please provide a target language code and a file name, e.g., node translate.js de ./de.js');
    process.exit(1);
}

const targetLang = args[0];
const langFile = args[1];
const deeplApiKey = args[2];
translateMissingKeys(targetLang, langFile, deeplApiKey);
