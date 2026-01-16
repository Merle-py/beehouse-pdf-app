'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/forms/Input';
import MaskedInput from '@/components/forms/MaskedInput';
import Select from '@/components/forms/Select';
import Textarea from '@/components/forms/Textarea';
import SpouseSection from '@/components/forms/SpouseSection';

export interface EmpresaFormData {
    tipo: 'PF' | 'PJ';
    // PF fields
    nome?: string;
    cpf?: string;
    rg?: string;
    profissao?: string;
    estado_civil?: string;
    regime_casamento?: string;
    endereco?: string;
    email?: string;
    telefone?: string;
    // Cônjuge
    conjuge_nome?: string;
    conjuge_cpf?: string;
    conjuge_rg?: string;
    conjuge_profissao?: string;
    conjuge_email?: string;
    // PJ fields
    razao_social?: string;
    cnpj?: string;
    inscricao_estadual?: string;
    inscricao_municipal?: string;
    endereco_sede?: string;
    // Rep Legal
    rep_legal_nome?: string;
    rep_legal_cpf?: string;
    rep_legal_cargo?: string;
}

interface EmpresaFormProps {
    initialData?: Partial<EmpresaFormData>;
    onSubmit: (data: EmpresaFormData) => void | Promise<void>;
    onCancel?: () => void;
    mode?: 'create' | 'edit';
    loading?: boolean;
}

