import {
  AlignClose,
  AlignRight,
  AlignLeft,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import {FunnelSeriesOption, LegendComponentOption} from "echarts";
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
    (props): FunnelSeriesOption => {
      const config: FunnelSeriesOption = {
        left: "center",
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
