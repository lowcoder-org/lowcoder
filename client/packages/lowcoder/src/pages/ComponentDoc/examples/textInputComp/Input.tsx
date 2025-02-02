import { InputComp } from "comps/comps/textInputComp/inputComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function InputExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.placeholder")}
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: false,
          }}
          compFactory={InputComp}
        />
        <Example
          title="Default Value"
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: false,
            defaultValue: "Default Text",
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: true,
          }}
          compFactory={InputComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.left")}
          config={{
            label: { text: trans("componentDoc.userName"), position: "row" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.column")}
          config={{
            label: { text: trans("componentDoc.userName"), position: "column" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.textAlign")}
          config={{
            label: { text: trans("componentDoc.userName"), align: "right" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title="Tooltip"
          config={{
            label: { text: trans("componentDoc.userName"), align: "right", tooltip:"This is a Tooltip" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.workCount")}
          config={{
            showCount: "true",
          }}
          compFactory={InputComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")} description="">
        <Example
          title={trans("componentDoc.required")}
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.length")}
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            minLength: 3,
            maxLength: 6,
          }}
          compFactory={InputComp}
        />
         <Example
          title="Show Clear Button & Show Validation on Empty/Reset"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            defaultValue: "Default Text",
            required: true,
            allowClear: true,
            showValidationWhenEmpty: true,
          }}
          compFactory={InputComp}
        />
        <Example
          title="Custom Rule"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            customRule: "{{Number(input1.value) <= 0 ? 'Value can't be less than or equal to 0' : ''}}",
            validationType: "Text",
          }}
          compFactory={InputComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Input Type">
        <Example
          title="Email"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
            validationType: "Email",
          }}
          compFactory={InputComp}
        />
        <Example
          title="URL"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
            validationType: "URL",
          }}
          compFactory={InputComp}
        />
        <Example
          title="Regex"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
            validationType: "Regex",
            regex: "^[A-Z]{3}\\d[a-z]{3}\\d[A-Z]{3}\\d$"
          }}
          compFactory={InputComp}
        />
      </ExampleGroup>
    </>
  );
}
