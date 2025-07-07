import {
  clearMockWindow,
  clearStyleEval,
  ConstructorToComp,
  evalFunc,
  evalStyle,
} from "lowcoder-core";
import { CodeTextControl } from "comps/controls/codeTextControl";
import SimpleStringControl from "comps/controls/simpleStringControl";
import { MultiCompBuilder, withPropertyViewFn } from "comps/generators";
import { list } from "comps/generators/list";
import { ScrollBar } from "lowcoder-design";
import { EmptyContent } from "components/EmptyContent";
import React, { useEffect } from "react";
import { trans } from "i18n";
import log from "loglevel";
import { JSLibraryTree } from "components/JSLibraryTree";
import { fetchJSLibrary } from "util/jsLibraryUtils";
import { RunAndClearable } from "./types";

export class LibsCompBase extends list(SimpleStringControl) implements RunAndClearable<string[]> {
  success: Record<string, boolean> = {};
  globalVars: Record<string, string[]> = {};
  externalLibs: string[] = [];
  runInHost: boolean = false;

  getAllLibs() {
    return this.externalLibs.concat(this.getView().map((i) => i.getView()));
  }

  async loadScript(url: string) {
    if (this.success[url]) {
      return;
    }
    return fetchJSLibrary(url).then((code) => {
      evalFunc(
        code,
        {},
        {},
        {
          scope: "function",
          disableLimit: this.runInHost,
          onSetGlobalVars: (v: string) => {
            this.globalVars[url] = this.globalVars[url] || [];
            if (!this.globalVars[url].includes(v)) {
              this.globalVars[url].push(v);
            }
          },
        }
      );
      this.success[url] = true;
    });
  }

  async loadAllLibs() {
    const scriptRunners = this.getAllLibs().map((url) =>
      this.loadScript(url).catch((e) => {
        log.warn(e);
      })
    );

    try {
      await Promise.all(scriptRunners);
    } catch (e) {
      log.warn("load preload libs error:", e);
    }
  }

  async run(id: string, externalLibs: string[] = [], runInHost: boolean = false) {
    this.externalLibs = externalLibs;
    this.runInHost = runInHost;
    return this.loadAllLibs();
  }

  async clear(): Promise<any> {
    clearMockWindow();
  }
}

export const LibsComp = withPropertyViewFn(LibsCompBase, (comp) => {
  useEffect(() => {
    comp.loadAllLibs();
  }, [comp.getView().length]);
  return (
    <ScrollBar style={{ height: "295px" }}>
      {comp.getAllLibs().length === 0 && (
        <EmptyContent text={trans("preLoad.jsLibraryEmptyContent")} style={{ margin: "0 16px" }} />
      )}
      <JSLibraryTree
        mode={"column"}
        libs={comp
          .getView()
          .map((i) => ({
            url: i.getView(),
            deletable: true,
            exportedAs: comp.globalVars[i.getView()]?.[0],
          }))
          .concat(
            comp.externalLibs.map((l) => ({
              url: l,
              deletable: false,
              exportedAs: comp.globalVars[l]?.[0],
            }))
          )}
        onDelete={(idx) => {
          comp.dispatch(comp.deleteAction(idx));
        }}
      />
    </ScrollBar>
  );
});

export class ScriptComp extends CodeTextControl implements RunAndClearable<string> {
  runInHost: boolean = false;

  runPreloadScript() {
    const code = this.getView();
    if (!code) {
      return;
    }
    // Import runScript from utils to avoid circular dependency
    const { runScript } = require("./utils");
    runScript(code, this.runInHost);
  }

  async run(id: string, externalScript: string = "", runInHost: boolean = false) {
    this.runInHost = runInHost;
    if (externalScript) {
      const { runScript } = require("./utils");
      runScript(externalScript, runInHost);
    }
    this.runPreloadScript();
  }

  async clear(): Promise<any> {
    clearMockWindow();
  }
}

export class CSSComp extends CodeTextControl implements RunAndClearable<string> {
  id = "";
  externalCSS: string = "";

  async applyAllCSS() {
    const css = this.getView();
    evalStyle(this.id, [this.externalCSS, css]);
  }

  async run(id: string, externalCSS: string = "") {
    this.id = id;
    this.externalCSS = externalCSS;
    return this.applyAllCSS();
  }

  async clear() {
    clearStyleEval(this.id);
  }
}

export class GlobalCSSComp extends CodeTextControl implements RunAndClearable<string> {
  id = "";
  externalCSS: string = "";

  async applyAllCSS() {
    const css = this.getView();
    evalStyle(this.id, [this.externalCSS, css], true);
  }

  async run(id: string, externalCSS: string = "") {
    this.id = id;
    this.externalCSS = externalCSS;
    return this.applyAllCSS();
  }

  async clear() {
    clearStyleEval(this.id);
  }
} 