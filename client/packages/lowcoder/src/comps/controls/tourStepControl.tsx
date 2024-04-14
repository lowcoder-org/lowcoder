import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { MultiCompBuilder, withDefault } from "comps/generators";
import { list } from "comps/generators/list";
import { ToViewReturn } from "comps/generators/multi";
import { genRandomKey } from "comps/utils/idGenerator";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { mapValues } from "lodash";
import {
  Comp,
  CompParams,
  ConstructorToDataType,
  ConstructorToView,
  fromRecord,
  MultiBaseComp,
  SimpleAbstractComp,
  withFunction
} from "lowcoder-core";
import { controlItem, Dropdown, Option, OptionsType, ValueFromOption } from "lowcoder-design";
import { getNextEntityName } from "util/stringUtils";
import { BoolControl, ControlParams } from "lowcoder-sdk";
import { ReactNode, useContext, useEffect, useState } from "react";
import { EditorContext, EditorState } from "@lowcoder-ee/comps/editorState";
// import { PlacementType } from "@rc-component"
export type PlacementType = 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'center';

const OptionTypes = [
  {
    label: trans("prop.manual"),
    value: "manual",
  },
  {
    label: trans("prop.map"),
    value: "map",
  },
] as const;

// All options must contain label
type OptionChildType = { label: InstanceType<typeof StringControl> };
type TourControlType = new (params: CompParams<any>) => MultiBaseComp<
  OptionChildType,
  any,
  any
> &
  Comp<any, any, any>;
type OptionControlParam = {
  // list title
  title?: string;
  // The new option's label name
  newOptionLabel?: string;
};

type OptionPropertyParam = {
  autoMap?: boolean;
};

interface TourStepCompProperty {
  propertyView(param: OptionPropertyParam): React.ReactNode;
}

function hasPropertyView(comp: any): comp is TourStepCompProperty {
  return !!(comp as any).propertyView;
}

// Add dataIndex to each comp, required for drag and drop sorting
function withDataIndex<T extends TourStepControlType>(VariantComp: T) {
  // @ts-ignore
  class WithDataIndexComp extends VariantComp {
    dataIndex: string = genRandomKey();

    getDataIndex() {
      return this.dataIndex;
    }
  }

  return WithDataIndexComp as new (
    params: CompParams<ConstructorToDataType<T>>
  ) => WithDataIndexComp;
}

// Deduplication, the same value takes the first one
function distinctValue<T extends ToViewReturn<OptionChildType>>(data: T[], uniqField: keyof T) {
  if (!data || data.length <= 0) {
    return data;
  }
  const result: T[] = [];
  data.reduce((uniqValSet, item) => {
    const uniqVal = item[uniqField];
    if (!uniqValSet.has(uniqVal)) {
      result.push(item);
    }
    uniqValSet.add(uniqVal);
    return uniqValSet;
  }, new Set());
  return result;
}

type PickNumberFields<T> = {
  [key in keyof T]: T[key] extends number ? T[key] : never;
};

