import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Variant {
    variant_id: string;
    variant_name: string;
    sku: string;
    price: number;
    original_price: number | null;
    stock: number;
    capacity: string | null;
    color: string | null;
    size: string | null;
    connectivity: string | null;
    available: boolean;
    is_default: boolean;
    image_url: string | null;
}

interface VariantSelectorProps {
    productSlug: string;
    onVariantChange?: (variant: Variant | null) => void;
    onImageChange?: (imageUrl: string | null) => void;
}

export default function VariantSelector({ productSlug, onVariantChange, onImageChange }: VariantSelectorProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVariants();

        // Suscribirse a cambios en tiempo real en la tabla variantes_producto
        const channel = supabase
            .channel('variantes-stock-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'variantes_producto',
                },
                (payload: any) => {
                    const newRecord = payload.new;
                    // Actualizar el estado si la variante modificada está en la lista actual
                    setVariants((prevVariants) => {
                        const index = prevVariants.findIndex(v => v.variant_id === newRecord.id);
                        if (index === -1) return prevVariants;

                        console.log('Stock actualizado en tiempo real:', newRecord.id, newRecord.stock);

                        const updatedVariants = [...prevVariants];
                        updatedVariants[index] = {
                            ...updatedVariants[index],
                            stock: newRecord.stock
                        } as Variant;
                        return updatedVariants;
                    });

                    // Actualizar variante seleccionada si corresponde
                    setSelectedVariant((prev) => {
                        if (prev && prev.variant_id === newRecord.id) {
                            return { ...prev, stock: newRecord.stock };
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [productSlug]);

    const fetchVariants = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/products/${productSlug}/variants`);

            if (!response.ok) {
                throw new Error('Error al cargar variantes');
            }

            const data = await response.json();
            setVariants(data);

            // Seleccionar variante por defecto solo si no hay una seleccionada
            // O si la seleccionada ya no existe (cambio de producto)
            const defaultVariant = data.find((v: Variant) => v.is_default) || data[0];
            if (defaultVariant && !selectedVariant) {
                setSelectedVariant(defaultVariant);
                onVariantChange?.(defaultVariant);
                onImageChange?.(defaultVariant.image_url);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleVariantSelect = (variant: Variant) => {
        setSelectedVariant(variant);
        onVariantChange?.(variant);
        onImageChange?.(variant.image_url);
    };

    const formatPrice = (cents: number) => {
        return (cents / 100).toFixed(2);
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { text: 'Agotado', color: 'text-red-600' };
        if (stock < 5) return { text: 'Pocas unidades', color: 'text-orange-600' };
        return { text: 'Disponible', color: 'text-green-600' };
    };

    // Agrupar variantes por capacidad
    const groupedVariants = variants.reduce((acc, variant) => {
        const capacity = variant.capacity || 'Sin especificar';
        if (!acc[capacity]) {
            acc[capacity] = [];
        }
        acc[capacity].push(variant);
        return acc;
    }, {} as Record<string, Variant[]>);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">⚠️ {error}</p>
            </div>
        );
    }

    if (variants.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">No hay variantes disponibles</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Precio actual */}
            {selectedVariant && (
                <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-gray-900">
                            €{formatPrice(selectedVariant.price)}
                        </span>
                        {selectedVariant.original_price && selectedVariant.original_price > selectedVariant.price && (
                            <>
                                <span className="text-xl text-gray-400 line-through">
                                    €{formatPrice(selectedVariant.original_price)}
                                </span>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                                    -{Math.round((1 - selectedVariant.price / selectedVariant.original_price) * 100)}%
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getStockStatus(selectedVariant.stock).color}`}>
                            {getStockStatus(selectedVariant.stock).text}
                        </span>
                        {selectedVariant.stock > 0 && selectedVariant.stock < 10 && (
                            <span className="text-sm text-gray-500">
                                ({selectedVariant.stock} {selectedVariant.stock === 1 ? 'unidad' : 'unidades'})
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Selector de capacidad */}
            {Object.keys(groupedVariants).length > 1 && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Capacidad
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(groupedVariants).map(([capacity, capacityVariants]) => {
                            const lowestPrice = Math.min(...capacityVariants.map(v => v.price));
                            const hasStock = capacityVariants.some(v => v.stock > 0);
                            const isSelected = capacityVariants.some(v => v.variant_id === selectedVariant?.variant_id);

                            return (
                                <button
                                    key={capacity}
                                    onClick={() => {
                                        const variant = capacityVariants.find(v => v.stock > 0) || capacityVariants[0];
                                        if (variant) handleVariantSelect(variant);
                                    }}
                                    disabled={!hasStock}
                                    className={`
                    relative px-4 py-3 rounded-lg border-2 transition-all
                    ${isSelected
                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }
                    ${!hasStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                >
                                    <div className="text-sm font-semibold text-gray-900">{capacity}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Desde €{formatPrice(lowestPrice)}
                                    </div>
                                    {!hasStock && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                                            <span className="text-xs font-medium text-red-600">Agotado</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selector de color/conectividad (variantes dentro de la misma capacidad) */}
            {selectedVariant && groupedVariants?.[selectedVariant.capacity || 'Sin especificar'] && groupedVariants[selectedVariant.capacity || 'Sin especificar']!.length > 1 && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Color
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {groupedVariants[selectedVariant.capacity || 'Sin especificar']!.map((variant) => {
                            const isSelected = variant.variant_id === selectedVariant.variant_id;
                            const label = variant.color || variant.connectivity || variant.variant_name;

                            return (
                                <button
                                    key={variant.variant_id}
                                    onClick={() => handleVariantSelect(variant)}
                                    disabled={variant.stock === 0}
                                    className={`
                    px-4 py-2 rounded-lg border-2 transition-all text-sm
                    ${isSelected
                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }
                    ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Información de la variante seleccionada */}
            {selectedVariant && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-gray-900">{selectedVariant.variant_name}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">SKU:</span> {selectedVariant.sku}</p>
                        {selectedVariant.color && (
                            <p><span className="font-medium">Color:</span> {selectedVariant.color}</p>
                        )}
                        {selectedVariant!.connectivity && (
                            <p><span className="font-medium">Conectividad:</span> {selectedVariant!.connectivity}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Botón de añadir al carrito */}
            {selectedVariant && (
                <button
                    onClick={async () => {
                        if (selectedVariant.stock === 0) return;

                        try {
                            const { data: { session } } = await supabase.auth.getSession();
                            const token = session?.access_token;

                            // Import dynamic import or moving import to top?
                            // Better to have import at top, but for now using inline dynamic import or just modify top of file
                            // But replace_file_content is block based.
                            // I will assume I can't easily add import to top without replacing top.
                            // So I will likely use `getOrCreateGuestSessionId` if I imported it.
                            // Error: I haven't imported it yet.
                            // I should do two changes: 1. Add import. 2. Update logic.

                            // Hack: Copy helper function here or import at top in a separate step.
                            // Better: modify top first. 

                            // Let's modify logic to use header. 
                            // I need the session ID. 
                            // accessing localStorage directly is easier than importing if I don't want to touch top.
                            // But cleaner is to import.

                            // I will proceed with this block assumnig I added import in next step? No.
                            // I'll use localStorage directly here to get the ID, as it is simple.
                            let guestSessionId = localStorage.getItem('fashionstore_guest_session_id');
                            if (!guestSessionId) {
                                guestSessionId = crypto.randomUUID();
                                localStorage.setItem('fashionstore_guest_session_id', guestSessionId);
                            }

                            const headers: Record<string, string> = {
                                'Content-Type': 'application/json',
                                'x-guest-session-id': guestSessionId
                            };
                            if (token) {
                                headers['Authorization'] = `Bearer ${token}`;
                            }

                            const response = await fetch('/api/cart/add', {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({
                                    variantId: selectedVariant.variant_id,
                                    variantName: selectedVariant.variant_name, // Optional backend?
                                    price: selectedVariant.price,
                                    imageUrl: selectedVariant.image_url,
                                    quantity: 1
                                }),
                            });

                            const result = await response.json();

                            if (response.ok) {
                                // Despachar evento para actualizar el carrito (que ahora lee de BD)
                                if (result.authenticated) {
                                    window.dispatchEvent(new Event('authCartUpdated'));
                                } else {
                                    window.dispatchEvent(new Event('guestCartUpdated'));
                                }
                                window.dispatchEvent(new Event('cartUpdated'));
                            } else {
                                console.error(result.error || 'Error al añadir al carrito');
                                // alert(result.error || 'Error al añadir al carrito');
                            }
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    }}
                    disabled={selectedVariant.stock === 0}
                    className={`
            w-full py-3 px-6 rounded-lg font-semibold text-white transition-all
            ${selectedVariant.stock > 0
                            ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                            : 'bg-gray-400 cursor-not-allowed'
                        }
          `}
                >
                    {selectedVariant.stock > 0 ? 'Añadir al carrito' : 'Agotado'}
                </button>
            )}
        </div>
    );
}
