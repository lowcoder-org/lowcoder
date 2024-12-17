import {
  HorizontoalIcon,
  VerticalIcon,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { LegendComponentOption } from "echarts";
import { trans } from "i18n/comps";

const LegendLayoutOptions = [
  {
    label: <HorizontoalIcon />,
    value: "horizontal",
  },
  {
    label: <VerticalIcon />,
    value: "vertical",
  },
] as const;

export const EchartsLegendLayoutConfig = (function () {
  return new MultiCompBuilder(
    {
      legendLayout: dropdownControl(LegendLayoutOptions, "bottom"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        orient: "vertical",
        type: "scroll"
      };
      config.orient = props.legendLayout
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.legendLayout.propertyView({
          label: trans("echarts.legendLayout"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
