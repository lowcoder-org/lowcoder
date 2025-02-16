import { CompAction, RecordConstructorToComp, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { arrayObjectExposingStateControl, arrayStringExposingStateControl } from "comps/controls/codeStateControl";
import { styleControl } from "comps/controls/styleControl";
import { TransferStyle, TransferStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { NewChildren, UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { default as Transfer } from "antd/es/transfer";
import type { TransferKey } from "antd/es/transfer/interface";
import ReactResizeDetector from "react-resize-detector";
import { changeEvent, eventHandlerControl, searchEvent, selectedChangeEvent } from "../controls/eventHandlerControl";
import styled, { css } from "styled-components";
import { useContext, useEffect, useRef, useState } from "react";
import { valueComp, withDefault } from "../generators";
import type { TransferDirection } from 'antd/es/transfer';
import React from "react";

const Container = styled.div<{ $style: TransferStyleType }>`
  height: 100%;
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: TransferStyleType) => {
  return css`
    margin: ${style.margin};
    padding: ${style.padding};
    border-style: ${style.borderStyle};
    border-width: ${style.borderWidth};
    border-color: ${style.border};
    background: ${style.background};
    border-radius: ${style.radius};
    max-width: ${widthCalculator(style.margin)};
    max-height: ${heightCalculator(style.margin)};
  `;
};

interface RecordType {
  key: string;
  title: string;
  description?: string;
}
const defaultItems = [
  { key: '1', title: trans('transfer.content', { i: 1 }) },
  { key: '2', title: trans('transfer.content', { i: 2 }) },
  { key: '3', title: trans('transfer.content', { i: 3 }) },
  { key: '4', title: trans('transfer.content', { i: 4 }) },
  { key: '5', title: trans('transfer.content', { i: 5 }) },
  { key: '6', title: trans('transfer.content', { i: 6 }) },
  { key: '7', title: trans('transfer.content', { i: 7 }) },
] as const

const EventOptions = [changeEvent, searchEvent, selectedChangeEvent] as const;

const childrenMap = {
  style: styleControl(TransferStyle , 'style'),
  onEvent: eventHandlerControl(EventOptions),
  sourceTitle: withDefault(StringControl, trans('transfer.sourceTitle')),
  targetTitle: withDefault(StringControl, trans('transfer.targetTitle')),
  oneWay: BoolControl,
  pagination: BoolControl,
  showSearch: BoolControl.DEFAULT_TRUE,
  pageSize: withDefault(NumberControl, 10),
  items: arrayObjectExposingStateControl('items', defaultItems as any),
  targetKeys: arrayStringExposingStateControl('targetKeys', []),
  selectedKeys: valueComp<any>([[], []]),
  targerObject: valueComp<any>([]),
  searchInfo: valueComp<string[]>(['', '']),
};

type ChildrenType = NewChildren<RecordConstructorToComp<typeof childrenMap>>;

const TransferView = React.memo((props: RecordConstructorToView<typeof childrenMap> & {
  dispatch: (action: CompAction) => void;
}) => {
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  const handleChange = (newTargetKeys: TransferKey[]) => {
    props.targetKeys.onChange(newTargetKeys as string[]);
    props.dispatch(changeChildAction("targerObject", Array.isArray(props.items.value) ? props.items.value.filter(item => newTargetKeys.includes(item.key as string)) : [], false));
    props.onEvent('change')
  };

  const onSelectChange = (sourceSelectedKeys: TransferKey[], targetSelectedKeys: TransferKey[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys] as string[]);
    props.dispatch(changeChildAction("selectedKeys", [sourceSelectedKeys as string[], targetSelectedKeys as string[]], false));
    props.onEvent('selectedChange')
  };

  const handleSearch = (dir: TransferDirection, value: string) => {
    props.dispatch(changeChildAction("searchInfo", [dir, value], false));
    props.onEvent('search')
  };

  const onResize = () => {
    const container = conRef.current;
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };
  
  return (
    <ReactResizeDetector onResize={onResize}>
      <Container
        ref={conRef}
        $style={props.style}
      >
        <Transfer
          listStyle={{
            width: width,
            height: height,
          }}
          showSearch={props.showSearch}
          dataSource={props.items.value as any}
          titles={[props.targetTitle, props.sourceTitle]}
          targetKeys={props.targetKeys.value}
          selectedKeys={selectedKeys}
          onChange={handleChange}
          onSelectChange={onSelectChange}
          render={(item: RecordType) => item.title}
          oneWay={props.oneWay}
          onSearch={handleSearch}
          pagination={props.pagination ? {
            pageSize: props.pageSize || 10,
          } : false}
        />
      </Container>
    </ReactResizeDetector>
  );
});

const TransferCompPropertyView = React.memo((props: {
  children: ChildrenType
}) => {
  return (
    <>
      <Section name={sectionNames.basic}>
        {props.children.items.propertyView({
          label: trans("transfer.items"),
        })}
        {props.children.targetKeys.propertyView({
          label: trans("transfer.targetKeys"),
        })}
        {props.children.sourceTitle.propertyView({
          label: trans("transfer.sourceTitle"),
        })}
        {props.children.targetTitle.propertyView({
          label: trans("transfer.targetTitle"),
        })}
        {props.children.showSearch.propertyView({
          label: trans("transfer.allowSearch"),
        })}
        {props.children.oneWay.propertyView({
          label: trans("transfer.oneWay"),
        })}
        {props.children.pagination.propertyView({
          label: trans("transfer.pagination"),
        })}
        {props.children.pagination.getView() && props.children.pageSize.propertyView({
          label: trans("transfer.pageSize"),
        })}
      </Section>
      <Section name={sectionNames.interaction}>
        {props.children.onEvent.propertyView()}
        {hiddenPropertyView(props.children)}
        {showDataLoadingIndicatorsPropertyView(props.children)}
      </Section>
      <Section name={sectionNames.style}>{props.children.style.getPropertyView()}</Section>
    </>
  )
});

let TransferBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    return (
    <TransferView {...props} dispatch={dispatch} />)})
    .setPropertyViewFn((children) => <TransferCompPropertyView children={children} />)
    .build();
})();

TransferBasicComp = class extends TransferBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const transferComp = withExposingConfigs(TransferBasicComp, [
  new NameConfig("items", trans("transfer.items")),
  new NameConfig("targetKeys", trans("transfer.targetKeys")),
  new NameConfig("targerObject", trans("transfer.targerObject")),
  new NameConfig("selectedKeys", trans("transfer.selectedKeys")),
  new NameConfig("searchInfo", trans("transfer.searchInfo")),
  NameConfigHidden,
]);
