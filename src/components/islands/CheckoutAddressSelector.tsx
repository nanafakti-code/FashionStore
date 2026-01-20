/**
 * CHECKOUT - ADDRESS SELECTOR
 * ============================
 * Permite seleccionar direcciones guardadas o añadir una nueva
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Direccion {
  id: string;
  usuario_id: string;
  tipo: 'Envío' | 'Facturación' | 'Ambas';
  nombre_destinatario: string;
  calle: string;
  numero: string;
  piso?: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  es_predeterminada: boolean;
}

export default function CheckoutAddressSelector() {
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    // Cuando selecciona una dirección, rellena el formulario
    if (selectedAddressId && !useNewAddress) {
      const selected = direcciones.find(d => d.id === selectedAddressId);
      if (selected) {
        fillFormWithAddress(selected);
      }
    }
  }, [selectedAddressId, useNewAddress, direcciones]);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Cargar direcciones del usuario
      const { data: addressesData, error: addressesError } = await supabase
        .from("direcciones")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("tipo", "Envío")
        .order("es_predeterminada", { ascending: false });

      if (addressesError) {
        console.error("Error loading addresses:", addressesError);
      } else {
        setDirecciones((addressesData as Direccion[]) || []);
        
        // Seleccionar la dirección predeterminada automáticamente
        const defaultAddress = (addressesData as Direccion[])?.find(d => d.es_predeterminada);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setUseNewAddress(false);
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fillFormWithAddress = (address: Direccion) => {
    const inputCalle = document.getElementById('input-calle') as HTMLInputElement;
    const inputCiudad = document.getElementById('input-ciudad') as HTMLInputElement;
    const inputCp = document.getElementById('input-cp') as HTMLInputElement;
    const inputPais = document.getElementById('input-pais') as HTMLSelectElement;
    const inputProvincia = document.getElementById('input-provincia') as HTMLInputElement;
    const inputNumero = document.getElementById('input-numero') as HTMLInputElement;
    const inputPiso = document.getElementById('input-piso') as HTMLInputElement;

    if (inputCalle) inputCalle.value = `${address.calle}, ${address.numero}`;
    if (inputCiudad) inputCiudad.value = address.ciudad;
    if (inputCp) inputCp.value = address.codigo_postal;
    if (inputPais) inputPais.value = address.pais;
    if (inputProvincia) inputProvincia.value = address.provincia;
    if (inputNumero) inputNumero.value = address.numero;
    if (inputPiso) inputPiso.value = address.piso || '';

    console.log('✓ Formulario rellenado con dirección guardada');
  };

  const clearAddressFields = () => {
    const fields = [
      'input-calle', 'input-ciudad', 'input-cp', 'input-pais', 
      'input-provincia', 'input-numero', 'input-piso'
    ];
    fields.forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
      if (el) el.value = '';
    });
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  if (direcciones.length === 0) {
    return null;
  }

  return (
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3 mb-4">
        <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <h3 class="text-sm font-semibold text-blue-900">
          Selecciona una dirección guardada
        </h3>
      </div>

      <div class="space-y-2">
        {direcciones.map((direccion) => (
          <label key={direccion.id} class="flex items-start gap-3 p-3 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition">
            <input
              type="radio"
              name="saved-address"
              value={direccion.id}
              checked={selectedAddressId === direccion.id && !useNewAddress}
              onChange={() => {
                setSelectedAddressId(direccion.id);
                setUseNewAddress(false);
              }}
              class="mt-1 w-4 h-4 text-blue-600"
            />
            <div class="flex-1 text-sm">
              <div class="font-semibold text-gray-900">
                {direccion.nombre_destinatario}
                {direccion.es_predeterminada && (
                  <span class="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                    Predeterminada
                  </span>
                )}
              </div>
              <div class="text-gray-600 mt-1">
                {direccion.calle}, {direccion.numero}{direccion.piso && `, ${direccion.piso}`}
              </div>
              <div class="text-gray-600">
                {direccion.codigo_postal} {direccion.ciudad}, {direccion.provincia}
              </div>
            </div>
          </label>
        ))}

        <label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
          <input
            type="radio"
            name="saved-address"
            value="new"
            checked={useNewAddress}
            onChange={() => {
              setUseNewAddress(true);
              clearAddressFields();
            }}
            class="w-4 h-4 text-gray-600"
          />
          <span class="text-sm font-medium text-gray-700">
            Usar una dirección diferente
          </span>
        </label>
      </div>
    </div>
  );
}
