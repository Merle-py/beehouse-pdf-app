'use client';

import React, { ChangeEvent } from 'react';
import { maskCPF, maskCNPJ, maskPhone, validateCPF, validateCNPJ, validateEmail, validatePhone } from '@/lib/utils/validators';

type MaskType = 'cpf' | 'cnpj' | 'phone' | 'none';
type ValidationType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'none';

interface MaskedInputProps {
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
        <div className="w-full">
            <input
                type={type}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                className={`${className} ${error ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {error && (
                <p className="text-red-600 text-sm mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
