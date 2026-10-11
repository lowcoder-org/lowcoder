import { ShapeComp } from "comps/comps/shapeComp/shapeComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ShapeExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Shapes Component."
        >
          <Example
            title="A Simple Shape component"
            config={{ 
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Hiding the Shape Component"
            config={{ 
              hidden: true,
              icon:"2_misc",
            }}
            compFactory={ShapeComp}
          />
           <Example
            title="Disabling the Shape Component"
            config={{ 
              disabled: true,
              icon:"2_polygon",
            }}
            compFactory={ShapeComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties of the Shapes Component."
        >
          <Example
            title="Background Color"
            width={500}
            config={{
              container: {
                "style": {
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Border Style, Color, Radius & Width"
            width={500}
            config={{
              container: {
                "style": {
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "border" : "#3377FF",
                    "borderWidth": "2px",
                    "radius": "10px",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Margin & Padding"
            width={500}
            config={{
              container: {
                "style": {
                    "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                    "border" : "#3377FF",
                    "borderWidth": "2px",
                    "radius": "10px",
                    "margin": "15px",
                    "padding": "15px",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Image"
            width={600}
            height={300}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Image Size"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "50%",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Image Repeat - No Repeat"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "30%",
                  "backgroundImageRepeat": "no-repeat",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Image Repeat - Repeat Horizontally"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "30%",
                  "backgroundImageRepeat": "repeat-x",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Image Repeat - Repeat Vertically"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "30%",
                  "backgroundImageRepeat": "repeat-y",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Position - Center"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "30%",
                  "backgroundImageRepeat": "repeat-x",
                  "backgroundImagePosition": "center",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Position - Top"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "30%",
                  "backgroundImageRepeat": "repeat-x",
                  "backgroundImagePosition": "top",
                },
              },
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Background Position - Top"
            width={600}
            height={400}
            config={{
              container: {
                "style": {
                  "backgroundImage": "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
                  "backgroundImageSize": "30%",
                  "backgroundImageRepeat": "repeat-x",
                  "backgroundImagePosition": "bottom",
                },
              },
            }}
            compFactory={ShapeComp}
          />
        </ExampleGroup>
      </>
    );
  }