// Manually add options
export function manualTourStepsControl<T extends TourStepControlType>(
  VariantComp: T,
  config: {
    // init value
    initOptions?: ConstructorToDataType<T>[];
    // Unique value field, used to deduplicate
    uniqField?: keyof ConstructorToView<T>;
    // auto-increment field
    autoIncField?: keyof PickNumberFields<ConstructorToView<T>>;
  }
) {
  type OptionDataType = ConstructorToDataType<T>;
  const ManualComp = list(withDataIndex(VariantComp));
  const TmpManualOptionControl = new MultiCompBuilder(
    {
      manual: ManualComp,
    },
    (props) => {
      const view = props.manual.map((m) => m.getView());
      return config.uniqField ? distinctValue(view, config.uniqField) : view;
    }
  )
    .setPropertyViewFn(() => {
      throw new Error("Method not implemented.");
    })
    .build();

  class ManualOptionControl extends TmpManualOptionControl {
    exposingNode() {
      return withFunction(
        fromRecord(
          mapValues(this.children.manual.children, (c1) =>
            fromRecord(mapValues(c1.children, (c2) => c2.exposingNode()))
          )
        ),
        (params) => Object.values(params)
      );
    }

    private getNewId(): number {
      const { autoIncField } = config;
      if (!autoIncField) return 0;
      const view = this.children.manual.getView().map((m) => m.getView());
      const ids = new Set(view.map((tab) => tab[autoIncField]));
      let id = 0;
      while (ids.has(id)) ++id;
      return id;
    }

    propertyView(param: OptionControlParam) {
      const manualComp = this.children.manual;
      const { autoIncField } = config;
      const title = param.title ?? trans("optionsControl.optionList");

      return controlItem(
        { filterText: title },
        <Option
          itemTitle={(comp) => comp.children.title.getView()}
          popoverTitle={() => trans("edit")}
          content={(comp) => {
            return hasPropertyView(comp) ? comp.propertyView({}) : comp.getPropertyView();
          }}
          items={manualComp.getView()}
          onAdd={() => {
            const label = getNextEntityName(
              param.newOptionLabel || trans("optionsControl.option") + " ",
              manualComp.getView().map((m) => m.children.title.getView())
            );
            const id = this.getNewId();
            manualComp.dispatch(
              manualComp.pushAction({
                label: label,
                ...(autoIncField ? { [autoIncField]: id } : {}),
              } as OptionDataType)
            );
          }}
          onDel={(i) => manualComp.dispatch(manualComp.deleteAction(i))}
          onCopy={(comp) => {
            const id = this.getNewId();
            manualComp.dispatch(
              manualComp.pushAction({
                ...comp.toJsonValue(),
                ...(autoIncField ? { [autoIncField]: id } : {}),
              })
            );
          }}
          onMove={(fromIndex, toIndex) => {
            const action = manualComp.arrayMoveAction(fromIndex, toIndex);
            manualComp.dispatch(action);
          }}
          dataIndex={(comp) => comp.getDataIndex()}
          uniqVal={
            config.uniqField && ((comp) => (comp.children as any)[config.uniqField].getView())
          }
          title={title}
        />
      );
    }
  }

  return config.initOptions
    ? withDefault(ManualOptionControl, { manual: config.initOptions })
    : ManualOptionControl;
}

type TourStepChildType = { 
  title: InstanceType<typeof StringControl>,
};
type TourStepControlType = new (params: CompParams<any>) => MultiBaseComp<
  TourStepChildType,
  any,
  any
> &
  Comp<any, any, any>;

export function tourStepsControl<T extends TourStepControlType>(
  VariantComp: T,
  config: {
    // init value
    initOptions?: ConstructorToDataType<T>[];
    // manual mode list title
    title?: string;
  }
) {
  type OptionViewType = ConstructorToView<T>;

  const TmpOptionControl = new MultiCompBuilder(
    {
      optionType: dropdownControl(OptionTypes, "manual"),
      manual: manualTourStepsControl(VariantComp, {
        initOptions: config.initOptions,
      }),
    },
    (props): OptionViewType[] => {
      return props.manual;
    }
  )
    .setPropertyViewFn(() => {
      throw new Error("Method not implemented.");
    })
    .build();

  return class extends TmpOptionControl {
    exposingNode() {
      return this.children.manual.exposingNode();
    }

    propertyView(param: OptionControlParam) {
      const item = this.children.manual.propertyView(param);
      return controlItem(
        { searchChild: true },
        <>
          {this.children.optionType.propertyView({
            radioButton: true,
            type: "oneline",
          })}
          {item}
        </>
      );
    }
  };
}

const PlacementOptions: {label: string, value: PlacementType}[] = [
  { label: "Center", value: "center"},
  { label: "Left", value: "left"},
  { label: "Left Top", value: "leftTop"},
  { label: "Left Bottom", value: "leftBottom"},
  { label: "Right", value: "right"},
  { label: "Right Top", value: "rightTop"},
  { label: "Right Bottom", value: "rightBottom"},
  { label: "Top", value: "top"},
  { label: "Top Left", value: "topLeft"},
  { label: "Top Right", value: "topRight"},
  { label: "Bottom", value: "bottom"},
  { label: "Bottom Left", value: "bottomLeft"},
  { label: "Bottom Right", value: "bottomRight"},
];


export function editorStateDropdownControl<T extends OptionsType>(
  options: ((editorState: EditorState) => T),
  defaultValue: ValueFromOption<T>
) {
  return class extends editorStateDropdownAbstractControl(options, defaultValue) {
    override getView() {
      return this.value;
    }
  };
}

