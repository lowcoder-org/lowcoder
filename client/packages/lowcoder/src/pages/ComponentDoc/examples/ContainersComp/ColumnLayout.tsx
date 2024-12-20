import { ColumnLayoutComp } from "comps/comps/columnLayout/columnLayout";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ColumnLayoutExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Column Layout Component."
        >
          <Example
            title="Hiding the Component"
            config={{ 
                hidden: true,
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Disabling the Component"
            config={{ 
                disabled: true,
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Multiple Columns"
            config={{ 
              columns:{
                manual:[
                  {
                    id:0,
                    label:"Column1",
                  },
                  {
                    id:1,
                    label:"Column2",
                  },
                  {
                    id:2,
                    label:"Column3",
                  },
                ]
              }
            }}
            compFactory={ColumnLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Column's Layout"
          description="The Following Examples Show the Column Layout options on Column Layout Component."
        >
          <Example
            title="Column Definition"
            config={{ 
              templateColumns: "1fr 1fr 1fr 1fr",
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Row Definition"
            config={{ 
              templateRows: "1fr 1fr",
            }}
            compFactory={ColumnLayoutComp}
          />
          <Example
            title="Column Gap"
            config={{ 
              columnGap: "50px",
            }}
            compFactory={ColumnLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }