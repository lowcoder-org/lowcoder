import { default as Form } from "antd/es/form";
import { default as FormItem } from "antd/es/form/FormItem";
import type { FormListProps, Rule } from "antd/es/form";
import { TacoButton } from "lowcoder-design/src/components/button"
import { Input } from "lowcoder-design/src/components/Input";
import styled from "styled-components";
import LinkPlusButton from "./LinkPlusButton";
import { BluePlusIcon } from "lowcoder-design/src/icons";
import { useEffect } from "react";
import { useForm } from "antd/es/form/Form";
import { trans } from "i18n";

const StyledItem = styled(FormItem)`
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 2px;
  }
  .ant-row {
    flex: 1;
  }
  .ant-form-item-control-input-content {
    display: flex;
    .ant-input-affix-wrapper {
      flex: 1;
      margin-right: 8px;
    }
  }
`;

interface InputListProps extends Omit<FormListProps, "name"> {
  addBtnText?: string;
  placeholder?: string;
  itemRules?: Rule[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

export default function InputList(props: Omit<InputListProps, "children">) {
  const {
    value,
    onChange,
    addBtnText = trans("addItem"),
    placeholder,
    itemRules,
    ...otherProps
  } = props;
  const [form] = useForm();

  useEffect(() => {
    form.setFieldsValue({
      value,
    });
  }, [form, value]);

  return (
    <Form
      form={form}
      component={false}
      onValuesChange={(_, v) => props.onChange?.(v.value as string[])}
    >
      <Form.List name="value" {...otherProps}>
        {(fields, { add, remove }) => (
          <div>
            <div>
              {fields.map((field) => (
                <StyledItem style={{ display: "flex" }} key={field.key}>
                  <Form.Item
                    {...field}
                    validateTrigger={["onChange", "onBlur"]}
                    rules={itemRules}
                    noStyle
                  >
                    <Input allowClear autoComplete="off" placeholder={placeholder} />
                  </Form.Item>
                  <TacoButton onClick={() => remove(field.name)}>{trans("remove")}</TacoButton>
                </StyledItem>
              ))}
            </div>
            <StyledItem>
              <LinkPlusButton onClick={() => add("")} icon={<BluePlusIcon />}>
                {addBtnText}
              </LinkPlusButton>
            </StyledItem>
          </div>
        )}
      </Form.List>
    </Form>
  );
}
