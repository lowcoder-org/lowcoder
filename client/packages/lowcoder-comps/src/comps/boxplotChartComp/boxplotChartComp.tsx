import {
  changeChildAction,
  changeValueAction,
  CompAction,
  CompActionTypes,
  wrapChildAction,
} from "lowcoder-core";
import { AxisFormatterComp, EchartsAxisType } from "../basicChartComp/chartConfigs/cartesianAxisConfig";
import { boxplotChartChildrenMap, ChartSize, getDataKeys } from "./boxplotChartConstants";
import { boxplotChartPropertyView } from "./boxplotChartPropertyView";
import _ from "lodash";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import ReactECharts from "../basicChartComp/reactEcharts";
import * as echarts from "echarts";
import {
  childrenToProps,
  depsConfig,
  genRandomKey,
  NameConfig,
  UICompBuilder,
  withDefault,
  withExposingConfigs,
  withViewFn,
  ThemeContext,
  chartColorPalette,
  getPromiseAfterDispatch,
  dropdownControl,
} from "lowcoder-sdk";
import { getEchartsLocale, i18nObjs, trans } from "i18n/comps";
import {
  echartsConfigOmitChildren,
  getEchartsConfig,
  getSelectedPoints,
} from "./boxplotChartUtils";
import 'echarts-extension-gmap';
import log from "loglevel";

let clickEventCallback = () => {};

const chartModeOptions = [
  {
    label: "UI",
    value: "ui",
  }
] as const;

let BoxplotChartTmpComp = (function () {
  return new UICompBuilder({mode:dropdownControl(chartModeOptions,'ui'),...boxplotChartChildrenMap}, () => null)
    .setPropertyViewFn(boxplotChartPropertyView)
    .build();
})();

BoxplotChartTmpComp = withViewFn(BoxplotChartTmpComp, (comp) => {
  const mode = comp.children.mode.getView();
  const onUIEvent = comp.children.onUIEvent.getView();
  const onEvent = comp.children.onEvent.getView();
  const echartsCompRef = useRef<ReactECharts | null>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState<ChartSize>();
  const firstResize = useRef(true);
  const theme = useContext(ThemeContext);
  const defaultChartTheme = {
    color: chartColorPalette,
    backgroundColor: "#fff",
  };

  let themeConfig = defaultChartTheme;
  try {
    themeConfig = theme?.theme.chart ? JSON.parse(theme?.theme.chart) : defaultChartTheme;
  } catch (error) {
    log.error('theme chart error: ', error);
  }

  const triggerClickEvent = async (dispatch: any, action: CompAction<JSONValue>) => {
    await getPromiseAfterDispatch(
      dispatch,
      action,
      { autoHandleAfterReduce: true }
    );
    onEvent('click');
  }

  useEffect(() => {
    const echartsCompInstance = echartsCompRef?.current?.getEchartsInstance();
    if (!echartsCompInstance) {
      return _.noop;
    }
    echartsCompInstance?.on("click", (param: any) => {
      document.dispatchEvent(new CustomEvent("clickEvent", {
        bubbles: true,
        detail: {
          action: 'click',
          data: param.data,
        }
      }));
      triggerClickEvent(
        comp.dispatch,
        changeChildAction("lastInteractionData", param.data, false)
      );
    });
    return () => {
      echartsCompInstance?.off("click");
      document.removeEventListener('clickEvent', clickEventCallback)
    };
  }, []);

  useEffect(() => {
    // bind events
    const echartsCompInstance = echartsCompRef?.current?.getEchartsInstance();
    if (!echartsCompInstance) {
      return _.noop;
    }
    echartsCompInstance?.on("selectchanged", (param: any) => {
      const option: any = echartsCompInstance?.getOption();
      document.dispatchEvent(new CustomEvent("clickEvent", {
        bubbles: true,
        detail: {
          action: param.fromAction,
          data: getSelectedPoints(param, option)
        }
      }));
      
      if (param.fromAction === "select") {
        comp.dispatch(changeChildAction("selectedPoints", getSelectedPoints(param, option), false));
        onUIEvent("select");
      } else if (param.fromAction === "unselect") {
        comp.dispatch(changeChildAction("selectedPoints", getSelectedPoints(param, option), false));
        onUIEvent("unselect");
      }

      triggerClickEvent(
        comp.dispatch,
        changeChildAction("lastInteractionData", getSelectedPoints(param, option), false)
      );
    });
    // unbind
    return () => {
      echartsCompInstance?.off("selectchanged");
      document.removeEventListener('clickEvent', clickEventCallback)
    };
  }, [onUIEvent]);

  const echartsConfigChildren = _.omit(comp.children, echartsConfigOmitChildren);
  const childrenProps = childrenToProps(echartsConfigChildren);

  const option = useMemo(() => {
    return getEchartsConfig(
      childrenProps as ToViewReturn<typeof echartsConfigChildren>,
      chartSize,
      themeConfig
    );
  }, [theme, childrenProps, chartSize, ...Object.values(echartsConfigChildren)]);

  useResizeDetector({
    targetRef: containerRef,
    onResize: ({width, height}) => {
      if (width && height) {
        setChartSize({ w: width, h: height });
      }
      if (!firstResize.current) {
        // ignore the first resize, which will impact the loading animation
        echartsCompRef.current?.getEchartsInstance().resize();
      } else {
        firstResize.current = false;
      }
    }
  })

  return (
    <div ref={containerRef} style={{height: '100%'}}>
      <ReactECharts
        ref={(e) => (echartsCompRef.current = e)}
        style={{ height: "100%" }}
        notMerge
        lazyUpdate
        opts={{ locale: getEchartsLocale() }}
        option={option}
        mode={mode}
      />
    </div>
  );
});

