import {
  AlignClose,
  AlignRight,
  AlignLeft,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import {FunnelSeriesOption, LegendComponentOption} from "echarts";
import { trans } from "i18n/comps";

const FunnelAlignOptions = [
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

export const EchartsFunnelAlignConfig = (function () {
  return new MultiCompBuilder(
    {
      funnelAlign: dropdownControl(FunnelAlignOptions, "center"),
    },
    (props): FunnelSeriesOption => {
      const config: FunnelSeriesOption = {
        funnelAlign: "center",
      };
      config.funnelAlign = props.funnelAlign
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.funnelAlign.propertyView({
          label: trans("echarts.funnelAlign"),
          radioButton: true,
          tooltip: trans("echarts.changingAlignTooltip")
        })}
      </>
    ))
    .build();
})();
