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
      <section style={{ background: '#111827' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#00aa45',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: '#fff', fontSize: 24, fontWeight: 700
          }}>
            &#10003;
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            ¡Suscripción confirmada!
          </h2>
          <p style={{ fontSize: 16, color: '#9ca3af', margin: '0 0 24px', lineHeight: 1.6 }}>
            {message}
          </p>
          {codigo && (
            <div style={{
              background: '#1f2937', borderRadius: 12, padding: '20px 24px',
              display: 'inline-block', border: '1px dashed #00aa45',
            }}>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 8px' }}>Tu código de descuento:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#00aa45', letterSpacing: 2 }}>
                  {codigo}
                </span>
                <button
                  onClick={copyCode}
                  style={{
                    background: copied ? '#00aa45' : '#374151',
                    color: '#fff', border: 'none', padding: '6px 14px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    transition: 'background 0.2s',
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
    <section style={{ background: '#111827' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
          Suscríbete a nuestra newsletter
        </h2>
        <p style={{ fontSize: 16, color: '#9ca3af', margin: '0 0 32px', lineHeight: 1.6 }}>
          Recibe las últimas novedades, ofertas exclusivas y un <strong style={{ color: '#00aa45' }}>10% de descuento</strong> en tu primera compra.
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
              border: '1px solid #374151', background: '#1f2937',
              color: '#fff', fontSize: 15, outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e: any) => { e.target.style.borderColor = '#00aa45'; }}
            onBlur={(e: any) => { e.target.style.borderColor = '#374151'; }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '14px 28px', borderRadius: 8, border: 'none',
              background: '#00aa45', color: '#fff', fontSize: 15,
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

        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 16 }}>
          Sin spam. Puedes darte de baja en cualquier momento.
        </p>
      </div>
    </section>
  );
}
