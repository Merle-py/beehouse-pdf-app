'use client';

import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
    label: string;
    icon: string;
    onClick: () => void;
}

interface DropdownProps {
    trigger: React.ReactNode;
    options: DropdownOption[];
}

export default function Dropdown({ trigger, options }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Trigger Button */}
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    option.onClick();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3"
                            >
                                <span className="text-xl">{option.icon}</span>
                                <span className="text-gray-800 font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
