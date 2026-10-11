"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGoogleFormId = extractGoogleFormId;
exports.fetchGoogleForm = fetchGoogleForm;
exports.toCollabFormView = toCollabFormView;
exports.updateGoogleFormInfo = updateGoogleFormInfo;
const node_fetch_1 = __importDefault(require("node-fetch"));
const FORMS_API = "https://forms.googleapis.com/v1/forms";
function extractGoogleFormId(rawUrl) {
    const value = (rawUrl ?? "").trim();
    if (!value)
        throw new Error("googleFormUrl is required");
    let url;
    try {
        url = new URL(value);
    }
    catch {
        // Treat bare form IDs as valid.
        if (/^[a-zA-Z0-9_-]{10,}$/.test(value))
            return value;
        throw new Error("googleFormUrl must be a valid URL or form id");
    }
    if (url.hostname !== "docs.google.com" || !url.pathname.startsWith("/forms/")) {
        throw new Error("googleFormUrl must be an https://docs.google.com/forms URL");
    }
    const published = url.pathname.match(/\/forms\/d\/e\/([^/]+)/i);
    if (published?.[1]) {
        throw new Error("Published responder IDs (forms/d/e/...) cannot be used with Forms API. " +
            "Pass the Drive/edit form URL or form id from Google Drive (forms/d/FORM_ID/edit).");
    }
    const drive = url.pathname.match(/\/forms\/d\/([^/]+)/i);
    if (drive?.[1] && drive[1] !== "e")
        return drive[1];
    throw new Error("Could not extract Google Form id from googleFormUrl");
}
async function fetchGoogleForm(formId, accessToken) {
    const response = await (0, node_fetch_1.default)(`${FORMS_API}/${encodeURIComponent(formId)}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
        },
    });
    const text = await response.text();
    if (!response.ok) {
        let detail = text;
        try {
            const parsed = JSON.parse(text);
            detail = parsed.error?.message || text;
        }
        catch {
            // keep raw text
        }
        throw new Error(`Google Forms API error (${response.status}): ${detail}. ` +
            "Ensure the OAuth token includes the forms.googleapis.com scope " +
            "(https://www.googleapis.com/auth/forms.body or forms.body.readonly).");
    }
    return JSON.parse(text);
}
function toCollabFormView(form) {
    const questions = [];
    for (const item of form.items ?? []) {
        const question = item.questionItem?.question;
        if (!question?.questionId)
            continue;
        let type = "unknown";
        let options = [];
        let scaleLow;
        let scaleHigh;
        if (question.textQuestion) {
            type = "paragraph" in question.textQuestion && question.textQuestion.paragraph ? "paragraph" : "text";
            // Forms API uses textQuestion.paragraph boolean
            if (question.textQuestion.paragraph)
                type = "paragraph";
            else
                type = "text";
        }
        else if (question.choiceQuestion) {
            const choiceType = (question.choiceQuestion.type || "").toUpperCase();
            type = choiceType === "CHECKBOX" ? "checkbox" : "radio";
            options = (question.choiceQuestion.options ?? []).map((option) => option.value).filter(Boolean);
        }
        else if (question.scaleQuestion) {
            type = "scale";
            scaleLow = question.scaleQuestion.low ?? 1;
            scaleHigh = question.scaleQuestion.high ?? 5;
        }
        else if (question.dateQuestion) {
            type = "date";
        }
        else if (question.timeQuestion) {
            type = "time";
        }
        questions.push({
            itemId: item.itemId,
            questionId: question.questionId,
            title: item.title || "Untitled question",
            description: item.description || "",
            required: Boolean(question.required),
            type,
            options,
            scaleLow,
            scaleHigh,
        });
    }
    return {
        formId: form.formId,
        title: form.info?.title || form.info?.documentTitle || "Untitled form",
        description: form.info?.description || "",
        responderUri: form.responderUri || "",
        questions,
    };
}
async function updateGoogleFormInfo(formId, accessToken, info) {
    const update = {};
    const mask = [];
    if (typeof info.title === "string") {
        update.title = info.title;
        mask.push("title");
    }
    if (typeof info.description === "string") {
        update.description = info.description;
        mask.push("description");
    }
    if (mask.length === 0)
        return;
    const response = await (0, node_fetch_1.default)(`${FORMS_API}/${encodeURIComponent(formId)}:batchUpdate`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            requests: [
                {
                    updateFormInfo: {
                        info: update,
                        updateMask: mask.join(","),
                    },
                },
            ],
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to update Google Form (${response.status}): ${text}`);
    }
}
