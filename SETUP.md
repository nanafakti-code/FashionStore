# Configuración Rápida de Supabase

## 1. Crear archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto con este contenido:

```env
PUBLIC_SUPABASE_URL=https://spzvtjybxpaxpnpfxbqv.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwenZ0anlieHBheHBucGZ4YnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjgyMzUsImV4cCI6MjA4MzQ0NDIzNX0.5gggyKxtxR7IdQejFS48eoF_xL-7CPuP2jOeuMLTS8M
PUBLIC_SITE_URL=http://localhost:4321
```

## 2. Ejecutar el esquema SQL

1. Ve a: https://supabase.com/dashboard/project/spzvtjybxpaxpnpfxbqv/sql/new
2. Copia todo el contenido del archivo `supabase/schema.sql`
3. Pégalo y haz clic en **RUN**

Esto creará:
- Tabla `categories` con 4 categorías (Camisas, Pantalones, Trajes, Accesorios)
- Tabla `products` con 3 productos de ejemplo
- Políticas RLS para seguridad

## 3. Configurar Storage (Opcional por ahora)

Puedes hacerlo después. Sigue las instrucciones en `supabase/storage-setup.md`

## 4. Reiniciar el servidor

Después de crear el `.env`:

```bash
# Detén el servidor actual (Ctrl+C)
npm run dev
```

La web debería mostrar las categorías y productos de ejemplo.
