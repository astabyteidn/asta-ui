import "server-only";
import { createHighlighterCore, type HighlighterCore, type ThemeRegistration } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Build-time highlighting for ui.astabyte.com: pages are static, so no highlighter reaches the browser.
const theme: ThemeRegistration = {
  name: "astabyte",
  type: "dark",
  colors: { "editor.background": "#00000000", "editor.foreground": "#cfcfc8" },
  settings: [
    { settings: { foreground: "#cfcfc8" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#5f615b", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.operator.new", "keyword.control"], settings: { foreground: "#8aa4ff" } },
    { scope: ["string", "string.template", "punctuation.definition.string"], settings: { foreground: "#e7d49a" } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: "#f2a65a" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#f4f4ef" } },
    { scope: ["entity.name.type", "support.type", "entity.name.tag", "support.class.component", "entity.other.inherited-class"], settings: { foreground: "#8fd3c1" } },
    { scope: ["entity.other.attribute-name", "support.type.property-name", "meta.object-literal.key"], settings: { foreground: "#b4b8ad" } },
    { scope: ["variable.parameter"], settings: { foreground: "#e9e9e4", fontStyle: "italic" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#7b7d76" } },
    { scope: ["variable.other.constant", "variable.other.readwrite.alias"], settings: { foreground: "#e9e9e4" } },
  ],
};

let hl: Promise<HighlighterCore> | null = null;
const get = () =>
  (hl ??= createHighlighterCore({
    themes: [theme],
    langs: [import("@shikijs/langs/tsx"), import("@shikijs/langs/css")],
    engine: createJavaScriptRegexEngine(),
  }));

export async function highlight(code: string, file: string): Promise<string> {
  const lang = file.endsWith(".css") ? "css" : "tsx";
  return (await get()).codeToHtml(code, { lang, theme: "astabyte" });
}
