import { automatorColor } from "./AutomatorTheme";
import { useState } from "react";
import { Button, Modal, Segmented, Space } from "antd";
import { Code2, Copy, Sparkles } from "lucide-react";
import copy from "copy-to-clipboard";
import styled from "styled-components";
import { trans } from "i18n";
import { ACTIONS_CATALOG } from "comps/comps/preLoadComp/actions/automator/actionsCatalog";
import { automatorActionLabel } from "./AutomatorBuildCard";
import type { AutomatorRecipeAction } from "./buildState";
import { automatorRecipeQuery, exampleAutomatorRecipe } from "./recipeExample";

const Guide = styled.div`
  color: #595959; line-height: 1.65;
  .recipe-intro { padding: 18px; border: 1px solid #e5e5e5; border-radius: 12px;
    background: #fafafa; }
  .recipe-intro svg { color: ${automatorColor.accent}; vertical-align: middle; margin-right: 7px; }
  h3 { color: #262626; font-size: 17px; margin: 0 0 8px; }
  p { margin: 8px 0; }
  .recipe-path { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 14px; font-size: 12px; }
  .recipe-path span { background: #fff; border: 1px solid #e5e5e5; border-radius: 7px; padding: 5px 10px; }
  .recipe-toolbar { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
  pre { margin: 12px 0; max-height: 260px; overflow: auto; padding: 16px; border-radius: 10px;
    background: #262626; color: #f5f5f5; font-size: 12px; line-height: 1.65; tab-size: 2; }
  ol { padding-left: 22px; margin: 12px 0; }
  li { margin-bottom: 8px; }
  .recipe-note { font-size: 12px; color: #6b6b6b; }
  details { margin-top: 18px; }
  summary { cursor: pointer; color: ${automatorColor.accent}; }
  .recipe-catalog { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .recipe-catalog div { background: #f5f5f5; padding: 8px 10px; border-radius: 6px; }
  .recipe-catalog code { display: block; font-size: 11px; overflow-wrap: anywhere; }
  @media (max-width: 600px) { .recipe-catalog { grid-template-columns: 1fr; } }
`;

export function AutomatorLanguageGuide({ onClose, recipe }: {
  onClose: () => void; recipe?: AutomatorRecipeAction[];
}) {
  const [view, setView] = useState<string>("json");
  const [copyStatus, setCopyStatus] = useState<"copied" | "copyFailed" | undefined>();
  const isExample = !recipe?.length;
  const actions = isExample ? exampleAutomatorRecipe() : recipe!;
  const source = view === "json" ? JSON.stringify({ actions }, null, 2) : automatorRecipeQuery(actions, isExample);
  return <Modal open title={trans("automator.language.title")} width={780} onCancel={onClose} keyboard={false}
    style={{ top: 32, maxWidth: "calc(100vw - 32px)" }} styles={{ body: { maxHeight: "calc(100dvh - 190px)", overflowY: "auto", paddingRight: 8 } }}
    footer={<Button type="primary" onClick={onClose}>{trans("automator.language.close")}</Button>}>
    <Guide>
      <div className="recipe-intro">
        <h3><Sparkles size={19} aria-hidden="true" />{trans("automator.language.headline")}</h3>
        <p>{trans("automator.language.intro")}</p>
        <div className="recipe-path"><span>{trans("automator.language.source")}</span><b aria-hidden="true">→</b>
          <span>{trans("automator.language.json")}</span><b aria-hidden="true">→</b><span>{trans("automator.language.result")}</span></div>
      </div>
      <p>{trans("automator.language.uses")}</p>
      <div className="recipe-toolbar">
        <Segmented aria-label={trans("automator.language.view")} value={view} onChange={value => { setView(String(value)); setCopyStatus(undefined); }} options={[
          { label: trans("automator.language.json"), value: "json" }, { label: trans("automator.language.javascript"), value: "javascript" },
        ]} />
        <Space><span role="status">{copyStatus && trans(`automator.language.${copyStatus}`)}</span>
          <Button icon={<Copy size={14} />} onClick={() => setCopyStatus(copy(source) ? "copied" : "copyFailed")}>{trans("automator.language.copy")}</Button></Space>
      </div>
      <p className="recipe-note">{trans(isExample ? "automator.language.exampleNote" : "automator.language.savedNote")}</p>
      <pre tabIndex={0} aria-label={trans("automator.language.code")}><code>{source}</code></pre>
      <h3><Code2 size={17} aria-hidden="true" /> {trans("automator.language.tryTitle")}</h3>
      <ol>
        <li>{trans("automator.language.step1")}</li>
        <li>{trans("automator.language.step2")}</li>
        <li>{trans("automator.language.step3")}</li>
      </ol>
      <p className="recipe-note">{trans("automator.language.runNote")}</p>
      <p className="recipe-note">{trans("automator.language.accessNote")}</p>
      <details><summary>{trans("automator.language.catalog")}</summary>
        <div className="recipe-catalog">{ACTIONS_CATALOG.map(entry => <div key={entry.action}>{automatorActionLabel(entry.action)}<code>{entry.action}</code></div>)}</div>
        <p className="recipe-note">{trans("automator.language.orderNote")}</p>
        <a href={trans("docUrls.githubAutomator")} target="_blank" rel="noopener noreferrer">{trans("automator.language.docs")}</a>
      </details>
    </Guide>
  </Modal>;
}
