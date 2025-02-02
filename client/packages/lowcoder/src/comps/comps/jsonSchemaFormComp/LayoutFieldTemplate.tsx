import React from "react";
import ObjectFieldTemplate from "./ObjectFieldTemplate"; // Import the existing ObjectFieldTemplate

export const LayoutFieldTemplate = (props: any) => {
  const { schema, uiSchema, children, ...rest } = props; // Spread to include all props

  // Handle custom layouts
  switch (schema.type) {
    case "Group":
      return (
        <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px" }}>
          <h3>{schema.label || "Group"}</h3>
          {children}
        </div>
      );
    case "HorizontalLayout":
      return <div style={{ display: "flex", gap: "10px" }}>{children}</div>;
    case "VerticalLayout":
      return <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{children}</div>;
    default:
      // Delegate to the existing ObjectFieldTemplate, ensuring all props are passed
      return <ObjectFieldTemplate schema={schema} uiSchema={uiSchema} {...rest} />;
  }
};

export default LayoutFieldTemplate;
