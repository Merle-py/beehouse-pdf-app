'use client';

import React from 'react';
import type { CompanyData, LegalRepData } from '@/types/authorization';

interface CompanySectionProps {
    empresa: CompanyData;
    repLegal: LegalRepData;
    onEmpresaChange: (empresa: CompanyData) => void;
    onRepLegalChange: (repLegal: LegalRepData) => void;
}

export default function CompanySection({
    empresa,
    repLegal,
    onEmpresaChange,
    onRepLegalChange
}: CompanySectionProps) {

    const handleEmpresaChange = (field: keyof CompanyData, value: string | number) => {
        onEmpresaChange({ ...empresa, [field]: value });
    };

    const handleRepLegalChange = (field: keyof LegalRepData, value: string) => {
        onRepLegalChange({ ...repLegal, [field]: value });
    };

    return (
        <div className="space-y-6">
            {/* Dados da Empresa */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                <h3 className="text-xl font-bold text-blue-900">🏢 Dados da Empresa</h3>

                {/* Razão Social */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Razão Social *</label>
                    <input
                        type="text"
                        value={empresa.razaoSocial || ''}
                        onChange={(e) => handleEmpresaChange('razaoSocial', e.target.value)}
                        className="input"
                        placeholder="Nome completo da empresa"
                        required
                    />
                </div>

                {/* CNPJ e IE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">CNPJ *</label>
                        <input
                            type="text"
                            value={empresa.cnpj || ''}
                            onChange={(e) => handleEmpresaChange('cnpj', e.target.value)}
                            className="input"
                            placeholder="00.000.000/0000-00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Inscrição Estadual</label>
                        <input
                            type="text"
                            value={empresa.ie || ''}
                            onChange={(e) => handleEmpresaChange('ie', e.target.value)}
                            className="input"
                            placeholder="000.000.000.000"
                        />
                    </div>
                </div>

                {/* Email e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Email *</label>
                        <input
                            type="email"
                            value={empresa.email || ''}
                            onChange={(e) => handleEmpresaChange('email', e.target.value)}
                            className="input"
                            placeholder="contato@empresa.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Telefone *</label>
                        <input
                            type="tel"
                            value={empresa.telefone || ''}
                            onChange={(e) => handleEmpresaChange('telefone', e.target.value)}
                            className="input"
                            placeholder="(00) 0000-0000"
                            required
                        />
                    </div>
                </div>

                {/* Endereço */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Endereço Completo</label>
                    <input
                        type="text"
                        value={empresa.endereco || ''}
                        onChange={(e) => handleEmpresaChange('endereco', e.target.value)}
                        className="input"
                        placeholder="Rua, número, bairro, cidade"
                    />
                </div>
            </div>

            {/* Dados do Representante Legal */}
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
                <h3 className="text-xl font-bold text-green-900">👔 Representante Legal</h3>

                {/* Nome */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
                    <input
                        type="text"
                        value={repLegal.nome || ''}
                        onChange={(e) => handleRepLegalChange('nome', e.target.value)}
                        className="input"
                        placeholder="Nome do representante"
                        required
                    />
                </div>

                {/* CPF e Cargo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">CPF *</label>
                        <input
                            type="text"
                            value={repLegal.cpf || ''}
                            onChange={(e) => handleRepLegalChange('cpf', e.target.value)}
                            className="input"
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Cargo *</label>
                        <input
                            type="text"
                            value={repLegal.cargo || ''}
                            onChange={(e) => handleRepLegalChange('cargo', e.target.value)}
                            className="input"
                            placeholder="Ex: Diretor, Sócio-Gerente"
                            required
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
