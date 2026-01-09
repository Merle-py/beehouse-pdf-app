'use client';

import React, { ChangeEvent } from 'react';
import { maskCPF, maskCNPJ, maskCPFCNPJ, maskPhone, validateCPF, validateCNPJ, validateCPFCNPJ, validateEmail, validatePhone } from '@/lib/utils/validators';

type MaskType = 'cpf' | 'cnpj' | 'cpfCnpj' | 'phone' | 'none';
type ValidationType = 'cpf' | 'cnpj' | 'cpfCnpj' | 'email' | 'phone' | 'none';

interface MaskedInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    mask?: MaskType;
    validation?: ValidationType;
    placeholder?: string;
    required?: boolean;
    className?: string;
    type?: string;
}

export default function MaskedInput({
    label,
    value,
    onChange,
    mask = 'none',
    validation = 'none',
    placeholder,
    required,
    className = 'input',
    type = 'text'
}: MaskedInputProps) {
    const [error, setError] = React.useState<string>('');
    const [touched, setTouched] = React.useState(false);

    const applyMask = (rawValue: string): string => {
        switch (mask) {
            case 'cpf':
                return maskCPF(rawValue);
            case 'cnpj':
                return maskCNPJ(rawValue);
            case 'cpfCnpj':
                return maskCPFCNPJ(rawValue);
            case 'phone':
                return maskPhone(rawValue);
            default:
                return rawValue;
        }
    };

    const validate = (val: string): string => {
        if (!touched || !val) return '';

        switch (validation) {
            case 'cpf':
                return validateCPF(val) ? '' : 'CPF inválido';
            case 'cnpj':
                return validateCNPJ(val) ? '' : 'CNPJ inválido';
            case 'cpfCnpj':
                return validateCPFCNPJ(val) ? '' : 'CPF/CNPJ inválido';
            case 'email':
                return validateEmail(val) ? '' : 'Email inválido';
            case 'phone':
                return validatePhone(val) ? '' : 'Telefone inválido';
            default:
                return '';
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const maskedValue = applyMask(rawValue);
        onChange(maskedValue);

        if (touched) {
            setError(validate(maskedValue));
        }
    };

    const handleBlur = () => {
        setTouched(true);
        setError(validate(value));
    };

    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                className={`w-full px-4 py-3 border-2 rounded-lg 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                           transition-all duration-200 bg-white text-gray-900 
                           placeholder-gray-400 hover:border-gray-400
                           ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
            />
            {error && (
                <p className="text-red-600 text-sm mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
