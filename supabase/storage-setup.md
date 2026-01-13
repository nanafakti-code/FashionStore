# Configuración de Supabase Storage para FashionMarket

## 📦 Creación del Bucket para Imágenes de Productos

### Paso 1: Crear el Bucket

1. Accede a tu proyecto de Supabase: https://app.supabase.com
2. Ve a la sección **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket con los siguientes parámetros:

```
Name: product-images
Public: ✅ Yes (para que las imágenes sean accesibles públicamente)
File size limit: 5 MB (ajusta según necesites)
Allowed MIME types: image/jpeg, image/png, image/webp
```

### Paso 2: Configurar Políticas de Acceso (RLS)

Después de crear el bucket, necesitas configurar las políticas de Row Level Security para controlar quién puede leer y escribir imágenes.

#### Política 1: Lectura Pública (SELECT)

Permite que cualquier persona pueda ver las imágenes de productos.

```sql
CREATE POLICY "public_read_product_images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');
```

#### Política 2: Subida Solo para Administradores (INSERT)

Solo usuarios autenticados pueden subir nuevas imágenes.

```sql
CREATE POLICY "authenticated_upload_product_images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

#### Política 3: Actualización Solo para Administradores (UPDATE)

Solo usuarios autenticados pueden actualizar imágenes existentes.

```sql
CREATE POLICY "authenticated_update_product_images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

#### Política 4: Eliminación Solo para Administradores (DELETE)

Solo usuarios autenticados pueden eliminar imágenes.

```sql
CREATE POLICY "authenticated_delete_product_images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

---

## 🔧 Uso desde el Código

### Subir Imagen desde el Panel Admin

```typescript
import { supabase } from '@/lib/supabase';

async function uploadProductImage(file: File): Promise<string | null> {
  // Generar nombre único para el archivo
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  // Subir archivo a Supabase Storage
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Obtener URL pública de la imagen
  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
```

### Obtener URL Pública de una Imagen

```typescript
import { supabase } from '@/lib/supabase';

function getProductImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
```

### Eliminar Imagen

```typescript
import { supabase } from '@/lib/supabase';

async function deleteProductImage(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('product-images')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
}
```

---

## 📝 Ejemplo de Uso en el Formulario de Nuevo Producto

```typescript
// En src/pages/admin/productos/nuevo.astro

const handleImageUpload = async (files: FileList) => {
  const uploadedUrls: string[] = [];

  for (const file of Array.from(files)) {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      console.error('Solo se permiten imágenes');
      continue;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('La imagen es demasiado grande (máx 5MB)');
      continue;
    }

    // Subir imagen
    const url = await uploadProductImage(file);
    if (url) {
      uploadedUrls.push(url);
    }
  }

  return uploadedUrls;
};
```

---

## 🎨 Optimización de Imágenes (Recomendado)

Para mejorar el rendimiento, considera usar transformaciones de imagen de Supabase:

```typescript
function getOptimizedImageUrl(filePath: string, width: number = 800): string {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath, {
      transform: {
        width,
        quality: 80,
        format: 'webp' // Formato moderno con mejor compresión
      }
    });
  
  return data.publicUrl;
}
```

---

## ✅ Checklist de Configuración

- [ ] Crear bucket `product-images` en Supabase Storage
- [ ] Marcar el bucket como **público**
- [ ] Ejecutar las 4 políticas RLS en el SQL Editor
- [ ] Probar subida de imagen desde el panel admin
- [ ] Verificar que las imágenes son accesibles públicamente
- [ ] Configurar límites de tamaño y tipos MIME permitidos

---

## 🔒 Seguridad

> **IMPORTANTE**: Las políticas RLS aseguran que:
> - ✅ Cualquiera puede **ver** las imágenes de productos (necesario para la tienda pública)
> - ✅ Solo administradores autenticados pueden **subir, modificar o eliminar** imágenes
> - ✅ Se previene el abuso de almacenamiento mediante límites de tamaño

---

## 📚 Recursos Adicionales

- [Documentación oficial de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Transformaciones de imagen](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Políticas RLS para Storage](https://supabase.com/docs/guides/storage/security/access-control)
