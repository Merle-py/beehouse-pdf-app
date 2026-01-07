'use client';

import React from 'react';

interface PropertyFinancialFieldsProps {
    matricula?: string;
    adminCondominio?: string;
    valorCondominio?: number;
    chamadaCapital?: string;
    numParcelas?: string;
    onChange: (field: string, value: string | number) => void;
}

export default function PropertyFinancialFields({
    matricula,
    adminCondominio,
    valorCondominio,
    chamadaCapital,
    numParcelas,
    onChange
}: PropertyFinancialFieldsProps) {
    return (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900">📋 Informações Adicionais do Imóvel</h4>

            {/* Matrícula */}
            <div>
                <label className="block text-sm font-semibold mb-2">
                    Matrícula do Imóvel
                </label>
                <input
                    type="text"
                    value={matricula || ''}
                    onChange={(e) => onChange('matricula', e.target.value)}
                    className="input"
                    placeholder="Número da matrícula"
                />
            </div>

            {/* Administradora e Valor do Condomínio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">
                        Administradora do Condomínio
                    </label>
                    <input
                        type="text"
                        value={adminCondominio || ''}
                        onChange={(e) => onChange('adminCondominio', e.target.value)}
                        className="input"
                        placeholder="Nome da administradora"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">
                        Valor do Condomínio (R$)
                    </label>
                    <input
                        type="number"
                        value={valorCondominio || ''}
                        onChange={(e) => onChange('valorCondominio', parseFloat(e.target.value) || 0)}
                        className="input"
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                    />
                </div>
            </div>

            {/* Chamada de Capital e Número de Parcelas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">
                        Chamada de Capital
                    </label>
                    <select
                        value={chamadaCapital || ''}
                        onChange={(e) => onChange('chamadaCapital', e.target.value)}
                        className="input"
                    >
                        <option value="">Selecione...</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">
                        Número de Parcelas
                    </label>
                    <input
                        type="text"
                        value={numParcelas || ''}
                        onChange={(e) => onChange('numParcelas', e.target.value)}
                        className="input"
                        placeholder="Ex: 120x"
                    />
                </div>
            </div>
        </div>
    );
}
