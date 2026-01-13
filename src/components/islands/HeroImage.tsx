import { useState, useEffect } from 'react';

interface HeroImageProps {
  images?: string[];
  interval?: number;
}

export default function HeroImage({ 
  images = [
    'https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111883_macbookair.png',
    'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-16.png'
  ],
  interval = 5000 
}: HeroImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="hidden lg:flex justify-center items-center relative h-96">
      {images.map((src, index) => (
        <img
          key={index}
          src={src}
          alt="Producto destacado"
          className={`max-h-96 w-auto object-contain transition-opacity duration-500 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />
      ))}
    </div>
  );
}
