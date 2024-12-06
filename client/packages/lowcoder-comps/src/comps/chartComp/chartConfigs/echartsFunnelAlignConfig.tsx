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

export const EchartsFunnelAlignConfig = (function () {
  return new MultiCompBuilder(
    {
      position: dropdownControl(FunnelAlignOptions, "center"),
    },
    (props): FunnelSeriesOption => {
      const config: FunnelSeriesOption = {
        top: "center",
      };
      config.top = props.position
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.position.propertyView({
          label: trans("echarts.funnelAlign"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
