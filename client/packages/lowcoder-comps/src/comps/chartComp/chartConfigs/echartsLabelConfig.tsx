import {
  AlignClose,
  AlignRight,
  AlignLeft,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { LegendComponentOption } from "echarts";
import { trans } from "i18n/comps";

const LabelPositionOptions = [
  {
    label: <AlignClose />,
    value: "inside",
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

export const EchartsLabelConfig = (function () {
  return new MultiCompBuilder(
    {
      position: dropdownControl(LabelPositionOptions, "inside"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        top: "inside",
        type: "scroll",
      };
      config.top = props.position
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.position.propertyView({
          label: trans("echarts.labelPosition"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
