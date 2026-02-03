import { useState } from 'react';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        asunto: 'Estado de mi pedido',
        mensaje: ''
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setStatus('loading');
        setStatusMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setStatusMessage('¡Mensaje enviado! Te responderemos pronto.');
                setFormData({ nombre: '', email: '', asunto: 'Estado de mi pedido', mensaje: '' });
            } else {
                setStatus('error');
                setStatusMessage(data.error || 'Hubo un error al enviar el mensaje.');
            }
        } catch (error) {
            setStatus('error');
            setStatusMessage('Error de conexión. Por favor, intenta de nuevo.');
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {status === 'success' ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Mensaje Enviado!</h3>
                    <p className="text-gray-600 mb-6">{statusMessage}</p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="text-[#00aa45] font-semibold hover:underline"
                    >
                        Enviar otro mensaje
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
                            {statusMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto</label>
                        <select
                            name="asunto"
                            value={formData.asunto}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent outline-none"
                        >
                            <option>Estado de mi pedido</option>
                            <option>Devolución / Garantía</option>
                            <option>Consulta de producto</option>
                            <option>Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje</label>
                        <textarea
                            name="mensaje"
                            value={formData.mensaje}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
                    </button>
                </form>
            )}
        </div>
    );
}
