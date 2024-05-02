import ReactResizeDetector from "react-resize-detector";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { TriContainer } from "../triContainerComp/triContainer";
import {
  ContainerCompBuilder,
} from "../triContainerComp/triContainerCompBuilder";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { BoolCodeControl } from "comps/controls/codeControl";
import { BoolControl } from "@lowcoder-ee/comps/controls/boolControl";
import { useContext, useEffect, useRef, useState } from "react";
import { EditorContext } from "comps/editorState";
import { ButtonEventHandlerControl, IconControl, MultiCompBuilder, CardStyleType, StringControl, clickEvent, dropdownControl, eventHandlerControl, heightCalculator, optionsControl, refreshEvent, styleControl, widthCalculator, withDefault, CardStyle, CardEventHandlerControl } from "@lowcoder-ee/index.sdk";
import { Card } from "antd";
import styled from "styled-components";
const { Meta } = Card;

const Warpper = styled.div<{ $style: CardStyleType | undefined, showMate: boolean, cardType: string }>`
  height: 100%;
  width: 100%;
  .ant-card-small >.ant-card-head {
    background-color: ${props => props.$style?.background};
    margin-bottom: 0px;
    border-bottom: 1px solid ${props => props.$style?.border};
  }
  .ant-card .ant-card-actions {
    border-top: 1px solid ${props => props.$style?.border};
  }
  .ant-card .ant-card-actions>li:not(:last-child) {
    border-inline-end: 1px solid ${props => props.$style?.border};
  }
  .ant-card-small >.ant-card-body {
    padding: ${props => props.cardType == 'custom' ? '0px' : '10px'};
  }
  .ant-card .ant-card-head {
    background-color: ${props => props.$style?.background};
    border-bottom: 1px solid ${props => props.$style?.border};
  }
  .ant-card-small >.ant-card-body {
    background-color: ${props => props.$style?.background};
  }
  .ant-card .ant-card-actions {
    background-color: ${props => props.$style?.background};
  }
  .ant-card .ant-card-body {
    padding: ${props => props.cardType == 'custom' ? '0px' : '10px'};
  }
  .ant-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: ${props => props.$style?.background};
  }
  .ant-card-body {
    display: ${props => props.showMate ? '' : 'none'};
    height: ${props => props.cardType == 'custom' ? '100%' : 'auto'};
  }
`;

const ContainWarpper = styled.div`
  height: 100%;
  width: 100%;
`

const IconWarpper = styled.div<{ $style: CardStyleType | undefined, disabled: boolean }>`
  pointer-events: ${props => props.disabled ? 'none' : ''};
  svg {
    color: ${props => props.disabled ? '#d9d9d9' : props.$style?.IconColor};
  }
  &:hover {
    svg {
      color: ${props => props.$style?.activateColor};
    }
}
`

const cardTypeOption = [
  { label: trans("card.common"), value: "common" },
  { label: trans("card.custom"), value: "custom" },
] as const;

const sizeOptions = [
  { label: trans("card.default"), value: "default" },
  { label: trans("card.small"), value: "small" },
] as const;

const EventOptions = [clickEvent, refreshEvent] as const;

const ActionIconOption = new MultiCompBuilder(
  {
    label: StringControl,
    icon: withDefault(IconControl, "/icon:antd/settingoutlined"),
    disabled: BoolCodeControl,
    hidden: BoolCodeControl,
    onEvent: ButtonEventHandlerControl,
  },
  (props) => props
)
  .setPropertyViewFn((children) => (
    <>
      {children.icon.propertyView({ label: trans("button.icon") })}
      {disabledPropertyView(children)}
      {hiddenPropertyView(children)}
      {children.onEvent.getPropertyView()}
    </>
  ))
  .build();

const ActionOptionControl = optionsControl(ActionIconOption, {
  initOptions: [
    { label: trans("optionsControl.optionI", { i: 1 }), icon: "/icon:antd/settingoutlined" },
    { label: trans("optionsControl.optionI", { i: 2 }), icon: "/icon:antd/editoutlined" },
    { label: trans("optionsControl.optionI", { i: 3 }), icon: "/icon:antd/ellipsisoutlined" },
  ],
});

