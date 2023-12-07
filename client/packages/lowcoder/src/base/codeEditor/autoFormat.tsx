import { CodeType } from "lowcoder-core";
import { relaxedJSONToJSON } from "lowcoder-core";
import { getDynamicStringSegments, isDynamicSegment } from "lowcoder-core";
import { format as formatSQL } from "sql-formatter";
import { Language } from "./codeEditorTypes";

export async function cssFormatter(text: string) {
  const prettier = await require("prettier/standalone");
  const parserPlugin = await require("prettier/parser-postcss");
  return (await prettier.format(text, { parser: "css", plugins: [parserPlugin], semi: false })).trim();
}

export async function htmlFormatter(text: string) {
  const prettier = await require("prettier/standalone");
  const parserPlugin = await require("prettier/parser-html");
  return (await prettier.format(text, { parser: "html", plugins: [parserPlugin], semi: false })).trim();
}

async function getJavascriptFormatter() {
  const prettier = await require("prettier/standalone");
  const parserBabel = await require("prettier/parser-babel");
  return async (text: string) =>
    (await prettier.format(text, { parser: "babel", plugins: [parserBabel], semi: false })).trim();
}

export async function getJsonFormatter() {
  const prettier = await require("prettier/standalone");
  const parserBabel = await require("prettier/parser-babel");
  return async (text: string) => (await prettier.format(text, { parser: "json", plugins: [parserBabel] })).trim();
}

async function formatJsSegment(formatter: (text: string) => Promise<string>, script: string): Promise<string> {
  try {
    const s = await formatter(script);
    return s.startsWith(";") ? s.slice(1) : s;
  } catch (e1) {
    try {
      const s = await formatter(`return (${script}\n);`); // same as evalScript()
      return s.startsWith("return ") ? s.slice(7) : s;
    } catch (e2) {
      throw e1;
    }
  }
}

async function getJsSegmentFormatter() {
  const formatter = await getJavascriptFormatter();
  return async (segment: string) => {
    return "{{" + formatJsSegment(formatter, segment.slice(2, -2)) + "}}";
  };
}

export async function formatStringWithJsSnippets(text: string): Promise<string> {
  const jsSegmentFormatter = await getJsSegmentFormatter();
  return getDynamicStringSegments(text)
    .map((s) => (isDynamicSegment(s) ? jsSegmentFormatter(s) : s))
    .join("");
}

export async function formatSqlWithJsSnippets(text: string) {
  if (!text) {
    return "";
  }
  const jsSegmentFormatter = await getJsSegmentFormatter();
  const jsSegments: string[] = [];
  let newText = getDynamicStringSegments(text)
    .map((segment) => {
      // transform Javascript code to avoid auto formatting
      if (isDynamicSegment(segment)) {
        jsSegments.push(segment);
        return "{ { " + (jsSegments.length - 1) + " } }";
      }
      return segment;
    })
    .join("");
  newText = formatSQL(newText);
  if (jsSegments.length === 0) {
    return newText;
  }
  const replacements: Promise<string>[] = [];
  const replacedText = newText.replace(/{ { \d+ } }/g, (s) => {
    const index = parseInt(s.slice(4, -4));
    if (index >= 0 && index < jsSegments.length) {
      const replacement = jsSegmentFormatter(jsSegments[index]);
      replacements.push(replacement);
      return s; // Return the original placeholder for now
    }
    return s;
  });

  const formattedSegments = await Promise.all(replacements);
  let finalText = replacedText;
  formattedSegments.forEach((formattedSegment, index) => {
    finalText = finalText.replace(`{ { ${index} } }`, formattedSegment);
  });

  return finalText;
}


async function formatJsonWithJsSnippetsImpl(text: string) {
  if (!text || text.trim().length === 0) {
    return "";
  }
  const jsonFormatter = await getJsonFormatter();
  const jsSegmentFormatter = await getJsSegmentFormatter();
  const segments = getDynamicStringSegments(text);
  // replace the original "{{...}}" as relaxed-json adaptive "\{\{ + ${index} + \}\}"
  const indexedRelaxedJsonString = segments
    .map((s, i) => (isDynamicSegment(s) ? "\\{\\{" + i + "\\}\\}" : s))
    .join("");
  // transform to standard JSON strings with RELAXED JSON
  // here is a trick: if "\{\{ \}\}" is in quotes, keep it unchanged; otherwise transform to "{{ }}"
  const indexedJsonString = relaxedJSONToJSON(indexedRelaxedJsonString, false);
  // in case that format will transform "\{" in quotes to "{", here handles this
  const formattedJSON = jsonFormatter(
    indexedJsonString.replace(
      /\\{\\{\d+\\}\\}/g,
      (s) => "\\\\{\\\\{" + s.slice(4, -4) + "\\\\}\\\\}"
    )
  );
  // here are 3 cases.
  // - when the original "{{}}" is not in quotes as the single key or value, the whole "{{ index }}" should be replaced.
  // - when the original "{{}}" is for concatenating strings, "{{ index }}" or "\\{\\{ index \\}\\}" should be replaced.
  const formattedSegments = await Promise.all(segments.map(async (segment) => {
    if (isDynamicSegment(segment)) {
      const formattedSegment = await jsSegmentFormatter(segment);
      return formattedSegment;
    }
    return segment;
  }));
  
  return (await formattedJSON).replace(/("{{\d+}}")|({{\d+}})|(\\\\{\\\\{\d+\\\\}\\\\})/g, (s: string) => {
    const index = parseInt(
      s.startsWith('"{{') ? s.slice(3, -3) : s.startsWith("{{") ? s.slice(2, -2) : s.slice(6, -6)
    );
    if (index >= 0 && index < formattedSegments.length) {
      return formattedSegments[index];
    }
    return s;
  });
}

export async function formatJsonWithJsSnippets(text: string): Promise<string> {
  try {
    const ret = await formatJsonWithJsSnippetsImpl(text);
    return ret;
  } catch (e) {
    return formatStringWithJsSnippets(text);
  }
}

export function getFormatter(
  language: Language,
  codeType?: CodeType
): ((s: string) => Promise<string>) | undefined {
  if (codeType) {
    switch (codeType) {
      case "JSON":
      case "PureJSON":
        return formatJsonWithJsSnippets;
      case "Function":
        return (text: string) => getJavascriptFormatter().then((f) => f(text));
    }
  } else {
    switch (language) {
      case "css":
        return cssFormatter;
      case "html":
        return htmlFormatter;
      case "sql":
        return formatSqlWithJsSnippets;
      case "javascript":
        return formatStringWithJsSnippets;
    }
  }
}
