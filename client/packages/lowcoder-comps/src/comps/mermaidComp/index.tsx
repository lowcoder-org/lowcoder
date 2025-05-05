import {
  UICompBuilder,
  Section,
  withExposingConfigs,
  stringExposingStateControl,
  NameConfig,
  eventHandlerControl,
  withMethodExposing,
} from "lowcoder-sdk";

import Mermaid from "./mermaid";

// Collection of example mermaid diagrams that showcase different diagram types
const mermaidExamples = {
  flowchart: 
`flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Check Documentation]
    E --> B
    C --> F[Deploy]`,

  sequence: 
`sequenceDiagram
    participant User
    participant App
    participant API
    participant DB
    
    User->>App: Submit Form
    App->>API: Send Request
    API->>DB: Query Data
    DB->>API: Return Result
    API->>App: Send Response
    App->>User: Show Result`,

  classDiagram: 
`classDiagram
    class User {
      +String name
      +String email
      +authenticate()
      +updateProfile()
    }
    class Product {
      +String name
      +Number price
      +getDetails()
    }
    class Order {
      +Date date
      +Number total
      +process()
    }
    User "1" --> "*" Order
    Order "*" --> "*" Product`,

  gantt: 
`gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    
    section Planning
    Research           :done, a1, 2023-01-01, 10d
    Requirements       :active, a2, after a1, 7d
    
    section Development
    Design             :a3, after a2, 8d
    Implementation     :a4, after a3, 14d
    Testing            :a5, after a4, 7d
    
    section Deployment
    Release            :milestone, after a5, 0d`,

  entityRelationship: 
`erDiagram
    CUSTOMER }|--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    CUSTOMER ||--o{ PAYMENT : makes
    PRODUCT ||--|{ ORDER_ITEM : "ordered in"`,

  journey: 
`journey
    title User Purchase Journey
    section Visit Website
      Homepage: 5: User
      Product listing: 4: User
      Product detail: 3: User
    section Purchase
      Add to cart: 4: User
      Checkout: 3: User, Admin
      Payment: 3: User, Admin
    section Post-Purchase
      Order confirmation: 5: User, Admin
      Shipping: 4: Admin
      Delivery: 5: User, Admin`
};

// Using the flowchart example as default
const childrenMap = {
  code: stringExposingStateControl(
    "code",
    mermaidExamples.flowchart
  ),
  onEvent: eventHandlerControl([
    {
      label: "onChange",
      value: "change",
      description: "",
    },
  ]),
};

const CompBase = new UICompBuilder(childrenMap, (props: any) => {
  const code = props.code.value;
  return <Mermaid code={code} />;
})
  .setPropertyViewFn((children: any) => {
    return (
      <>
        <Section name="Basic">{children.code.propertyView({ label: "code" })}</Section>
        <Section name="Interaction">{children.onEvent.propertyView()}</Section>
      </>
    );
  })
  .build();

const AppViewCompTemp = withMethodExposing(CompBase, []);

export const MermaidComp = withExposingConfigs(AppViewCompTemp, [new NameConfig("code", "")]);
