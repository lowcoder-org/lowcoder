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
import { ExternalEditorContext } from "@lowcoder-ee/util/context/ExternalEditorContext";

/** Unique `key` per `RemoteCompView` so list/grid rows do not all share the same key (remounts + useMount re-runs on unrelated updates). */
let globalRemoteViewInstanceId = 0;

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

export interface RemoteCompReadyAction {
  type: "RemoteCompReady";
  comp: Comp;
}

interface RemoteCompViewProps {
  isLowcoderComp?: boolean;
  loadComp: (packageVersion?: string, appId?: string) => Promise<void>;
  loadingElement?: () => React.ReactNode;
  errorElement?: (error: any) => React.ReactNode;
  source?: RemoteCompSource;
}

const RemoteCompView = React.memo((props: React.PropsWithChildren<RemoteCompViewProps>) => {
  const { loadComp, loadingElement, errorElement, isLowcoderComp, source } = props;
  const [error, setError] = useState<any>("");
  const editorState = useContext(EditorContext);
  const compState = useContext(CompContext);
  const externalEditorState = useContext(ExternalEditorContext);
  const appId = externalEditorState.applicationId;
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
    loadComp(packageVersion, appId).catch((e) => {
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
    private readonly _remoteViewKey: string;
    private _loadInFlight: Promise<void> | null = null;
    /** Stable reference for React.memo (avoid new closure every getView in list/grid re-renders). */
    private readonly _loadForView: (
      packageVersion?: string,
      appId?: string
    ) => Promise<void>;
    constructor(params: CompParams<any>) {
      super(params);
      this.compValue = params.value;
      this._remoteViewKey = `rvc${++globalRemoteViewInstanceId}`;
      this._loadForView = (packageVersion, appId) => this.load(packageVersion, appId);
    }

    private async load(packageVersion = 'latest', appId = 'none') {
      if (this._loadInFlight) {
        return this._loadInFlight;
      }
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
      this._loadInFlight = (async () => {
        const RemoteExportedComp = await finalLoader({ ...remoteInfo, packageVersion, appId });
        if (!RemoteExportedComp) {
          return;
        }

        const compParams: CompParams<any> = {
          dispatch: this.dispatch,
        };

        if (this.compValue) {
          compParams.value = this.compValue;
        }
        const RemoteCompWithErrorBound = withErrorBoundary(RemoteExportedComp);
        this.dispatch(
          customAction<RemoteCompReadyAction>(
            {
              type: "RemoteCompReady",
              comp: new RemoteCompWithErrorBound(compParams),
            },
            false
          )
        );
      })();
      try {
        await this._loadInFlight;
      } catch {
        /* error surfaced in RemoteCompView */
      } finally {
        this._loadInFlight = null;
      }
    }

    getView() {
      return (
        <RemoteCompView
          key={this._remoteViewKey}
          isLowcoderComp={remoteInfo?.packageName === 'lowcoder-comps'}
          loadComp={this._loadForView}
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
