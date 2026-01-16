'use client';

import { useState } from 'react';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import PropertyFinancialFields from '@/components/forms/PropertyFinancialFields';

export interface ImovelFormData {
    empresa_id: number;
    descricao: string;
    endereco: string;
    valor: number;
    matricula?: string;
    admin_condominio?: string;
    valor_condominio?: number;
    chamada_capital?: string;
    num_parcelas?: number;
}

interface ImovelFormProps {
    empresaId: number;
    empresaNome: string;  // Para exibir o nome da empresa
    initialData?: Partial<ImovelFormData>;
    onSubmit: (data: ImovelFormData) => void | Promise<void>;
    onCancel?: () => void;
    mode?: 'create' | 'edit';
    loading?: boolean;
}

export default function ImovelForm({
    empresaId,
    empresaNome,
    initialData,
    onSubmit,
    onCancel,
    mode = 'create',
    loading = false
}: ImovelFormProps) {
    const [formData, setFormData] = useState({
        descricao: initialData?.descricao || '',
        endereco: initialData?.endereco || '',
        valor: initialData?.valor?.toString() || '',
        matricula: initialData?.matricula || '',
        admin_condominio: initialData?.admin_condominio || '',
        valor_condominio: initialData?.valor_condominio?.toString() || '',
        chamada_capital: initialData?.chamada_capital || '',
        num_parcelas: initialData?.num_parcelas?.toString() || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: ImovelFormData = {
            empresa_id: empresaId,
            descricao: formData.descricao,
            endereco: formData.endereco,
            valor: parseFloat(formData.valor) || 0,
            matricula: formData.matricula || undefined,
            admin_condominio: formData.admin_condominio || undefined,
            valor_condominio: formData.valor_condominio ? parseFloat(formData.valor_condominio) : undefined,
            chamada_capital: formData.chamada_capital || undefined,
            num_parcelas: formData.num_parcelas ? parseInt(formData.num_parcelas) : undefined,
        };

        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Empresa Info */}
            <div className="card bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                        <p className="text-sm text-gray-600">Empresa vinculada</p>
                        <p className="font-semibold text-gray-900">{empresaNome}</p>
                    </div>
                </div>
                {mode === 'edit' && (
                    <p className="text-xs text-gray-500 mt-2">
                        A empresa vinculada não pode ser alterada.
                    </p>
                )}
            </div>

            {/* Dados Básicos */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Dados do Imóvel</h3>
                <div className="space-y-4">
                    <Textarea
                        label="Descrição"
                        value={formData.descricao}
                        onChange={(v) => setFormData({ ...formData, descricao: v })}
                        placeholder="Ex: Apartamento 3 quartos, Casa térrea, Sala comercial..."
                        rows={2}
                        required
                    />
                    <Textarea
                        label="Endereço Completo"
                        value={formData.endereco}
                        onChange={(v) => setFormData({ ...formData, endereco: v })}
                        placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                        rows={3}
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Valor do Imóvel"
                            type="number"
                            step="0.01"
                            value={formData.valor}
                            onChange={(v) => setFormData({ ...formData, valor: v })}
                            placeholder="0.00"
                            required
                        />
                        <Input
                            label="Matrícula"
                            value={formData.matricula}
                            onChange={(v) => setFormData({ ...formData, matricula: v })}
                            placeholder="Número da matrícula do imóvel"
                        />
                    </div>
                </div>
            </div>

            {/* Dados Financeiros */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Informações Financeiras (Opcional)</h3>
                <PropertyFinancialFields
                    adminCondominio={formData.admin_condominio}
                    valorCondominio={parseFloat(formData.valor_condominio) || 0}
                    chamadaCapital={formData.chamada_capital}
                    numParcelas={formData.num_parcelas}
                    onChange={(field, value) => {
                        setFormData({
                            ...formData,
                            [field]: value?.toString() || ''
                        });
                    }}
                />
            </div>

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
                    {loading ? 'Salvando...' : mode === 'create' ? 'Criar Imóvel' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
}
