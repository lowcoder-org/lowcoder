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
    label: <AlignClose />,
    value: "center",
  },
  {
    label: <AlignRight />,
    value: "right",
  },
  {
    label: <AlignLeft />,
    value: "left",
  },
] as const;

export const EchartsLegendAlignConfig = (function () {
  return new MultiCompBuilder(
    {
      legendAlign: dropdownControl(FunnelLegnedAlignOptions, "center"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        left: "right",
        type: "scroll",
      };
      config.left = props.legendAlign
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.legendAlign.propertyView({
          label: trans("echarts.legendAlign"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
