import { useState } from 'react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [codigo, setCodigo] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Te has suscrito correctamente');
        if (data.codigo) setCodigo(data.codigo);
        // Marcar en localStorage para no mostrar el popup
        try { localStorage.setItem('fashionstore_newsletter_completed', 'true'); } catch {}
      } else {
        setStatus('error');
        setMessage(data.message || 'Error al suscribirte');
        // Limpiar tras 4 segundos para poder reintentar
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 4000);
      }
    } catch {
      setStatus('error');
      setMessage('Error de conexión. Inténtalo de nuevo.');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'success') {
    return (
      <section style={{ background: '#00aa45' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: '#00aa45', fontSize: 24, fontWeight: 700
          }}>
            &#10003;
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            ¡Suscripción confirmada!
          </h2>
          <p style={{ fontSize: 16, color: '#fff', margin: '0 0 24px', lineHeight: 1.6 }}>
            {message}
          </p>
          {codigo && (
            <div style={{
              background: '#fff', borderRadius: 12, padding: '20px 24px',
              display: 'inline-block', border: 'none',
            }}>
              <p style={{ color: '#666', fontSize: 13, margin: '0 0 8px' }}>Tu código de descuento:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#00aa45', letterSpacing: 2 }}>
                  {codigo}
                </span>
                <button
                  onClick={copyCode}
                  style={{
                    background: copied ? '#00aa45' : '#00aa45',
                    color: '#fff', border: 'none', padding: '6px 14px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    transition: 'opacity 0.2s',
                    opacity: copied ? 0.8 : 1,
                  }}
                >
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: '#00aa45' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
          Suscríbete a nuestra newsletter
        </h2>
        <p style={{ fontSize: 16, color: '#fff', margin: '0 0 32px', lineHeight: 1.6 }}>
          Recibe las últimas novedades, ofertas exclusivas y un <strong style={{ color: '#fff', textDecoration: 'underline' }}>10% de descuento</strong> en tu primera compra.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto',
            flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            style={{
              flex: '1 1 260px', padding: '14px 18px', borderRadius: 8,
              border: 'none', background: '#fff',
              color: '#111', fontSize: 15, outline: 'none',
              transition: 'box-shadow 0.2s',
            }}
            onFocus={(e: any) => { e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.3)'; }}
            onBlur={(e: any) => { e.target.style.boxShadow = 'none'; }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '14px 28px', borderRadius: 8, border: 'none',
              background: '#fff', color: '#00aa45', fontSize: 15,
              fontWeight: 700, cursor: status === 'loading' ? 'wait' : 'pointer',
              transition: 'opacity 0.2s', opacity: status === 'loading' ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'loading' ? 'Suscribiendo...' : 'Suscribirme'}
          </button>
        </form>

        {status === 'error' && (
          <p style={{ color: '#ef4444', fontSize: 14, marginTop: 12 }}>
            {message}
          </p>
        )}

        <p style={{ fontSize: 12, color: '#fff', marginTop: 16 }}>
          Sin spam. Puedes darte de baja en cualquier momento.
        </p>
      </div>
    </section>
  );
}
