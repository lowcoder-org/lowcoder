import { automatorColor } from "./AutomatorTheme";
import { useContext, useState } from "react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ArrowUpRight, Braces } from "lucide-react";
import styled from "styled-components";
import { EditorContext } from "comps/editorState";
import { preview } from "constants/routesURL";
import { trans } from "i18n";
import { AutomatorBuildCard } from "./AutomatorBuildCard";
import { AutomatorLanguageGuide } from "./AutomatorLanguageGuide";
import { readAutomatorBuildReport } from "./buildMessage";

const RecipeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 15px 17px;
  border: 1px solid #e5e5e5;
  border-radius: 13px;
  background: #fff;
  color: ${automatorColor.accent};
  cursor: pointer;
  text-align: left;
  .recipe-message-label {
    flex: 1;
    color: #434343;
    font-size: 13px;
    font-weight: 500;
  }
  small {
    display: block;
    color: #6b6b6b;
    font-size: 11px;
    font-weight: 400;
    margin-top: 3px;
  }
  &:hover {
    background: #fff;
    border-color: ${automatorColor.accentBorder};
  }
  &:focus-visible {
    outline: 2px solid ${automatorColor.accent};
    outline-offset: 2px;
  }
`;

export const AutomatorRecipeMessage: ToolCallMessagePartComponent = ({
  args,
  result,
}) => {
  const editor = useContext(EditorContext);
  const applicationId = editor?.rootComp.preloadId.replace(/^app-/, "") || "";
  const [open, setOpen] = useState(false);
  const recipe = Array.isArray((args as any)?.actions)
    ? (args as any).actions
    : [];
  const build = readAutomatorBuildReport(result, recipe, applicationId);
  return (
    <>
      {build ? (
        <AutomatorBuildCard
          build={build}
          onPreview={() => preview(applicationId)}
          onRecipe={() => setOpen(true)}
          autoScroll={false}
        />
      ) : (
        <RecipeButton type="button" onClick={() => setOpen(true)}>
          <Braces size={21} strokeWidth={1.5} />
          <span className="recipe-message-label">
            {trans("automator.language.json")}
            <small>
              {trans("automator.studio.recipeCount", { count: recipe.length })}
            </small>
          </span>
          <ArrowUpRight size={16} />
        </RecipeButton>
      )}
      {open && (
        <AutomatorLanguageGuide
          recipe={recipe}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
