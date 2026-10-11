import { trans } from "i18n";
import type { AutomatorRecipeAction } from "./buildState";

export function exampleAutomatorRecipe(): AutomatorRecipeAction[] {
  return [{ action: "place_component", component: "text", component_name: "recipeTitle",
    layout: { x: 0, y: 0, w: 12, h: 4 },
    action_parameters: { text: `## ${trans("automator.language.exampleHeading")}`, type: "markdown" } }];
}

export function automatorRecipeQuery(recipe: AutomatorRecipeAction[], example = false) {
  const declarations = `const actions = ${JSON.stringify(recipe, null, 2)};`;
  const repeatGuard = example ? `\nif (typeof recipeTitle !== "undefined") {\n  actions[0].action = "set_properties";\n}\n` : "\n";
  return `${declarations}${repeatGuard}
const args = { actions };
return {
  role: "assistant",
  content: [{
    type: "tool-call",
    toolCallId: \`recipe_\${Date.now()}\`,
    toolName: "execute_automator_actions",
    args,
    argsText: JSON.stringify(args)
  }]
};`;
}
