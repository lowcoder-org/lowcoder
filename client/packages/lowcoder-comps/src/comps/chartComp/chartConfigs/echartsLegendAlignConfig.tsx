import {
  AlignClose,
  AlignRight,
  AlignLeft,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { LegendComponentOption } from "echarts";
import { trans } from "i18n/comps";

const FunnelLegnedAlignOptions = [
  {
    label: <AlignLeft />,
    value: "left",
  },
  {
    label: <AlignClose />,
    value: "center",
  },
  {
    label: <AlignRight />,
    value: "right",
  }
] as const;

export const EchartsLegendAlignConfig = (function () {
  return new MultiCompBuilder(
    {
      left: dropdownControl(FunnelLegnedAlignOptions, "center"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        left: "center",
        type: "scroll",
      };
      config.left = props.left
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.left.propertyView({
          label: trans("echarts.legendAlign"),
          radioButton: true,
          tooltip: trans("echarts.changingLegend_y_Tooltip")
        })}
      </>
    ))
    .build();
})();
