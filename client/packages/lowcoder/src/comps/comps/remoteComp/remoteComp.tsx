import { default as Skeleton } from "antd/es/skeleton";
import { simpleMultiComp } from "comps/generators";
import { withExposingConfigs } from "comps/generators/withExposing";
import { GreyTextColor } from "constants/style";
import log from "loglevel";
import { Comp, CompAction, CompParams, customAction, isCustomAction } from "lowcoder-core";
import { WhiteLoading } from "lowcoder-design";
import { useContext, useState } from "react";
import { useMount } from "react-use";
import styled from "styled-components";
import { RemoteCompInfo, RemoteCompLoader, RemoteCompSource } from "types/remoteComp";
import { loaders } from "./loaders"; 
import { withErrorBoundary } from "comps/generators/withErrorBoundary";
import { EditorContext } from "@lowcoder-ee/comps/editorState";
import { CompContext } from "@lowcoder-ee/comps/utils/compContext";
import React from "react";
import type { AppState } from "@lowcoder-ee/redux/reducers";
import { useSelector } from "react-redux";

const ViewError = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  height: 100%;
  color: ${GreyTextColor};
  border-radius: 4px;
  padding: 24px;
`;

const ViewLoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  height: 100%;
`;

function ViewLoading(props: { padding?: number }) {
  return (
    <ViewLoadingWrapper style={{ padding: props.padding }}>
      <Skeleton active />
    </ViewLoadingWrapper>
  );
}

interface RemoteCompReadyAction {
  type: "RemoteCompReady";
  comp: Comp;
}

interface RemoteCompViewProps {
  isLowcoderComp?: boolean;
  loadComp: (packageVersion?: string) => Promise<void>;
  loadingElement?: () => React.ReactNode;
  errorElement?: (error: any) => React.ReactNode;
  source?: RemoteCompSource;
}

const RemoteCompView = React.memo((props: React.PropsWithChildren<RemoteCompViewProps>) => {
  const { loadComp, loadingElement, errorElement, isLowcoderComp, source } = props;
  const [error, setError] = useState<any>("");
  const editorState = useContext(EditorContext);
  const compState = useContext(CompContext);
  const lowcoderCompPackageVersion = editorState?.getAppSettings().lowcoderCompVersion || 'latest';
  const latestLowcoderCompsVersion = useSelector((state: AppState) => state.npmPlugin.packageVersion['lowcoder-comps']);

  let packageVersion = 'latest';
  // lowcoder-comps's package version
  if (isLowcoderComp && source !== 'bundle') {
    packageVersion = lowcoderCompPackageVersion === 'latest' && Boolean(latestLowcoderCompsVersion)
      ? latestLowcoderCompsVersion
      : lowcoderCompPackageVersion;
  }
  // component plugin's package version
  else if (compState.comp?.comp?.version) {
    packageVersion = compState.comp?.comp.version;
  }

  useMount(() => {
    setError("");
    loadComp(packageVersion).catch((e) => {
      setError(String(e));
    });
  });

  if (error) {
    if (errorElement) {
      return <>{errorElement(error)}</>;
    }
    return (
      <ViewError>
        <div>{error}</div>
      </ViewError>
    );
  }

  if (loadingElement) {
    return <ViewLoadingWrapper>{loadingElement()}</ViewLoadingWrapper>;
  }

  return (
    <WhiteLoading />
  );
});

export function remoteComp<T extends RemoteCompInfo = RemoteCompInfo>(
  remoteInfo?: T,
  loader?: RemoteCompLoader<T>,
  loadingElement?: () => React.ReactNode
) {
  class RemoteComp extends simpleMultiComp({}) {
    compValue: any;
    remoteInfo = remoteInfo;
    constructor(params: CompParams<any>) {
      super(params);
      this.compValue = params.value;
    }

    private async load(packageVersion = 'latest') {
      if (!remoteInfo) {
        return;
      }
      let finalLoader = loader;
      if (!loader) {
        finalLoader = loaders[remoteInfo.source];
      }
      if (!finalLoader) {
        log.error("loader not found, remote info:", remoteInfo);
        return;
      }
      const RemoteExportedComp = await finalLoader({...remoteInfo, packageVersion});
      if (!RemoteExportedComp) {
        return;
      }

      const params: CompParams<any> = {
        dispatch: this.dispatch,
      };

      if (this.compValue) {
        params.value = this.compValue;
      }
      const RemoteCompWithErrorBound = withErrorBoundary(RemoteExportedComp);
      this.dispatch(
        customAction<RemoteCompReadyAction>(
          {
            type: "RemoteCompReady",
            comp: new RemoteCompWithErrorBound(params),
          },
          false
        )
      );
    }

    getView() {
      const key = `${remoteInfo?.packageName}-${remoteInfo?.packageVersion}-${remoteInfo?.compName}`;
      return (
        <RemoteCompView
          key={key}
          isLowcoderComp={remoteInfo?.packageName === 'lowcoder-comps'}
          loadComp={(packageVersion?: string) => this.load(packageVersion)}
          loadingElement={loadingElement}
          source={remoteInfo?.source}
        />
      );
    }

    getPropertyView() {
      return <ViewLoading padding={16} />;
    }

    reduce(action: CompAction<any>): this {
      if (isCustomAction<RemoteCompReadyAction>(action, "RemoteCompReady")) {
        // use real remote comp instance to replace RemoteCompLoader
        return action.value.comp as this;
      }
      return super.reduce(action);
    }

    autoHeight(): boolean {
      return false;
    }

    toJsonValue() {
      return this.compValue;
    }
  }

  return withExposingConfigs(RemoteComp, []);
}
