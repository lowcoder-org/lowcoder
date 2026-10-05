import { MultiCompBuilder } from "comps/generators";
import { BaseSection, PlusIcon } from "lowcoder-design";
import React from "react";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { trans } from "i18n";
import { JSLibraryModal } from "components/JSLibraryModal";
import { LibsComp, ScriptComp, CSSComp, GlobalCSSComp } from "./components";
import { PreloadConfigModal } from "./preloadConfigModal";
import { AddJSLibraryButton, JSLibraryWrapper } from "./styled";
import { ActionInputSection } from "./actionInputSection";

const childrenMap = {
  libs: LibsComp,
  script: ScriptComp,
  css: CSSComp,
  globalCSS: GlobalCSSComp,
};

const PreloadCompBase = new MultiCompBuilder(childrenMap, () => {})
  .setPropertyViewFn((children) => <PreloadConfigModal {...children} />)
  .build();

export class PreloadComp extends PreloadCompBase {
  async clear() {
    return Promise.allSettled(Object.values(this.children).map((i) => i.clear()));
  }

  async run(id: string) {
    const { orgCommonSettings = {} } = getGlobalSettings();
    const { preloadCSS, preloadGlobalCSS, preloadJavaScript, preloadLibs, runJavaScriptInHost } = orgCommonSettings;
    await this.children.css.run(id, preloadCSS || "");
    await this.children.globalCSS.run('body', preloadGlobalCSS || "");
    await this.children.libs.run(id, preloadLibs || [], !!runJavaScriptInHost);
    await this.children.script.run(id, preloadJavaScript || "", !!runJavaScriptInHost);
  }

  getJSLibraryPropertyView() {
    const libs = this.children.libs;
    return (
      <>
        <JSLibraryWrapper>
          <BaseSection
            name={trans("preLoad.jsLibrary")}
            width={288}
            noMargin
            style={{
              borderTop: "1px solid #e1e3eb",
              backgroundColor: "#fff",
            }}
            additionalButton={
              <AddJSLibraryButton>
                <JSLibraryModal
                  runInHost={libs.runInHost}
                  trigger={<PlusIcon height={"46px"} />}
                  onCheck={(url) => !libs.getAllLibs().includes(url)}
                  onLoad={(url) => libs.loadScript(url)}
                  onSuccess={(url) => libs.dispatch(libs.pushAction(url))}
                />
              </AddJSLibraryButton>
            }
          >
            {this.children.libs.getPropertyView()}
          </BaseSection>
        </JSLibraryWrapper>
        <ActionInputSection />
      </>
    );
  }
} 