import {
  changeChildAction,
  changeValueAction,
  CompAction,
  CompActionTypes,
  wrapChildAction,
} from "lowcoder-core";
import { AxisFormatterComp, EchartsAxisType } from "./chartConfigs/cartesianAxisConfig";
import { chartChildrenMap, ChartSize, getDataKeys } from "./chartConstants";
import { chartPropertyView } from "./chartPropertyView";
import _ from "lodash";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import ReactResizeDetector from "react-resize-detector";
import ReactECharts from "./reactEcharts";
import {
  childrenToProps,
  depsConfig,
  genRandomKey,
  JSONObject,
  JSONValue,
  NameConfig,
  ToViewReturn,
  UICompBuilder,
  withDefault,
  withExposingConfigs,
  withMethodExposing,
  withViewFn,
  ThemeContext,
  chartColorPalette,
  getPromiseAfterDispatch,
} from "lowcoder-sdk";
import { getEchartsLocale, trans } from "i18n/comps";
import { ItemColorComp } from "comps/chartComp/chartConfigs/lineChartConfig";
import {
  echartsConfigOmitChildren,
  getEchartsConfig,
  getSelectedPoints,
  loadGoogleMapsScript,
} from "comps/chartComp/chartUtils";
import 'echarts-extension-gmap';
import log from "loglevel";

let clickEventCallback = () => {};

let ChartTmpComp = (function () {
  return new UICompBuilder(chartChildrenMap, () => null)
    .setPropertyViewFn(chartPropertyView)
    .build();
})();