interface EditorStateDropdownControlParams<T extends OptionsType> extends ControlParams {
  radioButton?: boolean;
  border?: boolean;
  type?: "oneline";
  disabled?: boolean;
  // parent comp may batch dispatch in some cases
  disableDispatchValueChange?: boolean;
  onChange?: (value: string) => void;
  options?: T;
  showSearch?: boolean;
  dropdownStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}
type EditorStateDropdownOptions<T extends OptionsType> = (editorState: EditorState) => T;

interface DropdownPropertyViewProps<T extends OptionsType>
  extends Omit<EditorStateDropdownControlParams<T>, "options"> {
  options: EditorStateDropdownOptions<T>;
  onChange: (value: ValueFromOption<T>) => void;
  value: ValueFromOption<T>;
}

function EditorStateDropdownPropertyView<T extends OptionsType>(props: DropdownPropertyViewProps<T>) {
  const { options, onChange, value, ...params } = props;
  const [finalOptions, setFinalOptions] = useState<T>(
    typeof options === "function" ? ([] as unknown as T) : options
  );
  const editorState = useContext(EditorContext);

  useEffect(() => {
    if (typeof options !== "function") {
      setFinalOptions(options);
      return;
    }
    if (!finalOptions?.length) {
      setFinalOptions(options(editorState))
        //.then((items) => setFinalOptions(items));
    }
  }, [finalOptions.length, options]);

  return (
    <Dropdown
      placement={params.placement}
      toolTip={params.tooltip}
      value={value}
      options={finalOptions}
      radioButton={params.radioButton}
      border={params.border}
      type={params.type}
      label={params.label}
      showSearch={params.showSearch}
      onChange={onChange}
      disabled={params.disabled}
      dropdownStyle={props.dropdownStyle}
      labelStyle={props.labelStyle}
    />
  );
}

/**
 * Leave a getView method unimplemented, because the type cannot be changed by inheritance
 */
export function editorStateDropdownAbstractControl<T extends OptionsType>(
  options: ((editorState: EditorState) => T),
  defaultValue: ValueFromOption<T>
) {
  abstract class DropdownControl extends SimpleAbstractComp<ValueFromOption<T>> {
    override getDefaultValue(): ValueFromOption<T> {
      return defaultValue;
    }

    propertyView(params: EditorStateDropdownControlParams<T>) {
      return controlItem(
        { filterText: params.label },
        <EditorStateDropdownPropertyView<T>
          {...params}
          value={this.value}
          options={options}
          onChange={(value) => {
            if (!params.disableDispatchValueChange) {
              this.dispatchChangeValueAction(value);
            }
            params.onChange?.(value);
          }}
        />
      );
    }

    getPropertyView(): ReactNode {
      throw new Error("Method not implemented.");
    }
  }

  return DropdownControl;
}

let TourStep = new MultiCompBuilder(
  {
    target: editorStateDropdownControl((editorState) =>
        Object.values(editorState.getAllUICompMap()).map((it) => ({
          label: it.children.name.getView(),
          value: it.children.name.getView()
        })),
      ""),
    arrow: BoolControl,
    title: StringControl,
    description: StringControl,
    placement: dropdownControl(PlacementOptions, "bottom"),
    hidden: BoolCodeControl,
  },
  (props) => props
).build();

TourStep = class extends TourStep implements TourStepCompProperty {
  propertyView(param: { autoMap?: boolean }) {
    return (
      <>
        {this.children.title.propertyView({
          label: "Title",
          placeholder: "Welcome",
        })}
        {this.children.description.propertyView({
          label: "Description",
          placeholder: "Welcome to lowcoder, this is your first tutorial step",
        })}
        {this.children.target.propertyView({
          label: "TARGET",
          radioButton: false,
        })}
        {this.children.placement.propertyView({
          label: trans("textShow.verticalAlignment"),
          radioButton: false
        })}
        {this.children.arrow.propertyView({
          label: "Arrow"
        })}
        {hiddenPropertyView(this.children)}
      </>
    );
  }
};

export const TourStepControl = tourStepsControl(TourStep, {
  initOptions: [
    { title: "Welcome", description: "Welcome to lowcoder" },
    { title: "Step 2", description: "This is a tutorial step" },
  ],
});
