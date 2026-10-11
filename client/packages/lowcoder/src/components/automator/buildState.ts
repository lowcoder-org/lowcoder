export type AutomatorRecipeAction = Record<string, any>;
export type AutomatorBuildStep = { action: string; name?: string; status: "done" | "error"; error?: string };
export type AutomatorBuildState = {
  phase: "planning" | "applying" | "complete" | "partial" | "failed";
  startedAt: number;
  finishedAt?: number;
  recipe: AutomatorRecipeAction[];
  steps: AutomatorBuildStep[];
  current?: AutomatorRecipeAction;
};

/** Count only actions that completed without throwing or reporting a handled error. */
export async function applyAutomatorRecipe(
  recipe: AutomatorRecipeAction[],
  execute: (action: AutomatorRecipeAction, reportError: (error: string) => void) => Promise<void>,
  beforeStep: () => void,
  onProgress: (steps: AutomatorBuildStep[], current?: AutomatorRecipeAction) => void,
  settle: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 500)),
) {
  const steps: AutomatorBuildStep[] = [];
  for (const item of recipe) {
    const action = item || {};
    beforeStep();
    onProgress([...steps], action);
    let error: string | undefined;
    try {
      await execute(action, detail => { error = detail; });
    } catch (cause) {
      error = typeof cause === "string" ? cause : (cause as Error)?.message || String(cause);
    }
    steps.push({ action: action.action, name: action.component_name || action.query_name,
      status: error === undefined ? "done" : "error", ...(error !== undefined && { error }) });
    onProgress([...steps]);
    // Allow dispatched editor changes to reach the next step's fresh editor snapshot.
    if (steps.length < recipe.length) await settle();
  }
  return steps;
}