export const ContainerBaseComp = (function () {
  const childrenMap = {
    showTitle: BoolControl.DEFAULT_TRUE,
    title: withDefault(StringControl, trans('card.title')),
    size: dropdownControl(sizeOptions, 'small'),
    extraTitle: withDefault(StringControl, trans('card.more')),
    cardType: dropdownControl(cardTypeOption, 'common'),
    CoverImg: BoolControl.DEFAULT_TRUE,
    imgSrc: withDefault(StringControl, "https://lowcoder.cloud/images/e0a89736c6be4393893d2981ac1fd753.png"),
    imgHeight: withDefault(StringControl, 'auto'),
    showMeta: BoolControl.DEFAULT_TRUE,
    metaTitle: withDefault(StringControl, trans('card.metaTitle')),
    metaDesc: withDefault(StringControl, trans('card.metaDesc')),
    hoverable: BoolControl.DEFAULT_TRUE,
    showActionIcon: BoolControl.DEFAULT_TRUE,
    actionOptions: ActionOptionControl,

    onEvent: CardEventHandlerControl,
    style: styleControl(CardStyle),
  };

  return new ContainerCompBuilder(childrenMap, (props, dispatch) => {
    props.container.showHeader = false;
    // 注入容器参数
    props.container.style = Object.assign(props.container.style, {
      CONTAINER_BODY_PADDING: props.style.containerBodyPadding,
      border: '#00000000',
      background: props.style.background,
    })
    const conRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    useEffect(() => {
      if (height && width) {
        onResize();
      }
    }, [height, width]);

    const onResize = () => {
      const container = conRef.current;
      setWidth(container?.clientWidth ?? 0);
      setHeight(container?.clientHeight ?? 0);
    };
    return (
      <ReactResizeDetector onResize={onResize}>
        <Warpper
          ref={conRef}
          $style={props.style}
          showMate={props.showMeta || props.cardType == 'custom'}
          cardType={props.cardType}
          onMouseEnter={() => props.onEvent('focus')}
          onMouseLeave={() => props.onEvent('blur')}
          onClick={() => props.onEvent('click')}
        >
          {<Card
            style={{ width: width, height: '100%' }}
            size={props.size}
            hoverable={props.hoverable}
            // 标题设置
            title={props.showTitle && props.title}
            extra={props.showTitle && <a href="#" onClick={() => props.onEvent('clickExtra')}>{props.extraTitle}</a>}

            // 内容
            cover={props.cardType == 'common' && props.CoverImg && <img src={props.imgSrc} height={props.imgHeight} />}
            actions={props.cardType == 'common' && props.showActionIcon ?
              props.actionOptions.filter(item => !item.hidden).map(item => {
                return (
                  <IconWarpper
                    onClick={() => item.onEvent('click')}
                    disabled={item.disabled}
                    $style={props.style}
                  >
                    {item.icon}
                  </IconWarpper>)
              }
              ) : []
            }
          >
            {props.cardType == 'common' && props.showMeta && <Meta title={props.metaTitle} description={props.metaDesc} />}
            {props.cardType == 'custom' && <ContainWarpper>
              <TriContainer {...props} /></ContainWarpper>}
          </Card>
          }
        </Warpper>
      </ReactResizeDetector>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.basic}>
                {children.size.propertyView({
                  label: trans("card.titleSize"),
                  radioButton: true,
                })}
                {children.showTitle.propertyView({ label: trans('card.showTitle') })}
                {children.showTitle.getView() && children.title.propertyView({ label: trans('card.title') })}
                {children.showTitle.getView() && children.extraTitle.propertyView({ label: trans('card.extraTitle') })}
                {
                  children.cardType.getView() == 'common' &&
                  children.CoverImg.propertyView({ label: trans('card.CoverImg') })
                }

                {
                  children.cardType.getView() == 'common' &&
                  children.CoverImg.getView() &&
                  children.imgSrc.propertyView({ label: trans('card.imgSrc') })
                }
                {
                  children.cardType.getView() == 'common' &&
                  children.CoverImg.getView() &&
                  children.imgHeight.propertyView({ label: trans('card.imgHeight') })
                }
                {
                  children.cardType.getView() == 'common' &&
                  children.showMeta.propertyView({ label: trans('card.showMeta') })
                }
                {
                  children.cardType.getView() == 'common' &&
                  children.showMeta.getView() &&
                  children.metaTitle.propertyView({ label: trans('card.metaTitle') })
                }
                {
                  children.cardType.getView() == 'common' &&
                  children.showMeta.getView() &&
                  children.metaDesc.propertyView({ label: trans('card.metaDesc') })
                }

                {
                  children.cardType.getView() == 'common' &&
                  children.showActionIcon.propertyView({ label: trans('card.showActionIcon') })
                }
                {
                  children.cardType.getView() == 'common' &&
                  children.showActionIcon.getView() &&
                  children.actionOptions.propertyView({ title: trans('card.actionOptions') })
                }

              </Section>
              <Section name={sectionNames.interaction}>
                {hiddenPropertyView(children)}
                {children.onEvent.getPropertyView()}
              </Section>
            </>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.layout}>
                {children.cardType.propertyView({
                  label: trans("card.cardType"),
                  radioButton: true,
                })}
              </Section>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
            </>
          )}
        </>
      );
    })
    .build();
})();

export const CardComp = withExposingConfigs(ContainerBaseComp, [NameConfigHidden]);