function getYAxisFormatContextValue(
  data: Array<JSONObject>,
  yAxisType: EchartsAxisType,
  yAxisName?: string
) {
  const dataSample = yAxisName && data.length > 0 && data[0][yAxisName];
  let contextValue = dataSample;
  if (yAxisType === "time") {
    // to timestamp
    const time =
      typeof dataSample === "number" || typeof dataSample === "string"
        ? new Date(dataSample).getTime()
        : null;
    if (time) contextValue = time;
  }
  return contextValue;
}

BoxplotChartTmpComp = class extends BoxplotChartTmpComp {
  private lastYAxisFormatContextVal?: JSONValue;
  private lastColorContext?: JSONObject;

  updateContext(comp: this) {
    // the context value of axis format
    let resultComp = comp;
    const data = comp.children.data.getView();
    const yAxisContextValue = getYAxisFormatContextValue(
      data,
      comp.children.yConfig.children.yAxisType.getView(),
    );
    if (yAxisContextValue !== comp.lastYAxisFormatContextVal) {
      comp.lastYAxisFormatContextVal = yAxisContextValue;
      resultComp = comp.setChild(
        "yConfig",
        comp.children.yConfig.reduce(
          wrapChildAction(
            "formatter",
            AxisFormatterComp.changeContextDataAction({ value: yAxisContextValue })
          )
        )
      );
    }
    return resultComp;
  }

  override reduce(action: CompAction): this {
    const comp = super.reduce(action);
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      const newData = comp.children.data.getView();
      // data changes
      if (comp.children.data !== this.children.data) {
        setTimeout(() => {
          // update x-axis value
          const keys = getDataKeys(newData);
          if (keys.length > 0 && !keys.includes(comp.children.xAxisKey.getView())) {
            comp.children.xAxisKey.dispatch(changeValueAction(keys[0] || ""));
          }
          if (keys.length > 0 && !keys.includes(comp.children.yAxisKey.getView())) {
            comp.children.yAxisKey.dispatch(changeValueAction(keys[1] || ""));
          }
        }, 0);
      }
      return this.updateContext(comp);
    }
    return comp;
  }

  override autoHeight(): boolean {
    return false;
  }
};

let BoxplotChartComp = withExposingConfigs(BoxplotChartTmpComp, [
  depsConfig({
    name: "selectedPoints",
    desc: trans("chart.selectedPointsDesc"),
    depKeys: ["selectedPoints"],
    func: (input) => {
      return input.selectedPoints;
    },
  }),
  depsConfig({
    name: "lastInteractionData",
    desc: trans("chart.lastInteractionDataDesc"),
    depKeys: ["lastInteractionData"],
    func: (input) => {
      return input.lastInteractionData;
    },
  }),
  depsConfig({
    name: "data",
    desc: trans("chart.dataDesc"),
    depKeys: ["data", "mode"],
    func: (input) =>[] ,
  }),
  new NameConfig("title", trans("chart.titleDesc")),
]);


export const BoxplotChartCompWithDefault = withDefault(BoxplotChartComp, {
  xAxisKey: "date",
});
