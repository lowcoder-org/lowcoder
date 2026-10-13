import type { DefaultTheme } from "styled-components";

type AdminTheme = DefaultTheme & { admin?: { variables: Record<string, string> } };

// React theme context survives portals; inherited DOM variables do not.
// Outside the Admin shell this contributes no styles.
export const adminThemeVariables = ({ theme }: { theme: DefaultTheme }) =>
  (theme as AdminTheme).admin?.variables;
