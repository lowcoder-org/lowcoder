import { CompName } from "components/CompName";
import { getAllCompItems } from "comps/comps/containerBase/utils";
import { SimpleNameComp } from "comps/comps/simpleNameComp";
import { StringControl } from "comps/controls/codeControl";
import { EditorContext } from "comps/editorState";
import { RemoteCompInfo } from "types/remoteComp";
import {
  simpleMultiComp,
  withDefault,
  withPropertyViewFn,
  withTypeAndChildren,
  withViewFn,
} from "comps/generators";
import { hookToStateComp, simpleValueComp } from "comps/generators/hookToComp";
import { withSimpleExposing } from "comps/generators/withExposing";
import { DrawerComp } from "comps/hooks/drawerComp";
import { remoteComp } from "comps/comps/remoteComp/remoteComp";

import {
  HookCompConstructor,
  HookCompMapRawType,
  HookCompType,
} from "comps/hooks/hookCompTypes";
import { ModalComp } from "comps/hooks/modalComp";
import { trans } from "i18n";
import _ from "lodash";
import dayjs from "dayjs";
import { ConstructorToComp } from "lowcoder-core";
import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import React, { useContext, useEffect, useMemo, useCallback } from "react";
import { useInterval, useTitle, useWindowSize } from "react-use";
import { useCurrentUser } from "util/currentUser";
import { LocalStorageComp } from "./localStorageComp";
import { MessageComp } from "./messageComp";
import { ToastComp } from "./toastComp";
import { ThemeComp } from "./themeComp";
import UrlParamsHookComp from "./UrlParamsHookComp";
import { UtilsComp } from "./utilsComp";
import { ScreenInfoHookComp } from "./screenInfoComp";

window._ = _;
window.dayjs = dayjs;

const LodashJsLib = simpleValueComp(_);
const DayJsLib = simpleValueComp(dayjs);

const WindowSizeComp = hookToStateComp(useWindowSize);

const CurrentUserHookComp = hookToStateComp(() => {
  const user = useCurrentUser();
  return user;
});

function useCurrentTime() {
  const [time, setTime] = React.useState(0);
  
  // Add cleanup for the interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().getTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return useMemo(
    () => ({
      time: time,
    }),
    [time]
  );
}

const CurrentTimeHookComp = hookToStateComp(useCurrentTime);
const TitleTmp1Comp = withViewFn(
  simpleMultiComp({
    title: withDefault(StringControl, "Title Test"),
  }),
  (comp) => {
    useTitle(comp.children.title.getView());
    return null;
  }
);
const TitleTmp2Comp = withSimpleExposing(TitleTmp1Comp, (comp) => ({
  title: comp.children.title.getView(),
}));

const TitleHookComp = withPropertyViewFn(TitleTmp2Comp, (comp) => {
  return (
    <Section name={sectionNames.basic}>
      {comp.children.title.propertyView({
        label: trans("title"),
      })}
    </Section>
  );
});
const builtInRemoteComps: Omit<RemoteCompInfo, "compName"> = {
  // source: !!REACT_APP_BUNDLE_BUILTIN_PLUGIN ? "bundle" : "npm",
  source: "npm",
  isRemote: true,
  packageName: "lowcoder-comps",
};
const HookMap: HookCompMapRawType = {
  title: TitleHookComp,
  windowSize: WindowSizeComp,
  currentTime: CurrentTimeHookComp,
  lodashJsLib: LodashJsLib,
  dayJsLib: DayJsLib,
  momentJsLib: DayJsLib, // old components use this hook
  utils: UtilsComp,
  message: MessageComp,
  toast: ToastComp,
  localStorage: LocalStorageComp,
  modal: ModalComp,
  meeting: remoteComp({ ...builtInRemoteComps, compName: "meetingController" }),
  currentUser: CurrentUserHookComp,
  screenInfo: ScreenInfoHookComp,
  urlParams: UrlParamsHookComp,
  drawer: DrawerComp,
  theme: ThemeComp,
};

export const HookTmpComp = withTypeAndChildren(HookMap, "title", {
  name: SimpleNameComp,
});

function SelectHookView(props: {
  children: React.ReactNode;
  compName: string;
  compType: HookCompType;
  comp: ConstructorToComp<HookCompConstructor>;
}) {
  const editorState = useContext(EditorContext);
  const selectedComp = editorState.selectedComp();

  // Memoize the comp tree calculation
  const compTree = useMemo(() => {
    if (!props.comp || !(props.comp as any).getCompTree) return null;
    return (props.comp as any).getCompTree();
  }, [props.comp]);

  // Memoize the child components calculation
  const allChildComp = useMemo(() => {
    if (!compTree) return {};
    return getAllCompItems(compTree);
  }, [compTree]);

  // Memoize the click handler
  const handleClick = useCallback(() => {
    editorState.setSelectedCompNames(new Set([props.compName]));
  }, [editorState, props.compName]);

  // Select the modal and its subcomponents on the left to display the modal
  useEffect(() => {
    if (
      (props.compType !== "modal" &&
        props.compType !== "drawer" &&
        props.compType !== "meeting") ||
      !selectedComp ||
      (editorState.selectSource !== "addComp" &&
        editorState.selectSource !== "leftPanel")
    ) {
      return;
    } else if (
      (selectedComp as any).children.comp === props.comp
    ) {
      if ((selectedComp as any).children.comp?.remoteInfo?.isRemote){
        return;
      }

      // Select the current modal to display the modal
      !props.comp.children.visible.getView().value &&
        props.comp.children.visible.dispatch(
          props.comp.children.visible.changeChildAction("value", true)
        );
    } else {
      // all child components of modal
      const selectChildComp = Object.values(allChildComp).find(
        (child) => child === selectedComp
      );
      const visible = props.comp.children.visible.getView().value;
      if (selectChildComp && !visible) {
        props.comp.children.visible.dispatch(
          props.comp.children.visible.changeChildAction("value", true)
        );
      } else if (!selectChildComp && visible) {
        props.comp.children.visible.dispatch(
          props.comp.children.visible.changeChildAction("value", false)
        );
      }
    }
  }, [selectedComp, editorState.selectSource, allChildComp]);

  return (
    <div onClick={handleClick}>
      {props.children}
    </div>
  );
}

export class HookComp extends HookTmpComp {
  exposingInfo() {
    return this.children.comp.exposingInfo();
  }

  override getView() {
    const view = this.children?.comp?.getView();
    if (!view) {
      // most hook components have no view
      return view;
    }
    return (
      <SelectHookView
        compName={this.children.name.getView()}
        compType={this.children.compType.getView()}
        comp={this.children.comp}
      >
        {view}
      </SelectHookView>
    );
  }

  override getPropertyView() {
    return (
      <>
        <CompName name={this.children.name.getView()} />
        <ScrollBar>
          {this.children.comp.getPropertyView()}
        </ScrollBar>
      </>
    );
  }
}
