import React, { useContext, useState } from "react";
import { Tabs } from "components/Tabs";
import { CustomModal } from "lowcoder-design";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { trans } from "i18n";
import { RecordConstructorToComp } from "lowcoder-core";
import { TabKey } from "./types";
import { JavaScriptTabPane, CSSTabPane } from "./tabPanes";
import { ScriptComp, CSSComp, GlobalCSSComp } from "./components";

type ChildrenInstance = RecordConstructorToComp<{
  libs: any;
  script: typeof ScriptComp;
  css: typeof CSSComp;
  globalCSS: typeof GlobalCSSComp;
}>;

export function PreloadConfigModal(props: ChildrenInstance) {
  const [activeKey, setActiveKey] = useState(TabKey.JavaScript);
  const { showScriptsAndStyleModal, changeExternalState } = useContext(ExternalEditorContext);
  
  const tabItems = [
    {
      key: TabKey.JavaScript,
      label: 'JavaScript',
      children: <JavaScriptTabPane comp={props.script} />
    },
    {
      key: TabKey.CSS,
      label: 'CSS',
      children: <CSSTabPane comp={props.css} />
    },
    {
      key: TabKey.GLOBAL_CSS,
      label: 'Global CSS',
      children: <CSSTabPane comp={props.globalCSS} isGlobal />
    },
  ];

  return (
    <CustomModal
      draggable
      mask={activeKey !== TabKey.CSS}
      open={showScriptsAndStyleModal}
      title={trans("preLoad.scriptsAndStyles")}
      destroyOnHidden
      onCancel={() => changeExternalState?.({ showScriptsAndStyleModal: false })}
      showOkButton={false}
      showCancelButton={false}
      width="600px"
    >
      <Tabs
        onChange={(k) => setActiveKey(k as TabKey)}
        style={{ marginBottom: 8, marginTop: 4 }}
        activeKey={activeKey}
        items={tabItems}
      />
    </CustomModal>
  );
} 