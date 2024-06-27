import ReactResizeDetector from "react-resize-detector";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { TriContainer } from "../triContainerComp/triContainer";
import {
  ContainerCompBuilder,
} from "../triContainerComp/triContainerCompBuilder";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { useContext, useEffect, useRef, useState } from "react";
import { EditorContext } from "comps/editorState";
import { Card } from "antd";
import styled from "styled-components";
import { AnimationStyle, AnimationStyleType, CardHeaderStyle, CardHeaderStyleType, CardStyle, CardStyleType } from "comps/controls/styleControlConstants";
import { MultiCompBuilder, withDefault } from "comps/generators";
import { IconControl } from "comps/controls/iconControl";
import { ButtonEventHandlerControl, CardEventHandlerControl, clickEvent, refreshEvent } from "comps/controls/eventHandlerControl";
import { optionsControl } from "comps/controls/optionsControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
const { Meta } = Card;

const Wrapper = styled.div<{
  $style: CardStyleType | undefined;
  $showMate: boolean;
  $cardType: string;
  $headerStyle: CardHeaderStyleType;
  $bodyStyle: CardHeaderStyleType;
  $animationStyle:AnimationStyleType;
}>`
  height: 100%;
  width: 100%;
  .ant-card-small >.ant-card-head {
    background-color: ${props => props.$headerStyle?.background} !important;
    border: ${props => props.$headerStyle?.border};
    border-style: ${props => props.$headerStyle?.borderStyle};
    border-width: ${props => props.$headerStyle?.borderWidth};
    border-radius: ${props => props.$headerStyle?.radius};
    font-size: ${props => props.$headerStyle?.textSize};
    font-style: ${props => props.$headerStyle?.fontStyle};
    font-family: ${props => props.$headerStyle?.fontFamily};
    font-weight: ${props => props.$headerStyle?.textWeight};
    text-transform: ${props => props.$headerStyle?.textTransform};
    text-decoration: ${props => props.$headerStyle?.textDecoration};
    color: ${props => props.$headerStyle?.text};
    rotate: ${props => props.$headerStyle?.rotation};
    margin: ${props => props.$headerStyle?.margin};
    padding: ${props => props.$headerStyle?.padding};
  }
  .ant-card-head-title{
    font-size: ${props => props.$headerStyle?.textSize};
    font-family: ${props => props.$headerStyle?.fontFamily};
  }
  .ant-card .ant-card-actions {
    border-top: 1px solid ${props => props.$style?.border};
  }
  .ant-card .ant-card-actions>li:not(:last-child) {
    border-inline-end: 1px solid ${props => props.$style?.border};
  }
  .ant-card .ant-card-actions {
    background-color: ${props => props.$style?.background};
  }
  .ant-card .ant-card-body {
   background-color: ${props => props.$bodyStyle?.background} !important;
    border: ${props => props.$bodyStyle?.border};
    border-style: ${props => props.$bodyStyle?.borderStyle};
    border-width: ${props => props.$bodyStyle?.borderWidth};
    border-radius: ${props => props.$bodyStyle?.radius};
    rotate: ${props => props.$bodyStyle?.rotation};
    margin: ${props => props.$bodyStyle?.margin};
    padding: ${props => props.$bodyStyle?.padding};
  }
  .ant-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: ${props => props.$style?.margin};
    padding: ${props => props.$style?.padding};
    background-color: ${props => props.$style?.background};
    border: ${props => props.$style?.border};
    rotate: ${props => props.$style?.rotation};
    border-style: ${props => props.$style?.borderStyle};
    border-radius: ${props => props.$style?.radius};
    border-width: ${props => props.$style?.borderWidth};
    box-shadow: ${props=>`${props.$style?.boxShadow} ${props.$style?.boxShadowColor}`};
    ${props=>props.$animationStyle}
  }
  .ant-card-body {
    display: ${props => props.$showMate ? '' : 'none'};
    height: ${props => props.$cardType == 'custom' ? '100%' : 'auto'};
  }
  .ant-card-body .ant-card-meta .ant-card-meta-title{
    color: ${props => props.$bodyStyle?.text} !important;
    font-size: ${props => props.$bodyStyle?.textSize};
    font-style: ${props => props.$bodyStyle?.fontStyle};
    font-family: ${props => props.$bodyStyle?.fontFamily};
    font-weight: ${props => props.$bodyStyle?.textWeight};
    text-transform: ${props => props.$bodyStyle?.textTransform};
    text-decoration: ${props => props.$bodyStyle?.textDecoration};
  }
  .ant-card-body .ant-card-meta .ant-card-meta-description{
    color: ${props => props.$bodyStyle?.text} !important;
    font-size: ${props => props.$bodyStyle?.textSize};
    font-style: ${props => props.$bodyStyle?.fontStyle};
    font-family: ${props => props.$bodyStyle?.fontFamily};
    font-weight: ${props => props.$bodyStyle?.textWeight};
    text-transform: ${props => props.$bodyStyle?.textTransform};
    text-decoration: ${props => props.$bodyStyle?.textDecoration};
  }
`;

const ContainWrapper = styled.div`
  height: 100%;
  width: 100%;
`

const IconWrapper = styled.div<{ $style: CardStyleType | undefined, disabled: boolean }>`
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
    headerStyle: styleControl(CardHeaderStyle),
    bodyStyle: styleControl(CardHeaderStyle),
    animationStyle: styleControl(AnimationStyle),
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
        <Wrapper
          ref={conRef}
          $style={props.style}
          $animationStyle={props.animationStyle}
          $headerStyle={props.headerStyle}
          $bodyStyle={props.bodyStyle}
          $showMate={props.showMeta || props.cardType == 'custom'}
          $cardType={props.cardType}
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
                  <IconWrapper
                    onClick={() => item.onEvent('click')}
                    disabled={item.disabled}
                    $style={props.style}
                  >
                    {item.icon}
                  </IconWrapper>)
              }
              ) : []
            }
          >
            {props.cardType == 'common' && props.showMeta && <Meta title={props.metaTitle} description={props.metaDesc} />}
            {props.cardType == 'custom' && <ContainWrapper>
              <TriContainer {...props} /></ContainWrapper>}
          </Card>
          }
        </Wrapper>
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
              <Section name={sectionNames.headerStyle}>
                {children.headerStyle.getPropertyView()}
              </Section>
              <Section name={sectionNames.bodyStyle}>
                {children.bodyStyle.getPropertyView()}
              </Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
              </Section>
            </>
          )}
        </>
      );
    })
    .build();
})();

export const CardComp = withExposingConfigs(ContainerBaseComp, [NameConfigHidden]);

