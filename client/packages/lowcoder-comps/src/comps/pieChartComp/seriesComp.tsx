import {
  BoolControl,
  StringControl,
  ColorControl,
  list,
  dropdownControl,
  withDefault,
  NumberControl,
  isNumeric,
  genRandomKey,
  Dropdown,
  MultiCompBuilder,
  valueComp,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";

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

export const RoseTypeOptions = [
  {
    label: trans("pieChart.radius"),
    value: "radius",
  },
  {
    label: trans("pieChart.area"),
    value: "area",
  },
  {
    label: trans("pieChart.none"),
    value: "none",
  },
] as const;

export const LabelAlignToOptions = [
  {
    label: trans("pieChart.none"),
    value: "none",
  },
  {
    label: trans("pieChart.labelLine"),
    value: "labelLine",
  },
  {
    label: trans("pieChart.edge"),
    value: "edge",
  },
] as const;

export const LabelPositionOptions = [
  {
    label: trans("pieChart.outer"),
    value: "outer",
  },
  {
    label: trans("pieChart.inner"),
    value: "inner",
  },
  {
    label: trans("pieChart.center"),
    value: "center",
  },
] as const;

const seriesChildrenMap = {
  columnName: StringControl,
  seriesName: StringControl,
  startAngle: withDefault(NumberControl, 0),
  endAngle: withDefault(NumberControl, 360),
  roseType: dropdownControl(RoseTypeOptions, "none"),
  labelAlignTo: dropdownControl(LabelAlignToOptions, "none"),
  labelPosition: dropdownControl(LabelPositionOptions, "outer"),
  labelBleedMargin: withDefault(NumberControl, 5),
  labelEdgeDistance: withDefault(StringControl, '25%'),
  labelLineLength: withDefault(NumberControl, 10),
  labelLineLength2: withDefault(NumberControl, 10),
  padAngle: withDefault(NumberControl, 0),
  borderRadius: withDefault(NumberControl, 0),
  itemColor: ColorControl,
  itemShadowBlur: NumberControl,
  itemShadowColor: ColorControl,
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
        {this.children.startAngle.propertyView({
          label: trans("pieChart.startAngle"),
        })}
        {this.children.endAngle.propertyView({
          label: trans("pieChart.endAngle"),
        })}
        {this.children.roseType.propertyView({
          label: trans("pieChart.roseType"),
        })}
        {this.children.labelPosition.propertyView({
          label: trans("pieChart.labelPosition"),
        })}
        {this.children.labelAlignTo.propertyView({
          label: trans("pieChart.labelAlignTo"),
        })}
        {this.children.labelBleedMargin.propertyView({
          label: trans("pieChart.labelBleedMargin"),
        })}
        {this.children.labelAlignTo.getView() === "edge" && this.children.labelEdgeDistance.propertyView({
          label: trans("pieChart.labelEdgeDistance"),
        })}
        {this.children.labelLineLength.propertyView({
          label: trans("pieChart.labelLineLength"),
        })}
        {this.children.labelAlignTo.getView() === "labelLine" && this.children.labelLineLength2.propertyView({
          label: trans("pieChart.labelLineLength2"),
        })}
        {this.children.padAngle.propertyView({
          label: trans("pieChart.padAngle"),
        })}
        {this.children.borderRadius.propertyView({
          label: trans("pieChart.borderRadius"),
        })}
        {this.children.itemColor.propertyView({
          label: trans("pieChart.itemColor"),
        })}
        {this.children.itemShadowBlur.propertyView({
          label: trans("pieChart.itemShadowBlur"),
        })}
        {this.children.itemShadowColor.propertyView({
          label: trans("pieChart.itemShadowColor"),
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