export default function EmpresaForm({
    initialData,
    onSubmit,
    onCancel,
    mode = 'create',
    loading = false
}: EmpresaFormProps) {
    const [tipo, setTipo] = useState<'PF' | 'PJ'>(initialData?.tipo || 'PF');

    // PF state
    const [pfData, setPfData] = useState({
        nome: initialData?.nome || '',
        cpf: initialData?.cpf || '',
        rg: initialData?.rg || '',
        profissao: initialData?.profissao || '',
        estado_civil: initialData?.estado_civil || '',
        regime_casamento: initialData?.regime_casamento || '',
        endereco: initialData?.endereco || '',
        email: initialData?.email || '',
        telefone: initialData?.telefone || '',
    });

    // Cônjuge state
    const [conjugeData, setConjugeData] = useState({
        nome: initialData?.conjuge_nome || '',
        cpf: initialData?.conjuge_cpf || '',
        rg: initialData?.conjuge_rg || '',
        profissao: initialData?.conjuge_profissao || '',
        email: initialData?.conjuge_email || '',
    });

    // PJ state
    const [pjData, setPjData] = useState({
        razao_social: initialData?.razao_social || '',
        cnpj: initialData?.cnpj || '',
        inscricao_estadual: initialData?.inscricao_estadual || '',
        inscricao_municipal: initialData?.inscricao_municipal || '',
        endereco_sede: initialData?.endereco_sede || '',
        email: initialData?.email || '',
        telefone: initialData?.telefone || '',
    });

    // Rep Legal state
    const [repLegalData, setRepLegalData] = useState({
        nome: initialData?.rep_legal_nome || '',
        cpf: initialData?.rep_legal_cpf || '',
        cargo: initialData?.rep_legal_cargo || '',
    });

    const tipoOptions = [
        { value: 'PF', label: 'Pessoa Física' },
        { value: 'PJ', label: 'Pessoa Jurídica' }
    ];

    const estadoCivilOptions = [
        { value: 'solteiro', label: 'Solteiro(a)' },
        { value: 'casado', label: 'Casado(a)' },
        { value: 'divorciado', label: 'Divorciado(a)' },
        { value: 'viuvo', label: 'Viúvo(a)' }
    ];

    const regimeCasamentoOptions = [
        { value: 'comunhao-parcial', label: 'Comunhão Parcial de Bens' },
        { value: 'comunhao-universal', label: 'Comunhão Universal de Bens' },
        { value: 'separacao-total', label: 'Separação Total de Bens' },
        { value: 'participacao-final', label: 'Participação Final nos Aquestos' }
    ];

    const showConjuge = pfData.estado_civil === 'casado' || pfData.estado_civil === 'união estável';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData: EmpresaFormData = {
            tipo,
            ...(tipo === 'PF' ? {
                ...pfData,
                ...(showConjuge ? {
                    conjuge_nome: conjugeData.nome,
                    conjuge_cpf: conjugeData.cpf,
                    conjuge_rg: conjugeData.rg,
                    conjuge_profissao: conjugeData.profissao,
                    conjuge_email: conjugeData.email,
                } : {})
            } : {
                ...pjData,
                rep_legal_nome: repLegalData.nome,
                rep_legal_cpf: repLegalData.cpf,
                rep_legal_cargo: repLegalData.cargo,
            })
        };

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Empresa */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Tipo de Empresa</h3>
                <Select
                    label="Selecione o tipo"
                    value={tipo}
                    onChange={(v) => setTipo(v as 'PF' | 'PJ')}
                    options={tipoOptions}
                    disabled={mode === 'edit'}
                    required
                />
                {mode === 'edit' && (
                    <p className="text-sm text-gray-500 mt-2">
                        O tipo de empresa não pode ser alterado após a criação.
                    </p>
                )}
            </div>

            {/* Pessoa Física */}
            {tipo === 'PF' && (
                <>
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nome Completo"
                                value={pfData.nome}
                                onChange={(v) => setPfData({ ...pfData, nome: v })}
                                placeholder="Nome completo"
                                required
                            />
                            <MaskedInput
                                label="CPF"
                                value={pfData.cpf}
                                onChange={(v) => setPfData({ ...pfData, cpf: v })}
                                mask="cpf"
                                validation="cpf"
                                placeholder="000.000.000-00"
                                required
                            />
                            <Input
                                label="RG"
                                value={pfData.rg}
                                onChange={(v) => setPfData({ ...pfData, rg: v })}
                                placeholder="RG"
                            />
                            <Input
                                label="Profissão"
                                value={pfData.profissao}
                                onChange={(v) => setPfData({ ...pfData, profissao: v })}
                                placeholder="Profissão"
                            />
                            <Select
                                label="Estado Civil"
                                value={pfData.estado_civil}
                                onChange={(v) => setPfData({ ...pfData, estado_civil: v })}
                                options={estadoCivilOptions}
                                required
                            />
                            {(pfData.estado_civil === 'casado' || pfData.estado_civil === 'união estável') && (
                                <Select
                                    label="Regime de Casamento"
                                    value={pfData.regime_casamento}
                                    onChange={(v) => setPfData({ ...pfData, regime_casamento: v })}
                                    options={regimeCasamentoOptions}
                                    required
                                />
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Textarea
                                label="Endereço"
                                value={pfData.endereco}
                                onChange={(v) => setPfData({ ...pfData, endereco: v })}
                                placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                                rows={3}
                            />
                            <div className="space-y-4">
                                <MaskedInput
                                    label="Telefone"
                                    value={pfData.telefone}
                                    onChange={(v) => setPfData({ ...pfData, telefone: v })}
                                    mask="phone"
                                    validation="phone"
                                    placeholder="(00) 00000-0000"
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={pfData.email}
                                    onChange={(v) => setPfData({ ...pfData, email: v })}
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cônjuge */}
                    {showConjuge && (
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Dados do Cônjuge</h3>
                            <SpouseSection
                                spouse={conjugeData}
                                onChange={(spouse) => setConjugeData(spouse as any)}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Pessoa Jurídica */}
            {tipo === 'PJ' && (
                <>
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Razão Social"
                                value={pjData.razao_social}
                                onChange={(v) => setPjData({ ...pjData, razao_social: v })}
                                placeholder="Razão social da empresa"
                                required
                            />
                            <MaskedInput
                                label="CNPJ"
                                value={pjData.cnpj}
                                onChange={(v) => setPjData({ ...pjData, cnpj: v })}
                                mask="cnpj"
                                validation="cnpj"
                                placeholder="00.000.000/0000-00"
                                required
                            />
                            <Input
                                label="Inscrição Estadual"
                                value={pjData.inscricao_estadual}
                                onChange={(v) => setPjData({ ...pjData, inscricao_estadual: v })}
                                placeholder="Inscrição Estadual"
                            />
                            <Input
                                label="Inscrição Municipal"
                                value={pjData.inscricao_municipal}
                                onChange={(v) => setPjData({ ...pjData, inscricao_municipal: v })}
                                placeholder="Inscrição Municipal"
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Endereço e Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Textarea
                                label="Endereço da Sede"
                                value={pjData.endereco_sede}
                                onChange={(v) => setPjData({ ...pjData, endereco_sede: v })}
                                placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                                rows={3}
                            />
                            <div className="space-y-4">
                                <MaskedInput
                                    label="Telefone"
                                    value={pjData.telefone}
                                    onChange={(v) => setPjData({ ...pjData, telefone: v })}
                                    mask="phone"
                                    validation="phone"
                                    placeholder="(00) 00000-0000"
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={pjData.email}
                                    onChange={(v) => setPjData({ ...pjData, email: v })}
                                    placeholder="email@empresa.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Representante Legal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nome Completo"
                                value={repLegalData.nome}
                                onChange={(v) => setRepLegalData({ ...repLegalData, nome: v })}
                                placeholder="Nome do representante legal"
                                required
                            />
                            <MaskedInput
                                label="CPF"
                                value={repLegalData.cpf}
                                onChange={(v) => setRepLegalData({ ...repLegalData, cpf: v })}
                                mask="cpf"
                                validation="cpf"
                                placeholder="000.000.000-00"
                                required
                            />
                            <Input
                                label="Cargo"
                                value={repLegalData.cargo}
                                onChange={(v) => setRepLegalData({ ...repLegalData, cargo: v })}
                                placeholder="Ex: Diretor, Sócio-Administrador"
                                required
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Salvando...' : mode === 'create' ? 'Criar Empresa' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
}
