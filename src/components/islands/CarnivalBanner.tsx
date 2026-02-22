import { useState, useEffect } from "preact/hooks";

export default function CarnivalBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="relative bg-gradient-to-r from-[#00aa45] via-[#e2ff7a] to-[#00aa45] py-3 px-4 overflow-hidden shadow-lg border-b border-[#00aa45]/20">
            {/* Animated background elements - using darker green for contrast patterns */}
            <div className="absolute inset-0 opacity-10 flex justify-around items-center pointer-events-none">
                <div className="animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="animate-bounce" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-8 flex-wrap relative z-10">
                {/* Main Title */}
                <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-extrabold italic text-sm sm:text-lg tracking-tight uppercase animate-shimmer">
                        ¡LLEGA EL CARNAVAL A FASHIONSTORE!
                    </p>
                </div>

                {/* Promo Badge */}
                <div className="flex items-center gap-2 bg-gray-900/10 backdrop-blur-sm px-5 py-1.5 rounded-full border border-gray-900/10 shadow-sm animate-float-subtle">
                    <span className="text-gray-900 font-bold text-xs sm:text-sm">Usa el cupón:</span>
                    <span className="bg-gray-900 text-[#e2ff7a] px-3 py-0.5 rounded-md font-black text-sm tracking-wider animate-pulse">
                        CARNAVAL20
                    </span>
                    <span className="text-gray-900 font-black text-sm">-20% EXTRA</span>
                </div>

                {/* Tagline */}
                <div className="hidden lg:flex items-center gap-2 text-gray-900 font-black text-xs tracking-widest animate-float-subtle">
                    <span className="animate-pulse">TECNOLOGÍA AL RITMO DE LA FIESTA</span>
                </div>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900/50 hover:text-gray-900 transition-colors p-1"
                aria-label="Cerrar promoción"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-float-subtle {
          animation: float-subtle 4s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