ChartTmpComp = withViewFn(ChartTmpComp, (comp) => {
  const apiKey = comp.children.mapApiKey.getView();
  const mode = comp.children.mode.getView();
  const mapCenterPosition = {
    lng: comp.children.mapCenterLng.getView(),
    lat: comp.children.mapCenterLat.getView(),
  }
  const mapZoomlevel = comp.children.mapZoomLevel.getView();
  const onUIEvent = comp.children.onUIEvent.getView();
  const onMapEvent = comp.children.onMapEvent.getView();
  const onEvent = comp.children.onEvent.getView();

  const echartsCompRef = useRef<ReactECharts | null>();
  const [chartSize, setChartSize] = useState<ChartSize>();
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);
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
    // click events for JSON/Map mode 
    if (mode === 'ui') return;

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
  }, [mode, mapScriptLoaded]);

  useEffect(() => {
    // click events for UI mode
    if(mode !== 'ui') return;
    
    // bind events
    const echartsCompInstance = echartsCompRef?.current?.getEchartsInstance();
    if (!echartsCompInstance) {
      return _.noop;
    }
    echartsCompInstance?.on("selectchanged", (param: any) => {
      const option: any = echartsCompInstance?.getOption();
      //log.log("chart select change", param);
      // trigger click event listener

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
  }, [mode, onUIEvent]);

  const echartsConfigChildren = _.omit(comp.children, echartsConfigOmitChildren);
  const option = useMemo(() => {
    return getEchartsConfig(
      childrenToProps(echartsConfigChildren) as ToViewReturn<typeof echartsConfigChildren>,
      chartSize
    );
  }, [chartSize, ...Object.values(echartsConfigChildren)]);

  const isMapScriptLoaded = useMemo(() => {
    return mapScriptLoaded || window?.google;
  }, [mapScriptLoaded])

  const loadGoogleMapData = () => {
    const echartsCompInstance = echartsCompRef?.current?.getEchartsInstance();
    if (!echartsCompInstance) {
      return _.noop;
    }

    comp.children.mapInstance.dispatch(changeValueAction(echartsCompInstance))
    onMapEvent('mapReady')
  }
  
  const handleOnMapScriptLoad = () => {
    setMapScriptLoaded(true);
    setTimeout(() => {
      loadGoogleMapData();
    })
  }

  useEffect(() => {
    if( mode !== 'map') {
      comp.children.mapInstance.dispatch(changeValueAction(null, false))
      return;
    }

    if(comp.children.mapInstance.value) return;

    const gMapScript = loadGoogleMapsScript(apiKey);
    if(isMapScriptLoaded) {
      handleOnMapScriptLoad();
      return;
    }
    gMapScript.addEventListener('load', handleOnMapScriptLoad);
    return () => {
      gMapScript.removeEventListener('load', handleOnMapScriptLoad);
    }
  }, [mode, apiKey, option])

  useEffect(() => {
    if(mode !== 'map') return;
    onMapEvent('centerPositionChange');
  }, [mode, mapCenterPosition.lat, mapCenterPosition.lng])

  useEffect(() => {
    if(mode !== 'map') return;
    onMapEvent('zoomLevelChange');
  }, [mode, mapZoomlevel])

  return (
    <ReactResizeDetector
      onResize={(w, h) => {
        if (w && h) {
          setChartSize({ w: w, h: h });
        }
        if (!firstResize.current) {
          // ignore the first resize, which will impact the loading animation
          echartsCompRef.current?.getEchartsInstance().resize();
        } else {
          firstResize.current = false;
        }
      }}
    >
      {(mode !== 'map' || (mode === 'map' && isMapScriptLoaded)) && (
        <ReactECharts
          ref={(e) => (echartsCompRef.current = e)}
          style={{ height: "100%" }}
          notMerge
          lazyUpdate
          opts={{ locale: getEchartsLocale() }}
          option={option}
          theme={mode !== 'map' ? themeConfig : undefined}
          mode={mode}
        />
      )}
    </ReactResizeDetector>
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

ChartTmpComp = class extends ChartTmpComp {
  private lastYAxisFormatContextVal?: JSONValue;
  private lastColorContext?: JSONObject;

  updateContext(comp: this) {
    // the context value of axis format
    let resultComp = comp;
    const data = comp.children.data.getView();
    const sampleSeries = comp.children.series.getView().find((s) => !s.getView().hide);
    const yAxisContextValue = getYAxisFormatContextValue(
      data,
      comp.children.yConfig.children.yAxisType.getView(),
      sampleSeries?.children.columnName.getView()
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
    // item color context
    const colorContextVal = {
      seriesName: sampleSeries?.children.seriesName.getView(),
      value: yAxisContextValue,
    };
    if (
      comp.children.chartConfig.children.comp.children.hasOwnProperty("itemColor") &&
      !_.isEqual(colorContextVal, comp.lastColorContext)
    ) {
      comp.lastColorContext = colorContextVal;
      resultComp = resultComp.setChild(
        "chartConfig",
        comp.children.chartConfig.reduce(
          wrapChildAction(
            "comp",
            wrapChildAction("itemColor", ItemColorComp.changeContextDataAction(colorContextVal))
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
          // pass to child series comp
          comp.children.series.dispatchDataChanged(newData);
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

let ChartComp = withExposingConfigs(ChartTmpComp, [
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
    func: (input) => {
      if (input.mode === "ui") {
        return input.data;
      } else {
        // no data in json mode
        return [];
      }
    },
  }),
  new NameConfig("title", trans("chart.titleDesc")),
]);

ChartComp = withMethodExposing(ChartComp, [
  {
    method: {
      name: "getMapInstance",
    },
    execute: (comp) => {
      return new Promise(resolve => {
        let intervalCount = 0;
        const mapInstanceInterval = setInterval(() => {
          const instance = comp.children.mapInstance.getView();
          const mapInstance = instance?.getModel()?.getComponent("gmap")?.getGoogleMap()
          if(mapInstance || intervalCount === 10) {
            clearInterval(mapInstanceInterval)
            resolve(mapInstance)
          }
          intervalCount++;
        }, 1000);
      })
    }
  },
  {
    method: {
      name: "getMapZoomLevel",
    },
    execute: (comp) => {
      return comp.children.mapZoomLevel.getView();
    }
  },
  {
    method: {
      name: "getMapCenterPosition",
    },
    execute: (comp) => {
      return Promise.resolve({
        lng: comp.children.mapCenterLng.getView(),
        lat: comp.children.mapCenterLat.getView(),
      });
    }
  },
  {
    method: {
      name: "onClick",
      params: [
        {
          name: "callback",
          type: "function",
        },
      ],
    },
    execute: (comp, params) => {
      clickEventCallback = params[0];
      document.addEventListener('clickEvent', clickEventCallback);
    }
  },
])

export const ChartCompWithDefault = withDefault(ChartComp, {
  xAxisKey: "date",
  series: [
    {
      dataIndex: genRandomKey(),
      seriesName: trans("chart.spending"),
      columnName: "spending",
    },
    {
      dataIndex: genRandomKey(),
      seriesName: trans("chart.budget"),
      columnName: "budget",
    },
  ],
});