import { useState, useRef, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';

interface Product {
    id: string;
    name: string;
    price: number;
    slug: string;
    price_original?: number;
    image: string;
}

interface ActionButton {
    label: string;
    url: string;
    primary?: boolean;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    products?: Product[];
    buttons?: ActionButton[];
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! 👋 Soy el asistente virtual de FashionStore. Puedo ayudarte a encontrar los mejores productos tecnológicos, comparar modelos, revisar descuentos y elegir la opción perfecta para ti.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) throw new Error('Error en el chat');

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply,
                products: data.products,
                buttons: data.buttons
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Botón Flotante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`shadow-lg transition-transform duration-300 hover:scale-110 flex items-center justify-center w-14 h-14 rounded-full text-white ${isOpen ? 'bg-gray-800' : 'bg-[#00aa45]'}`}
                aria-label={isOpen ? "Cerrar chat" : "Abrir chat de soporte"}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                )}
            </button>

            {/* Ventana del Chat */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[90vw] sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-slide-up origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-3">
                        <div className="rounded-full overflow-hidden">
                            <img src="/admin-logo.png" alt="Bot" className="w-10 h-10 object-cover" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Asistente Virtual</h3>
                            <p className="text-xs text-gray-300 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                                En línea
                            </p>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#00aa45] text-white rounded-br-none'
                                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>

                                {/* Product Cards Grid */}
                                {
                                    msg.products && msg.products.length > 0 && (
                                        <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mt-2`}>
                                            <div className="w-[85%] grid gap-2">
                                                {msg.products.map(p => (
                                                    <div key={p.id} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                                                        <img src={p.image || '/placeholder.jpg'} alt={p.name} className="w-12 h-12 object-cover rounded-lg bg-gray-50 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs text-[#00aa45] font-bold">{p.price} €</p>
                                                                {p.price_original && (
                                                                    <p className="text-[10px] text-gray-400 line-through">{p.price_original} €</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <a href={`/productos/${p.slug}`} className="bg-gray-900 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg hover:bg-black transition-colors">
                                                            Ver
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Action Buttons */}
                                {
                                    msg.buttons && msg.buttons.length > 0 && (
                                        <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mt-2`}>
                                            <div className="max-w-[85%] flex flex-wrap gap-2">
                                                {msg.buttons.map((btn, i) => (
                                                    <a
                                                        key={i}
                                                        href={btn.url}
                                                        className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${btn.primary
                                                            ? 'bg-[#00aa45] text-white hover:bg-[#009340] shadow-md'
                                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {btn.label}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 bg-gray-100 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00aa45]/50 transition-all border border-transparent"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-[#00aa45] text-white p-2.5 rounded-full hover:bg-[#009340] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            aria-label="Enviar mensaje"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            )
            }

            {/* Estilos para animación de entrada */}
            <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out forwards;
        }
        .scrollbar-hide {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
        </div >
    );
}
