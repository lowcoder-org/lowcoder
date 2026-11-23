import { render, screen } from "@testing-library/react";
import { useContext, useMemo } from "react";
import {
  ExternalEditorContext,
  ExternalEditorContextState,
} from "./ExternalEditorContext";
import { AppTypeEnum } from "constants/applicationConstants";

/**
 * Tests the `hostApplicationId` threading between a module's own `ExternalEditorContext`
 * Provider and a nested chat controller. The real `moduleComp.tsx`/`chatControllerComp.tsx` compute these values
 * inside `withViewFn` render callbacks tied to the full comp/DSL framework (see `moduleComp.test.tsx`'s
 * dispatch-driven style), which is impractical to mount for this narrow concern; this test mirrors their exact
 * `useContext`/`useMemo` expressions in minimal stand-in components, to prove the context-propagation algorithm
 * itself in isolation.
 */

/** Mirrors moduleComp.tsx's moduleExternalState useMemo exactly. */
function StandInModule({ appId, children }: { appId: string; children: React.ReactNode }) {
  const enclosingContext = useContext(ExternalEditorContext);
  const hostApplicationId = enclosingContext.hostApplicationId ?? enclosingContext.applicationId;

  const moduleExternalState: ExternalEditorContextState = useMemo(
    () => ({
      readOnly: true,
      hideHeader: true,
      applicationId: appId,
      hostApplicationId,
      appType: AppTypeEnum.Module,
    }),
    [appId, hostApplicationId]
  );

  return (
    <ExternalEditorContext.Provider value={moduleExternalState}>
      {children}
    </ExternalEditorContext.Provider>
  );
}

/** Mirrors chatControllerComp.tsx's roomName computation exactly. */
function StandInChatController({ applicationIdProperty }: { applicationIdProperty: string }) {
  const externalContext = useContext(ExternalEditorContext);
  const hostAppId = externalContext.hostApplicationId ?? externalContext.applicationId;
  const roomName = (!applicationIdProperty || applicationIdProperty === "lowcoder_app" || applicationIdProperty === hostAppId)
    ? `signal_${hostAppId || "lowcoder_app"}`
    : `signal_${hostAppId || "lowcoder_app"}:${applicationIdProperty}`;
  return <div data-testid="room-name">{roomName}</div>;
}

/** Probes the current context's resolved host id directly. */
function HostIdProbe() {
  const ctx = useContext(ExternalEditorContext);
  return <div data-testid="host-id">{ctx.hostApplicationId ?? ctx.applicationId}</div>;
}

const TOP_LEVEL_HOST = "host-app";
const OUTER_MODULE_APP = "outer-module-app";
const INNER_MODULE_APP = "inner-module-app";

function topLevelContext(applicationId: string): ExternalEditorContextState {
  return { applicationId, appType: AppTypeEnum.Application };
}

describe("ExternalEditorContext hostApplicationId threading", () => {
  it("a top-level host page (no hostApplicationId of its own) resolves to its own applicationId", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <HostIdProbe />
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("host-id").textContent).toBe(TOP_LEVEL_HOST);
  });

  it("a module embedded in a top-level host propagates the HOST id as hostApplicationId, not its own appId", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <StandInModule appId={OUTER_MODULE_APP}>
          <HostIdProbe />
        </StandInModule>
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("host-id").textContent).toBe(TOP_LEVEL_HOST);
  });

  it("a module viewed stand-alone (no enclosing host) falls back to its own appId", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(OUTER_MODULE_APP)}>
        <HostIdProbe />
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("host-id").textContent).toBe(OUTER_MODULE_APP);
  });

  it("a module nested inside another module still resolves to the OUTERMOST host, not the outer module's id", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <StandInModule appId={OUTER_MODULE_APP}>
          <StandInModule appId={INNER_MODULE_APP}>
            <HostIdProbe />
          </StandInModule>
        </StandInModule>
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("host-id").textContent).toBe(TOP_LEVEL_HOST);
  });

  it("a chat controller inside a module picks hostApplicationId over applicationId when both are present", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <StandInModule appId={OUTER_MODULE_APP}>
          <StandInChatController applicationIdProperty="" />
        </StandInModule>
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("room-name").textContent).toBe(`signal_${TOP_LEVEL_HOST}`);
  });

  it("a chat controller falls back to applicationId when hostApplicationId is unset (stand-alone / top-level)", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <StandInChatController applicationIdProperty="" />
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("room-name").textContent).toBe(`signal_${TOP_LEVEL_HOST}`);
  });

  it("a non-empty sub-room property names signal_<host>:<property>, binding to the HOST, not another app", () => {
    render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <StandInModule appId={OUTER_MODULE_APP}>
          <StandInChatController applicationIdProperty="sub-room" />
        </StandInModule>
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("room-name").textContent).toBe(`signal_${TOP_LEVEL_HOST}:sub-room`);
  });

  it("re-rendering with ONLY the enclosing context's hostApplicationId changed (module's own appId unchanged) recomputes the inner probe", () => {
    const { rerender } = render(
      <ExternalEditorContext.Provider value={topLevelContext(TOP_LEVEL_HOST)}>
        <StandInModule appId={OUTER_MODULE_APP}>
          <HostIdProbe />
        </StandInModule>
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("host-id").textContent).toBe(TOP_LEVEL_HOST);

    const NEW_HOST = "a-different-host-app";
    rerender(
      <ExternalEditorContext.Provider value={topLevelContext(NEW_HOST)}>
        <StandInModule appId={OUTER_MODULE_APP}>
          <HostIdProbe />
        </StandInModule>
      </ExternalEditorContext.Provider>
    );
    expect(screen.getByTestId("host-id").textContent).toBe(NEW_HOST);
  });
});
