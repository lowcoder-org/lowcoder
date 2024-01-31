import { useParams } from "react-router-dom";
import styled from "styled-components";
// import "comps";
import { UICompType, UICompManifest, uiCompRegistry, UICompCategory } from "comps/uiCompRegistry";
import { CompPlayground } from "ide/CompPlayground";
import { Comp } from "lowcoder-core";
import { EditorContext, EditorState } from "comps/editorState";
import { RootComp } from "comps/comps/rootComp";
import { useEffect, useState } from "react";

type CompInfo = UICompManifest & { key: string };
const groups: Partial<Record<UICompCategory, CompInfo[]>> = {};

Object.entries(uiCompRegistry).forEach(([key, comp]) => {
  const cat = comp.categories.find((c) => c !== "dashboards");
  if (cat === undefined) {
    return;
  }
  if (!groups[cat]) {
    groups[cat] = [];
  }
  groups[cat]?.push({ ...comp, key });
});

const Wrapper = styled.div`
  display: flex;
  background-color: #f5f5f6;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  .header {
    height: 48px;
    padding-left: 16px;
    background-color: #2c2c2c;
    .brand {
      color: white;
      height: 100%;
      line-height: 48px;
      font-size: 18px;
      font-weight: 500;
    }
  }
  .content {
    flex: 1;
    display: flex;
    overflow: hidden;
    flex-direction: column;
  }
`;

const editorState = new EditorState(new RootComp({ value: {} }), () => {});

export default function ComponentPlayground() {
  window.__LOWCODER_ORG__ = {};

  const params = useParams<{ name: UICompType; dsl: string }>();
  const dsl = JSON.parse(decodeURIComponent(params.dsl || ""));
  const [compManifest, setCompManifest] = useState<UICompManifest>();

  useEffect(() => {
    const manifest = uiCompRegistry[params.name];
    if(!manifest.lazyLoad) {
      return setCompManifest(manifest);
    }

    async function loadComp() {
      const module = await import(`../../comps/${manifest.compPath}.tsx`);
      const comp = module[manifest.compName!];
;
      setCompManifest({
        ...manifest,
        comp,
      });
    }
    loadComp();
  }, [params.name]);

  return (
    <Wrapper>
      <div className="content">
        <EditorContext.Provider value={editorState}>
          {compManifest && (
            <CompPlayground
              initialValue={dsl}
              compFactory={compManifest.comp as unknown as Comp<any>}
              layoutInfo={compManifest.layoutInfo || { h: 5, w: 5 }}
            />
          )}
        </EditorContext.Provider>
      </div>
    </Wrapper>
  );
}
