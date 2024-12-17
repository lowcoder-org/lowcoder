import {
  HorizontoalIcon,
  VerticalIcon,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { LegendComponentOption } from "echarts";
import { trans } from "i18n/comps";

const LegendOrientOptions = [
  {
    label: <HorizontoalIcon />,
    value: "horizontal",
  },
  {
    label: <VerticalIcon />,
    value: "vertical",
  },
] as const;

export const EchartsLegendOrientConfig = (function () {
  return new MultiCompBuilder(
    {
      orient: dropdownControl(LegendOrientOptions, "horizontal"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        orient: "horizontal",
        type: "scroll"
      };
      config.orient = props.orient
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.orient.propertyView({
          label: trans("echarts.legendOrient"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
