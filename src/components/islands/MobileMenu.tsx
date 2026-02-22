import { useState } from "preact/hooks";

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const categories = [
        { name: "Inicio", href: "/" },
        { name: "Móviles", href: "/categoria/smartphones" },
        { name: "Portátiles", href: "/categoria/laptops" },
        { name: "Tablets", href: "/categoria/tablets" },
        { name: "Audio", href: "/categoria/audio" },
        { name: "Smartwatches", href: "/categoria/wearables" },
        { name: "Cámaras", href: "/categoria/camaras" },
        { name: "Monitores", href: "/categoria/monitores" },
        { name: "Consolas", href: "/categoria/consolas" },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-600 hover:text-purple-600 transition-colors relative group"
                aria-label="Menú principal"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-bounce shadow-sm">

                </span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[101] shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    {/* Header del Menú */}
                    <div className="p-6 bg-gradient-to-br from-purple-600 to-orange-500 text-white relative overflow-hidden">
                        {/* Carnival confetti effect (pure CSS) */}
                        <div className="absolute inset-0 pointer-events-none opacity-30">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full animate-float"
                                    style={{
                                        backgroundColor: ['#e2ff7a', '#00aa45', '#ffbe0b', '#fb5607'][i % 4],
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 5}s`,
                                        animationDuration: `${3 + Math.random() * 3}s`
                                    }}
                                />
                            ))}
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h2 className="text-2xl font-black italic">MENÚ</h2>
                                <p className="text-xs font-bold text-white/80 tracking-widest mt-1">FASHIONSTORE</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Cerrar menú"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Carnival Promotion in Menu */}
                        <div className="mt-8 relative z-10">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <p className="text-[10px] font-black tracking-widest text-white/90 mb-1">PROMOCIÓN ESPECIAL</p>
                                <h3 className="text-lg font-black leading-tight mb-2"> ¡VIVE EL CARNAVAL! </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">Cupón:</span>
                                    <span className="bg-[#e2ff7a] text-gray-900 px-2 py-0.5 rounded text-sm font-black animate-pulse">
                                        CARNAVAL20
                                    </span>
                                </div>
                                <p className="text-[10px] mt-2 font-bold text-white/70 italic text-right">-20% EN TODA LA TIENDA</p>
                            </div>
                        </div>
                    </div>

                    {/* Links de Navegación */}
                    <div className="flex-1 overflow-y-auto py-6 px-4">
                        <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mb-4 ml-2">CATEGORÍAS</p>
                        <nav className="space-y-1">
                            {categories.map((cat) => (
                                <a
                                    key={cat.href}
                                    href={cat.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-[#00aa45] hover:bg-gray-50 font-bold transition-all group"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-[#00aa45] transition-colors" />
                                    {cat.name}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Footer del Menú */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <a
                            href="/tienda"
                            className="w-full bg-gray-900 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Comprar Ahora
                        </a>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
        </>
    );
}
