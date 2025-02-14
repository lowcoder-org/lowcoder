import {
  BoolControl,
  StringControl,
  list,
  isNumeric,
  genRandomKey,
  Dropdown,
  Option,
  RedButton,
  CustomModal,
  MultiCompBuilder,
  valueComp,
  dropdownControl,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";

import { ConstructorToComp, ConstructorToDataType, ConstructorToView } from "lowcoder-core";
import { CompAction, CustomAction, customAction, isMyCustomAction } from "lowcoder-core";

export type SeriesCompType = ConstructorToComp<typeof SeriesComp>;
export type RawSeriesCompType = ConstructorToView<typeof SeriesComp>;
type SeriesDataType = ConstructorToDataType<typeof SeriesComp>;
type MarkLineDataType = ConstructorToDataType<typeof MarkLinesTmpComp>;

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

export function newMarkLine(type: string): MarkLineDataType {
  return {
    type,
    dataIndex: genRandomKey(),
  };
}

export const MarkLineTypeOptions = [
  {
    label: trans("lineChart.max"),
    value: "max",
  },
  {
    label: trans("lineChart.average"),
    value: "average",
  },
  {
    label: trans("lineChart.min"),
    value: "min",
  },
] as const;

export const StepOptions = [
  {
    label: trans("lineChart.none"),
    value: "",
  },
  {
    label: trans("lineChart.start"),
    value: "start",
  },
  {
    label: trans("lineChart.middle"),
    value: "middle",
  },
  {
    label: trans("lineChart.end"),
    value: "end",
  },
] as const;

const valToLabel = (val) => MarkLineTypeOptions.find(o => o.value === val)?.label || "";
const markLinesChildrenMap = {
  type: dropdownControl(MarkLineTypeOptions, "max"),
  // unique key, for sort
  dataIndex: valueComp<string>(""),
};
const MarkLinesTmpComp = new MultiCompBuilder(markLinesChildrenMap, (props) => {
  return props;
})
  .setPropertyViewFn((children: any) => {
    return <>{children.type.propertyView({label: trans("lineChart.type")})}</>;
  })
  .build();
const markAreasChildrenMap = {
  name: StringControl,
  from: StringControl,
  to: StringControl,
  // unique key, for sort
  dataIndex: valueComp<string>(""),
};
const MarkAreasTmpComp = new MultiCompBuilder(markAreasChildrenMap, (props) => {
  return props;
})
  .setPropertyViewFn((children: any) => 
    (<>
      {children.name.propertyView({label: trans("lineChart.name")})}
      {children.from.propertyView({label: trans("lineChart.from")})}
      {children.to.propertyView({label: trans("lineChart.to")})}
    </>)
  )
  .build();
  

export function newMarkArea(): MarkLineDataType {
  return {
    dataIndex: genRandomKey(),
  };
}

const seriesChildrenMap = {
  columnName: StringControl,
  seriesName: StringControl,
  markLines: list(MarkLinesTmpComp),
  markAreas: list(MarkAreasTmpComp),
  hide: BoolControl,
  // unique key, for sort
  dataIndex: valueComp<string>(""),
  step: dropdownControl(StepOptions, ""),
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
        {this.children.step.propertyView({
          label: trans("lineChart.step"),
        })}
        <Option
          items={this.children.markLines.getView()}
          title={trans("lineChart.markLines")}
          itemTitle={(s) => valToLabel(s.getView().type)}
          popoverTitle={(s) => trans("lineChart.markLineType")}
          content={(s, index) => (
            <>
              {s.getPropertyView({label: "Type"})}
              {
                <RedButton
                  onClick={() => {
                    this.children.markLines.dispatch(this.children.markLines.deleteAction(index));
                  }}
                >
                  {trans("chart.delete")}
                </RedButton>
              }
            </>
          )}
          onAdd={() => {
            this.children.markLines.dispatch(
              this.children.markLines.pushAction(
                newMarkLine("max")
              )
            );
          }}
          onMove={(fromIndex, toIndex) => {
            const action = this.children.markLines.arrayMoveAction(fromIndex, toIndex);
            this.children.markLines.dispatch(action);
          }}
          hide={(s) => true}
          onHide={(s, hide) => console.log("onHide")}
          dataIndex={(s) => {
            return s.getView().dataIndex;
          }}
        />        
        <Option
          items={this.children.markAreas.getView()}
          title={trans("lineChart.markAreas")}
          itemTitle={(s) => s.getView().name}
          popoverTitle={(s) => trans("lineChart.markLineType")}
          content={(s, index) => (
            <>
              {s.getPropertyView({label: "Type"})}
              {
                <RedButton
                  onClick={() => {
                    this.children.markAreas.dispatch(this.children.markAreas.deleteAction(index));
                  }}
                >
                  {trans("chart.delete")}
                </RedButton>
              }
            </>
          )}
          onAdd={() => {
            this.children.markAreas.dispatch(
              this.children.markAreas.pushAction(
                newMarkArea()
              )
            );
          }}
          onMove={(fromIndex, toIndex) => {
            const action = this.children.markAreas.arrayMoveAction(fromIndex, toIndex);
            this.children.markAreas.dispatch(action);
          }}
          hide={(s) => true}
          onHide={(s, hide) => console.log("onHide")}
          dataIndex={(s) => {
            return s.getView().dataIndex;
          }}
        />
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
