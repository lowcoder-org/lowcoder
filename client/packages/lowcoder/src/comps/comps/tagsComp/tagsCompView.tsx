import { AnimationStyle, BoolCodeControl, ButtonEventHandlerControl, CommonNameConfig, DropdownOptionControl, IconControl, LinkStyle, NameConfig, NameConfigDisabled, RefControl, Section, SelectOptionControl, StringControl, TabsOptionControl, TagsOptionControl, UICompBuilder, blurMethod, clickMethod, focusWithOptions, migrateOldData, refMethods, sectionNames, stringExposingStateControl, styleControl, withDefault, withExposingConfigs } from "@lowcoder-ee/index.sdk";
import React from "react";
import { trans } from "i18n";
import { buttonRefMethods } from "../buttonComp/buttonCompConstants";
import { Tag } from "antd";
import { autoCompleteRefMethods } from "../autoCompleteComp/autoCompleteConstants";


// const TagsCompView = (function () {
//     // const childrenMap = {
//     //     text: withDefault(StringControl, trans("link.link")),
//     //     onEvent: ButtonEventHandlerControl,
//     //     disabled: BoolCodeControl,
//     //     loading: BoolCodeControl,
        
//     //     // style: migrateOldData(styleControl(LinkStyle, 'style')),
//     //     animationStyle: styleControl(AnimationStyle, 'animationStyle'),
//     //     prefixIcon: IconControl,
//     //     suffixIcon: IconControl,
//     //     viewRef: RefControl<HTMLElement>,
//     //   };

//     const childrenMap = {
//         text: stringExposingStateControl("text", "world"),
//         // options: TabsOptionControl,
//     };
//     return new UICompBuilder(childrenMap, (props) => {
//         return (
//             <Tag>Tag 1</Tag>
//         )
//     })
//     .setPropertyViewFn((children) => {
//         return(
//             <Section name={sectionNames.basic}>
//                 {/* {children.options.propertyView({})} */}
//                 {children.text.propertyView({ label: trans("text") })}
//             </Section>
//         )
//     })
//     .build();
// })();

const multiTags = (function () {
  const childrenMap = {
    text: stringExposingStateControl("text", "world"),
    options: TagsOptionControl,
  };

  return new UICompBuilder(childrenMap, (props) => {
    const text = props.text.value;
    console.log(props.options)
    return (
      <>
        {props.options.map(tag => (
          <Tag>{tag.label}</Tag>
        ))}
      </>
      ); 
  })
    .setPropertyViewFn((children: any) => {
      return (
      <Section name="Basic">
        {children.options.propertyView({})} 
        {children.text.propertyView({ label: "Text" })}
      </Section>
      )
    })
    .build();
})()


// const childrenMap = {
//   text: stringExposingStateControl("text", "world"),
//   options: TagsOptionControl,
// };
  
//   const TagsCompView = new UICompBuilder(childrenMap, (props: any) => {
//     const text = props.text.value;
//     return <div>Hello {text}</div>;
//   })
//     .setPropertyViewFn((children: any) => {
//       return (
//       <Section name="Basic">
//         {children.options.propertyView({})} 
//         {children.text.propertyView({ label: "Text" })}
//       </Section>
//       )
//     })
//     .build();

export const MultiTagsComp = withExposingConfigs(multiTags, [new NameConfig("text", "")]);

