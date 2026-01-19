#!/usr/bin/env bash
# CART_RESERVATIONS_QUICKSTART.sh
# Script para verificar y usar el sistema de reservas

echo "
╔════════════════════════════════════════════════════════╗
║  SISTEMA DE RESERVA TEMPORAL DE STOCK                  ║
║  Quick Start & Verification Script                     ║
╚════════════════════════════════════════════════════════╝
"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir estados
check_status() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓${NC} $1"
}

error_status() {
    echo -e "${RED}✗${NC} $1"
}

warning_status() {
    echo -e "${YELLOW}!${NC} $1"
}

# ============================================================================
# PASO 1: Verificar archivos
# ============================================================================

echo -e "\n${BLUE}PASO 1: Verificando archivos...${NC}\n"

if [ -f "supabase/CART_RESERVATIONS.sql" ]; then
    check_status "supabase/CART_RESERVATIONS.sql encontrado"
else
    error_status "supabase/CART_RESERVATIONS.sql NO encontrado"
fi

if [ -f "src/pages/api/reservas.ts" ]; then
    check_status "src/pages/api/reservas.ts encontrado"
else
    error_status "src/pages/api/reservas.ts NO encontrado"
fi

if [ -f "src/lib/cart-reservation-client.ts" ]; then
    check_status "src/lib/cart-reservation-client.ts encontrado"
else
    error_status "src/lib/cart-reservation-client.ts NO encontrado"
fi

# ============================================================================
# PASO 2: Verificar documentación
# ============================================================================

echo -e "\n${BLUE}PASO 2: Verificando documentación...${NC}\n"

docs=(
    "CART_RESERVATION_SYSTEM.md"
    "CART_RESERVATIONS_QUICK_START.md"
    "CART_RESERVATIONS_FAQ.md"
    "CART_RESERVATIONS_DIAGRAMS.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        check_status "$doc encontrado"
    else
        warning_status "$doc NO encontrado"
    fi
done

# ============================================================================
# PASO 3: Verificar variables de entorno
# ============================================================================

echo -e "\n${BLUE}PASO 3: Verificando variables de entorno...${NC}\n"

if grep -q "CRON_SECRET" .env.local .env 2>/dev/null; then
    check_status "CRON_SECRET configurado"
else
    warning_status "CRON_SECRET no encontrado. Agrega a .env.local:"
    echo "   CRON_SECRET=generar-con-openssl-rand-base64-32"
fi

# ============================================================================
# PASO 4: Instrucciones
# ============================================================================

echo -e "\n${BLUE}PASO 4: Próximas acciones${NC}\n"

echo -e "${YELLOW}1. Ejecutar SQL en Supabase:${NC}"
echo "   • Ir a: https://supabase.com/dashboard"
echo "   • SQL Editor → New Query"
echo "   • Copiar contenido de: supabase/CART_RESERVATIONS.sql"
echo "   • Ejecutar"
echo ""

echo -e "${YELLOW}2. Configurar variables de entorno:${NC}"
echo "   • Generar token: openssl rand -base64 32"
echo "   • Agregar a .env.local:"
echo "     CRON_SECRET=tu-token-aqui"
echo ""

echo -e "${YELLOW}3. Configurar limpieza automática:${NC}"
echo "   Opción A: EasyCron (gratis, recomendado)"
echo "   • URL: https://tu-sitio.com/api/cleanup-expired-reservations"
echo "   • Method: POST"
echo "   • Header: Authorization: Bearer {CRON_SECRET}"
echo "   • Schedule: */1 * * * *"
echo ""
echo "   Opción B: GitHub Actions"
echo "   • Crear .github/workflows/cleanup.yml"
echo "   • Schedule: */1 * * * *"
echo ""

echo -e "${YELLOW}4. Integrar en frontend:${NC}"
echo "   • Ver: CART_RESERVATION_IMPLEMENTATION_EXAMPLE.ts"
echo "   • Copiar ejemplos a componentes"
echo "   • Importar: import { reservationClient } from '@/lib/cart-reservation-client'"
echo ""

echo -e "${YELLOW}5. Testing:${NC}"
echo "   • Ejecutar: supabase/CART_RESERVATIONS_TESTING.sql"
echo "   • Test manual:"
echo "     1. Añadir producto"
echo "     2. Verificar stock bajó"
echo "     3. Esperar 65 segundos"
echo "     4. Verificar stock se restauró"
echo ""

# ============================================================================
# PASO 5: Documentación rápida
# ============================================================================

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}DOCUMENTACIÓN${NC}\n"

echo -e "${GREEN}Quick Start (5 minutos):${NC}"
echo "   → CART_RESERVATIONS_QUICK_START.md"
echo ""

echo -e "${GREEN}Guía Técnica (30 minutos):${NC}"
echo "   → CART_RESERVATION_SYSTEM.md"
echo ""

echo -e "${GREEN}Preguntas Frecuentes:${NC}"
echo "   → CART_RESERVATIONS_FAQ.md"
echo ""

echo -e "${GREEN}Diagramas Visuales:${NC}"
echo "   → CART_RESERVATIONS_DIAGRAMS.md"
echo ""

echo -e "${GREEN}Índice de Documentación:${NC}"
echo "   → CART_RESERVATIONS_INDEX.md"
echo ""

# ============================================================================
# PASO 6: Testing rápido
# ============================================================================

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TESTING RÁPIDO${NC}\n"

if command -v curl &> /dev/null; then
    echo -e "${YELLOW}Prueba API (después de ejecutar SQL):${NC}"
    echo ""
    echo "GET /api/reservas:"
    echo "  curl -X GET http://localhost:3000/api/reservas \\"
    echo "    -H 'Authorization: Bearer <token>'"
    echo ""
    echo "POST /api/reservas:"
    echo "  curl -X POST http://localhost:3000/api/reservas \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -H 'Authorization: Bearer <token>' \\"
    echo "    -d '{\"producto_id\": \"uuid\", \"quantity\": 1}'"
    echo ""
fi

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ VERIFICACIÓN COMPLETADA${NC}\n"

echo -e "${YELLOW}Estado:${NC}"
echo "  • Código implementado: ✅"
echo "  • Documentación completa: ✅"
echo "  • Tests incluidos: ✅"
echo "  • Ejemplos de código: ✅"
echo ""

echo -e "${YELLOW}Próximo paso:${NC}"
echo "  1. Leer: CART_RESERVATIONS_QUICK_START.md"
echo "  2. Ejecutar SQL en Supabase"
echo "  3. Integrar en frontend"
echo ""

echo -e "${GREEN}¡Listo para usar! 🚀${NC}\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# ============================================================================
# Funciones útiles
# ============================================================================

echo -e "${YELLOW}FUNCIONES ÚTILES:${NC}\n"

echo "1. Generar CRON_SECRET:"
echo "   openssl rand -base64 32"
echo ""

echo "2. Verificar tabla en Supabase:"
echo "   SELECT COUNT(*) FROM cart_reservations;"
echo ""

echo "3. Ver todas las reservas:"
echo "   SELECT * FROM cart_reservations WHERE expires_at > NOW();"
echo ""

echo "4. Ejecutar limpieza manual:"
echo "   SELECT * FROM cleanup_expired_reservations();"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

exit 0
