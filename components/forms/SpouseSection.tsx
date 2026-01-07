'use client';

import React from 'react';
import MaskedInput from './MaskedInput';
import type { SpouseData } from '@/types/authorization';

interface SpouseSectionProps {
    spouse: SpouseData;
    onChange: (spouse: SpouseData) => void;
}

export default function SpouseSection({ spouse, onChange }: SpouseSectionProps) {
    const handleChange = (field: keyof SpouseData, value: string) => {
        onChange({ ...spouse, [field]: value });
    };

    return (
        <div className="space-y-4 p-6 bg-pink-50 border border-pink-200 rounded-lg">
            <h3 className="text-xl font-bold text-pink-900">👥 Dados do Cônjuge</h3>

            {/* Nome */}
            <div>
                <label className="block text-sm font-semibold mb-2">
                    Nome Completo do Cônjuge *
                </label>
                <input
                    type="text"
                    value={spouse.nome || ''}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="input"
                    placeholder="Nome completo"
                    required
                />
            </div>

            {/* CPF e RG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">CPF *</label>
                    <MaskedInput
                        value={spouse.cpf || ''}
                        onChange={(value) => handleChange('cpf', value)}
                        mask="cpf"
                        validation="cpf"
                        placeholder="000.000.000-00"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">RG *</label>
                    <input
                        type="text"
                        value={spouse.rg || ''}
                        onChange={(e) => handleChange('rg', e.target.value)}
                        className="input"
                        placeholder="00.000.000-0"
                        required
                    />
                </div>
            </div>

            {/* Profissão e Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Profissão *</label>
                    <input
                        type="text"
                        value={spouse.profissao || ''}
                        onChange={(e) => handleChange('profissao', e.target.value)}
                        className="input"
                        placeholder="Ex: Engenheiro(a)"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <MaskedInput
                        value={spouse.email || ''}
                        onChange={(value) => handleChange('email', value)}
                        validation="email"
                        placeholder="email@exemplo.com"
                        type="email"
                        required
                    />
                </div>
            </div>
        </div>
    );
}
