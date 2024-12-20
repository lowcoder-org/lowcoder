import {
  AlignClose,
  AlignRight,
  AlignLeft,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { LegendComponentOption } from "echarts";
import { trans } from "i18n/comps";

const TitlePositionOptions = [
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

export const EchartsTitleConfig = (function () {
  return new MultiCompBuilder(
    {
      position: dropdownControl(TitlePositionOptions, "center"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        top: "center",
        type: "scroll",
      };
      config.top = props.position
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.position.propertyView({
          label: trans("echarts.titlePosition"),
          radioButton: true,
          tooltip: trans("echarts.changingTitle_x_Tooltip")
        })}
      </>
    ))
    .build();
})();
