import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function CarouselDemo() {
  const slideData = [
    {
      title: "Mystic Mountains",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1494806812796-244fe51b774d?q=80",
    },
    {
      title: "Urban Dreams",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=80",
    },
    {
      title: "Neon Nights",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1590041794748-2d8eb73a571c?q=80",
    },
    {
      title: "Desert Whispers",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1679420437432-80cfbf88986c?q=80",
    },
  ];

  return (
    <div className="relative w-full py-20">
      <Carousel>
        <CarouselContent>
          {slideData.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="p-2">
                <div className="rounded-xl overflow-hidden h-[400px] relative">
                  <img
                    src={slide.src}
                    className="w-full h-full object-cover"
                    alt={slide.title}
                  />

                  {/* Title Overlay */}
                  <div className="absolute bottom-5 left-5 text-white text-xl font-bold drop-shadow-lg">
                    {slide.title}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
