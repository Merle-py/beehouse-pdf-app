'use client';

import React from 'react';
import type { PersonData } from '@/types/authorization';

interface SocioFieldsProps {
    socio: PersonData;
    index: number;
    onChange: (socio: PersonData) => void;
    onRemove: () => void;
    canRemove: boolean;
}

export default function SocioFields({ socio, index, onChange, onRemove, canRemove }: SocioFieldsProps) {
    const handleChange = (field: keyof PersonData, value: string) => {
        onChange({ ...socio, [field]: value });
    };

    return (
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-purple-900">👤 Sócio {index + 1}</h4>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm"
                    >
                        ✕ Remover
                    </button>
                )}
            </div>

            {/* Nome */}
            <div>
                <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
                <input
                    type="text"
                    value={socio.nome || ''}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="input"
                    placeholder="Nome completo do sócio"
                    required
                />
            </div>

            {/* CPF e RG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">CPF *</label>
                    <input
                        type="text"
                        value={socio.cpf || ''}
                        onChange={(e) => handleChange('cpf', e.target.value)}
                        className="input"
                        placeholder="000.000.000-00"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">RG *</label>
                    <input
                        type="text"
                        value={socio.rg || ''}
                        onChange={(e) => handleChange('rg', e.target.value)}
                        className="input"
                        placeholder="00.000.000-0"
                        required
                    />
                </div>
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <input
                        type="email"
                        value={socio.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="input"
                        placeholder="email@exemplo.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Telefone *</label>
                    <input
                        type="tel"
                        value={socio.telefone || ''}
                        onChange={(e) => handleChange('telefone', e.target.value)}
                        className="input"
                        placeholder="(00) 00000-0000"
                        required
                    />
                </div>
            </div>

            {/* Profissão, Estado Civil e Regime */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Profissão</label>
                    <input
                        type="text"
                        value={socio.profissao || ''}
                        onChange={(e) => handleChange('profissao', e.target.value)}
                        className="input"
                        placeholder="Ex: Empresário(a)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Estado Civil *</label>
                    <select
                        value={socio.estadoCivil || ''}
                        onChange={(e) => handleChange('estadoCivil', e.target.value)}
                        className="input"
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="solteiro">Solteiro(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viuvo">Viúvo(a)</option>
                        <option value="uniao-estavel">União Estável</option>
                    </select>
                </div>
            </div>

            {/* Regime de Casamento (se casado) */}
            {socio.estadoCivil === 'casado' && (
                <div>
                    <label className="block text-sm font-semibold mb-2">Regime de Casamento *</label>
                    <select
                        value={socio.regimeCasamento || ''}
                        onChange={(e) => handleChange('regimeCasamento', e.target.value)}
                        className="input"
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="comunhao-parcial">Comunhão Parcial de Bens</option>
                        <option value="comunhao-universal">Comunhão Universal de Bens</option>
                        <option value="separacao-total">Separação Total de Bens</option>
                        <option value="participacao-final">Participação Final nos Aquestos</option>
                    </select>
                </div>
            )}

            {/* Endereço */}
            <div>
                <label className="block text-sm font-semibold mb-2">Endereço Completo</label>
                <input
                    type="text"
                    value={socio.endereco || ''}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    className="input"
                    placeholder="Rua, número, bairro, cidade"
                />
            </div>
        </div>
    );
}
