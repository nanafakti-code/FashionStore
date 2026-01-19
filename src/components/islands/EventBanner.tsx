/**
 * FASHIONSTORE - EVENT BANNER
 * ============================
 * Banner dinámico para eventos promocionales activos
 * Se muestra automáticamente si hay eventos activos
 */

import { useState, useEffect } from 'preact/hooks';

// Icono de brillo SVG inline
const SparkleIcon = () => (
  <svg 
    className="w-4 h-4 animate-pulse" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// Icono de reloj SVG inline
const ClockIconInline = () => (
  <svg 
    className="w-3 h-3 inline mr-1" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface Event {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_descuento: string;
  valor_descuento: number;
  banner_texto: string;
  banner_color: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export default function EventBanner() {
  const [event, setEvent] = useState<Event | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    loadActiveEvent();
  }, []);

  useEffect(() => {
    if (!event) return;

    const updateTimeLeft = () => {
      const end = new Date(event.fecha_fin).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setIsVisible(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const loadActiveEvent = async () => {
    try {
      const response = await fetch('/api/eventos/active');
      const data = await response.json();
      
      if (data.event) {
        setEvent(data.event);
        
        // Verificar si el usuario cerró este banner
        const dismissedEvents = localStorage.getItem('fashionstore_dismissed_events');
        if (dismissedEvents) {
          const dismissed = JSON.parse(dismissedEvents);
          if (dismissed.includes(data.event.id)) {
            setIsVisible(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading active event:', error);
    }
  };

  const handleDismiss = () => {
    if (!event) return;
    
    setIsVisible(false);
    
    // Guardar en localStorage que este evento fue cerrado
    const dismissedEvents = localStorage.getItem('fashionstore_dismissed_events');
    const dismissed = dismissedEvents ? JSON.parse(dismissedEvents) : [];
    dismissed.push(event.id);
    localStorage.setItem('fashionstore_dismissed_events', JSON.stringify(dismissed));
  };

  if (!event || !isVisible) return null;

  return (
    <div 
      className="relative py-2 px-4 text-center text-white text-sm font-medium"
      style={{ backgroundColor: event.banner_color || '#00aa45' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <SparkleIcon />
        <span>{event.banner_texto}</span>
        {timeLeft && (
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold flex items-center">
            <ClockIconInline />
            Termina en: {timeLeft}
          </span>
        )}
        <SparkleIcon />
      </div>
      
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar banner"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
