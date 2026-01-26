import { useState, type ReactNode } from 'react';

interface Props {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export default function CollapsibleFilter({ title, children, defaultOpen = false }: Props) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="w-full">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-3 px-0 font-bold text-gray-900 text-base"
            >
                <span>{title}</span>
                <span className={`transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 6.5L6 1.5L11 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {/* Content */}
            {isOpen && (
                <div className="pt-2">
                    {children}
                </div>
            )}
        </div>
    );
}
