import { CarouselComp } from "comps/comps/carouselComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ImageCarouselExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Image Carousel Component."
      >
        <Example
          title="Image Carousel Component"
          width={500}
          height={500}
          config={{
            data: "[\"https://media.istockphoto.com/id/1632091356/photo/happy-thanksgiving-holiday-greeting-card-handwriting-calligraphy-text-design-with-fall.jpg?s=1024x1024&w=is&k=20&c=l_-55iKmFpA3KxHaeMYdjOOb0F2ADYwFS-IJuc9si4U=\", \"https://media.istockphoto.com/id/1713107584/photo/airplane-with-banner-at-sunset-time.webp?a=1&b=1&s=612x612&w=0&k=20&c=a9x2vG4gEI8mHKTJi2DfPmW8Dc82qNdFoXRq6dRiF1Q=\", \"https://plus.unsplash.com/premium_photo-1682125748265-d362c809ba04?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\",\"https://plus.unsplash.com/premium_photo-1667912925305-629794bdb691?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\"]",
          }}
          compFactory={CarouselComp}
        />
        <Example
          title="Hiding the Image Carousel Component"
          width={500}
          height={500}
          config={{
            data: "[\"https://media.istockphoto.com/id/1632091356/photo/happy-thanksgiving-holiday-greeting-card-handwriting-calligraphy-text-design-with-fall.jpg?s=1024x1024&w=is&k=20&c=l_-55iKmFpA3KxHaeMYdjOOb0F2ADYwFS-IJuc9si4U=\", \"https://media.istockphoto.com/id/1713107584/photo/airplane-with-banner-at-sunset-time.webp?a=1&b=1&s=612x612&w=0&k=20&c=a9x2vG4gEI8mHKTJi2DfPmW8Dc82qNdFoXRq6dRiF1Q=\", \"https://plus.unsplash.com/premium_photo-1682125748265-d362c809ba04?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\",\"https://plus.unsplash.com/premium_photo-1667912925305-629794bdb691?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\"]",
            hidden: true,
        }}
          compFactory={CarouselComp}
        />
        <Example
          title="Hiding the Image Carousel Component"
          width={500}
          height={500}
          config={{
            data: "[\"https://media.istockphoto.com/id/1632091356/photo/happy-thanksgiving-holiday-greeting-card-handwriting-calligraphy-text-design-with-fall.jpg?s=1024x1024&w=is&k=20&c=l_-55iKmFpA3KxHaeMYdjOOb0F2ADYwFS-IJuc9si4U=\", \"https://media.istockphoto.com/id/1713107584/photo/airplane-with-banner-at-sunset-time.webp?a=1&b=1&s=612x612&w=0&k=20&c=a9x2vG4gEI8mHKTJi2DfPmW8Dc82qNdFoXRq6dRiF1Q=\", \"https://plus.unsplash.com/premium_photo-1682125748265-d362c809ba04?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\",\"https://plus.unsplash.com/premium_photo-1667912925305-629794bdb691?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\"]",
            autoPlay: false,
        }}
          compFactory={CarouselComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout"
        description="The Following Examples Show the Layout options on the Image Carousel Component."
      >
        <Example
          title="Dots Position - Top"
          width={500}
          height={500}
          config={{
            data: "[\"https://media.istockphoto.com/id/1632091356/photo/happy-thanksgiving-holiday-greeting-card-handwriting-calligraphy-text-design-with-fall.jpg?s=1024x1024&w=is&k=20&c=l_-55iKmFpA3KxHaeMYdjOOb0F2ADYwFS-IJuc9si4U=\", \"https://media.istockphoto.com/id/1713107584/photo/airplane-with-banner-at-sunset-time.webp?a=1&b=1&s=612x612&w=0&k=20&c=a9x2vG4gEI8mHKTJi2DfPmW8Dc82qNdFoXRq6dRiF1Q=\", \"https://plus.unsplash.com/premium_photo-1682125748265-d362c809ba04?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\",\"https://plus.unsplash.com/premium_photo-1667912925305-629794bdb691?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\"]",
            dotPosition: "top",
        }}
          compFactory={CarouselComp}
        />
        <Example
          title="Dots Position - Right"
          width={500}
          height={500}
          config={{
            data: "[\"https://media.istockphoto.com/id/1632091356/photo/happy-thanksgiving-holiday-greeting-card-handwriting-calligraphy-text-design-with-fall.jpg?s=1024x1024&w=is&k=20&c=l_-55iKmFpA3KxHaeMYdjOOb0F2ADYwFS-IJuc9si4U=\", \"https://media.istockphoto.com/id/1713107584/photo/airplane-with-banner-at-sunset-time.webp?a=1&b=1&s=612x612&w=0&k=20&c=a9x2vG4gEI8mHKTJi2DfPmW8Dc82qNdFoXRq6dRiF1Q=\", \"https://plus.unsplash.com/premium_photo-1682125748265-d362c809ba04?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\",\"https://plus.unsplash.com/premium_photo-1667912925305-629794bdb691?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\"]",
            dotPostion: "right",
        }}
          compFactory={CarouselComp}
        />
        <Example
          title="Dots Position - Left"
          width={500}
          height={500}
          config={{
            data: "[\"https://media.istockphoto.com/id/1632091356/photo/happy-thanksgiving-holiday-greeting-card-handwriting-calligraphy-text-design-with-fall.jpg?s=1024x1024&w=is&k=20&c=l_-55iKmFpA3KxHaeMYdjOOb0F2ADYwFS-IJuc9si4U=\", \"https://media.istockphoto.com/id/1713107584/photo/airplane-with-banner-at-sunset-time.webp?a=1&b=1&s=612x612&w=0&k=20&c=a9x2vG4gEI8mHKTJi2DfPmW8Dc82qNdFoXRq6dRiF1Q=\", \"https://plus.unsplash.com/premium_photo-1682125748265-d362c809ba04?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\",\"https://plus.unsplash.com/premium_photo-1667912925305-629794bdb691?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D\"]",
            dotPosition: "left",
        }}
          compFactory={CarouselComp}
        />
      </ExampleGroup>
    </>
  );
}
