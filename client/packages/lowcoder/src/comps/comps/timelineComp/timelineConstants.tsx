import { trans } from "i18n";
export type timelineNode = {
  title: string;
  subTitle?: string;
  color?: string;
  label?: string;
  dot?: string;
  subTitleColor?: string;
  titleColor?: string;
  lableColor?: string;
};

export const TimelineDataTooltip = (
  <li>
    {trans("timeLine.Introduction")}:
    <br />
    1. title - {trans("timeLine.helpTitle")}
    <br />
    2. subTitle - {trans("timeLine.helpsubTitle")}
    <br />
    3. label - {trans("timeLine.helpLabel")}
    <br />
    4. color - {trans("timeLine.helpColor")}
    <br />
    5. dot - {trans("timeLine.helpDot")}
    <br />
    6. titleColor - {trans("timeLine.helpTitleColor")}
    <br />
    7. subTitleColor - {trans("timeLine.helpSubTitleColor")}
    <br />
    8. lableColor - {trans("timeLine.helpLableColor")}
  </li>
);

export const timelineDate=[
  {
    title: "码匠发布",
    subTitle: "Majiang Published in China",
    label: "2022-6-10",
  },
  {
    title: "openblocks开源",
    subTitle: "Openblocks open source in GitHub",
    label: "2022-11-28",
  },
  {
    title: "最后一次提交代码",
    subTitle: "Openblocks project abandoned",
    dot: "ExclamationCircleOutlined",
    label: "2023-3-28",
    color: 'red',
    titleColor: "red",
    subTitleColor: "red",
    lableColor: "red",
  },
  {
    title: "Lowcoder继续前行",
    subTitle: "Lowcoder, keep moving forward",
    dot: "LogoutOutlined",
    color: "green",
    label: "2023-4-26",
  },
]