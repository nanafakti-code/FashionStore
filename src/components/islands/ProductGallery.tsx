import React, { useState } from 'react';

interface Image {
  url: string;
  alt_text?: string;
  es_principal?: boolean;
}

interface Variant {
  color: string;
  talla?: string;
  capacidad?: string;
  estado?: string;
  stock: number;
  precio_ajustado?: number;
}

interface ProductGalleryProps {
  images: Image[];
  productName: string;
  discount: number;
  variants: Variant[];
}

// Función para optimizar URLs de imágenes
function optimizeImageUrl(url: string): string {
  // Si ya tiene parámetros de optimización, devolverlo tal cual
  if (url.includes('quality') || url.includes('format')) {
    return url;
  }
  
  // Si es una URL relativa o de Supabase, optimizarla
  if (url.includes('supabase') || url.startsWith('/')) {
    // Usar Supabase image optimization si está disponible
    return url;
  }
  
  return url;
}

export default function ProductGallery({
  images,
  productName,
  discount,
  variants,
}: ProductGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Agrupar variantes por color
  const colors = Array.from(
    new Set(
      variants
        .map((v) => v.color)
        .filter((c) => c)
    )
  );

  // Cambiar imagen principal
  const handleImageClick = (image: Image) => {
    setMainImage(image);
  };

  return (
    <div className="space-y-4">
      {/* Imagen Principal - Estilo BackMarket */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden aspect-square flex items-center justify-center shadow-md">
        {mainImage ? (
          <img
            src={optimizeImageUrl(mainImage.url)}
            alt={mainImage.alt_text || productName}
            className="w-full h-full object-contain p-8"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-slate-400 text-lg font-medium text-center px-4">{productName}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
            -{discount}%
          </div>
        )}
      </div>

      {/* Miniaturas - Grid de 4 o 5 imágenes */}
      {images.length > 1 && (
        <div className={`grid gap-2 ${images.length <= 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleImageClick(img)}
              className={`relative aspect-square bg-gray-50 rounded-lg overflow-hidden hover:opacity-80 transition-all border-2 ${
                mainImage.url === img.url
                  ? 'border-[#00aa45] shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={optimizeImageUrl(img.url)}
                alt="Miniatura"
                className="w-full h-full object-contain p-2"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Selector de Colores */}
      {colors.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Colores Disponibles
          </h3>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isSelected = selectedColor === color;
              const variantsByColor = variants.filter(
                (v) => v.color === color
              );
              const hasStock = variantsByColor.some((v) => v.stock > 0);

              // Convertir nombre de color a código hexadecimal
              const colorMap: Record<string, string> = {
                'Rojo': '#EF4444',
                'Azul': '#3B82F6',
                'Negro': '#1F2937',
                'Blanco': '#F5F5F5',
                'Gris': '#9CA3AF',
                'Verde': '#10B981',
                'Amarillo': '#FBBF24',
                'Naranja': '#F97316',
                'Rosa': '#EC4899',
                'Morado': '#A855F7',
                'Marrón': '#92400E',
                'Beige': '#D2B48C',
              };

              const colorCode = Object.keys(colorMap).find(
                (key) => color.toLowerCase().includes(key.toLowerCase())
              )
                ? colorMap[
                    Object.keys(colorMap).find(
                      (key) => color.toLowerCase().includes(key.toLowerCase())
                    ) as string
                  ]
                : '#D1D5DB';

              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                    isSelected
                      ? 'border-[#00aa45] bg-[#00aa45] text-white'
                      : hasStock
                      ? 'border-gray-300 bg-white text-gray-900 hover:border-[#00aa45]'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!hasStock}
                  title={color}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 border-current"
                    style={{ backgroundColor: colorCode }}
                  />
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
