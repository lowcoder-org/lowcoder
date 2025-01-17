import {
  AlignBottom,
  AlignTop,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import {FunnelSeriesOption, LegendComponentOption} from "echarts";
import { trans } from "i18n/comps";

const SortingOptions = [
  {
    label: <AlignBottom />,
    value: "descending",
  },
  {
    label: <AlignTop />,
    value: "ascending",
  },
] as const;

export const EchartsSortingConfig = (function () {
  return new MultiCompBuilder(
    {
      sort: dropdownControl(SortingOptions, "descending"),
    },
    (props): FunnelSeriesOption => {
      const config: FunnelSeriesOption = {
        sort: "descending"
      };
      config.sort = props.sort
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.sort.propertyView({
          label: trans("echarts.sort"),
          radioButton: true,
          tooltip: trans("echarts.changingSortTooltip")
        })}
      </>
    ))
    .build();
})();
