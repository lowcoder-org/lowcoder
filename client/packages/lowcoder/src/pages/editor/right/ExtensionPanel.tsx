import ModulePanel from "./ModulePanel";
import PluginPanel from "./PluginPanel";
import TemplatePanel from "./TemplatePanel";
import { RightPanelContentWrapper } from "./styledComponent";

export default function ExtensionPanel() {
  return (
    <RightPanelContentWrapper>
      <ModulePanel />
      <TemplatePanel />
      <PluginPanel />
    </RightPanelContentWrapper>
  );
}
