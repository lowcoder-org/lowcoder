import {
  BoolControl,
  StringControl,
  ColorControl,
  list,
  dropdownControl,
  withDefault,
  jsonControl,
  toArray,
  NumberControl,
  isNumeric,
  genRandomKey,
  Dropdown,
  MultiCompBuilder,
  valueComp,
} from "lowcoder-sdk";
import { i18nObjs, trans } from "i18n/comps";

import { ConstructorToComp, ConstructorToDataType, ConstructorToView } from "lowcoder-core";
import { CompAction, CustomAction, customAction, isMyCustomAction } from "lowcoder-core";

export type SeriesCompType = ConstructorToComp<typeof SeriesComp>;
export type RawSeriesCompType = ConstructorToView<typeof SeriesComp>;
type SeriesDataType = ConstructorToDataType<typeof SeriesComp>;

type ActionDataType = {
  type: "chartDataChanged";
  chartData: Array<JSONObject>;
};

export function newSeries(name: string, columnName: string): SeriesDataType {
  return {
    seriesName: name,
    columnName: columnName,
    dataIndex: genRandomKey(),
  };
}

const seriesChildrenMap = {
  columnName: StringControl,
  seriesName: StringControl,
  dynamicSize: BoolControl,
  symbolSize: NumberControl,
  dynamicIndex: withDefault(NumberControl, "1"),
  divider: withDefault(NumberControl, 1000),
  effect: BoolControl,
  showMarkLine: BoolControl,
  markLineFrom: withDefault(StringControl, "[0,0]"),
  markLineTo: withDefault(StringControl, "[1000,1000]"),
  markLineDesc: StringControl,
  hide: BoolControl,
  // unique key, for sort
  dataIndex: valueComp<string>(""),
};

const SeriesTmpComp = new MultiCompBuilder(seriesChildrenMap, (props) => {
  return props;
})
  .setPropertyViewFn(() => {
    return <></>;
  })
  .build();

class SeriesComp extends SeriesTmpComp {
  getPropertyViewWithData(columnOptions: OptionsType): React.ReactNode {
    return (
      <>
        {this.children.seriesName.propertyView({
          label: trans("chart.seriesName"),
        })}
        <Dropdown
          value={this.children.columnName.getView()}
          options={columnOptions}
          label={trans("chart.dataColumns")}
          onChange={(value) => {
            this.children.columnName.dispatchChangeValueAction(value);
          }}
        />
        {this.children.effect.propertyView({
          label: trans("scatterChart.effect"),
        })}
        {this.children.dynamicSize.propertyView({
          label: trans("scatterChart.dynamicSize"),
        })}
        {this.children.dynamicSize.getView() && this.children.dynamicIndex.propertyView({
          label: trans("scatterChart.dynamicIndex"),
        })}
        {this.children.dynamicSize.getView() && this.children.divider.propertyView({
          label: trans("scatterChart.divider"),
        })}
        {!this.children.dynamicSize.getView() && this.children.symbolSize.propertyView({
          label: trans("scatterChart.symbolSize"),
        })}
        {this.children.showMarkLine.propertyView({
          label: trans("scatterChart.showMarkLine"),
        })}
        {this.children.showMarkLine.getView() && this.children.markLineFrom.propertyView({
          label: trans("scatterChart.from"),
        })}
        {this.children.showMarkLine.getView() && this.children.markLineTo.propertyView({
          label: trans("scatterChart.to"),
        })}
        {this.children.showMarkLine.getView() && this.children.markLineDesc.propertyView({
          label: trans("scatterChart.desc"),
        })}
      </>
    );
  }
}

const SeriesListTmpComp = list(SeriesComp);

export class SeriesListComp extends SeriesListTmpComp {
  override reduce(action: CompAction): this {
    if (isMyCustomAction<ActionDataType>(action, "chartDataChanged")) {
      // auto generate series
      const actions = this.genExampleSeriesActions(action.value.chartData);
      return this.reduce(this.multiAction(actions));
    }
    return super.reduce(action);
  }

  private genExampleSeriesActions(chartData: Array<JSONObject>) {
    const actions: CustomAction[] = [];
    if (!chartData || chartData.length <= 0 || !chartData[0]) {
      return actions;
    }
    let delCnt = 0;
    const existColumns = this.getView().map((s) => s.getView().columnName);
    // delete series not in data
    existColumns.forEach((columnName) => {
      if (chartData[0]?.[columnName] === undefined) {
        actions.push(this.deleteAction(0));
        delCnt++;
      }
    });
    if (existColumns.length > delCnt) {
      // don't generate example if exists
      return actions;
    }
    // generate example series
    const exampleKeys = Object.keys(chartData[0])
      .filter((key) => {
        return !existColumns.includes(key) && isNumeric(chartData[0][key]);
      })
      .slice(0, 3);
    exampleKeys.forEach((key) => actions.push(this.pushAction(newSeries(key, key))));
    return actions;
  }

  dispatchDataChanged(chartData: Array<JSONObject>): void {
    this.dispatch(
      customAction<ActionDataType>({
        type: "chartDataChanged",
        chartData: chartData,
      })
    );
  }
}
