'use client';

import { useState } from 'react';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SpouseSection from '@/components/forms/SpouseSection';
import PropertyFinancialFields from '@/components/forms/PropertyFinancialFields';
import SocioFields from '@/components/forms/SocioFields';
import CompanySection from '@/components/forms/CompanySection';
import MaskedInput from '@/components/forms/MaskedInput';
import type { SpouseData, PropertyData, PersonData, CompanyData, LegalRepData } from '@/types/authorization';

export default function NovaAutorizacaoPage() {
    const bitrix = useBitrix24();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state (exemplo simplificado)
    const [authType, setAuthType] = useState<'pf-solteiro' | 'pf-casado' | 'socios' | 'pj'>('pf-solteiro');
    const [contratante, setContratante] = useState({
        nome: '',
        cpf: '',
        rg: '',
        email: '',
        telefone: '',
        profissao: '',
        estadoCivil: '',
        regimeCasamento: '',
        endereco: ''
    });

    // Estado do cônjuge (PF Casado)
    const [conjuge, setConjuge] = useState<SpouseData>({
        nome: '',
        cpf: '',
        rg: '',
        profissao: '',
        email: ''
    });

    // Estado dos sócios (Sociedade)
    const [socios, setSocios] = useState<PersonData[]>([
        {
            nome: '',
            cpf: '',
            rg: '',
            email: '',
            telefone: '',
            profissao: '',
            estadoCivil: '',
            regimeCasamento: '',
            endereco: ''
        }
    ]);

    // Estado da empresa (PJ)
    const [empresa, setEmpresa] = useState<CompanyData>({
        razaoSocial: '',
        cnpj: '',
        email: '',
        telefone: '',
        ie: '',
        endereco: ''
    });

    const [repLegal, setRepLegal] = useState<LegalRepData>({
        nome: '',
        cpf: '',
        cargo: ''
    });

    // Estado do imóvel
    const [imovel, setImovel] = useState<PropertyData>({
        descricao: '',
        endereco: '',
        valor: 0,
        matricula: '',
        adminCondominio: '',
        valorCondominio: 0,
        chamadaCapital: '',
        numParcelas: ''
    });

    const [contrato, setContrato] = useState({
        prazo: 90,
        comissaoPct: 6
    });

    // Fun\u00e7\u00f5es para gerenciar s\u00f3cios
    const adicionarSocio = () => {
        setSocios([...socios, {
            nome: '',
            cpf: '',
            rg: '',
            email: '',
            telefone: '',
            profissao: '',
            estadoCivil: '',
            regimeCasamento: '',
            endereco: ''
        }]);
    };

    const removerSocio = (index: number) => {
        if (socios.length > 1) {
            setSocios(socios.filter((_, i) => i !== index));
        }
    };

    const atualizarSocio = (index: number, socio: PersonData) => {
        const novosSocios = [...socios];
        novosSocios[index] = socio;
        setSocios(novosSocios);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Monta dados do formulário
            const formData = {
                authType,
                contratante,
                ...(authType === 'pf-casado' && { conjuge }), // Adiciona cônjuge se casado
                ...(authType === 'socios' && { socios, numSocios: socios.length }), // Adiciona sócios
                ...(authType === 'pj' && { empresa, repLegal }), // Adiciona empresa e representante
                imovelUnico: imovel, // Dados do imóvel
                contrato
            };

            // Envia para API
            const response = await fetch('/api/bitrix/cadastro-autorizacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData,
                    brokerId: bitrix.authId,
                    brokerDomain: bitrix.domain,
                    brokerAccessToken: bitrix.authId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erro ao cadastrar autorização');
            }

            alert(`✅ Autorização criada com sucesso!\nCompany ID: ${data.companyId}`);
            router.push('/dashboard');

        } catch (err: any) {
            console.error('[Form] Erro:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-beehouse-primary hover:underline">
                        ← Voltar ao Dashboard
                    </Link>
                </div>

                <div className="card">
                    <h1 className="text-3xl font-bold mb-6">Nova Autorização de Venda</h1>

                    {!bitrix.isInsideBitrix && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
                            <p className="text-yellow-800">
                                ⚠️ Modo standalone - Conecte-se ao Bitrix24 para usar todas as funcionalidades
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
                            <p className="text-red-800">❌ {error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tipo de Contratante */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Tipo de Contratante
                            </label>
                            <select
                                value={authType}
                                onChange={(e) => setAuthType(e.target.value as any)}
                                className="input"
                                required
                            >
                                <option value="pf-solteiro">Pessoa Física - Solteiro(a)</option>
                                <option value="pf-casado">Pessoa Física - Casado(a)</option>
                                <option value="socios">Sociedade</option>
                                <option value="pj">Pessoa Jurídica</option>
                            </select>
                        </div>

                        {/* Dados do Contratante (simplificado) */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Dados do Contratante</h3>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
                                <input
                                    type="text"
                                    value={contratante.nome}
                                    onChange={(e) => setContratante({ ...contratante, nome: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">CPF *</label>
                                    <MaskedInput
                                        value={contratante.cpf}
                                        onChange={(value) => setContratante({ ...contratante, cpf: value })}
                                        mask="cpf"
                                        validation="cpf"
                                        placeholder="000.000.000-00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">RG *</label>
                                    <MaskedInput
                                        value={contratante.rg}
                                        onChange={(value) => setContratante({ ...contratante, rg: value })}
                                        placeholder="00.000.000-0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Email *</label>
                                    <MaskedInput
                                        value={contratante.email}
                                        onChange={(value) => setContratante({ ...contratante, email: value })}
                                        validation="email"
                                        placeholder="email@exemplo.com"
                                        type="email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Telefone *</label>
                                    <MaskedInput
                                        value={contratante.telefone}
                                        onChange={(value) => setContratante({ ...contratante, telefone: value })}
                                        mask="phone"
                                        validation="phone"
                                        placeholder="(00) 00000-0000"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Profissão</label>
                                    <input
                                        type="text"
                                        value={contratante.profissao}
                                        onChange={(e) => setContratante({ ...contratante, profissao: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Estado Civil *</label>
                                    <select
                                        value={contratante.estadoCivil}
                                        onChange={(e) => setContratante({ ...contratante, estadoCivil: e.target.value })}
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

                            {/* Regime de Casamento (apenas se casado) */}
                            {(contratante.estadoCivil === 'casado' || authType === 'pf-casado') && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Regime de Casamento *</label>
                                    <select
                                        value={contratante.regimeCasamento}
                                        onChange={(e) => setContratante({ ...contratante, regimeCasamento: e.target.value })}
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

                            <div>
                                <label className="block text-sm font-semibold mb-2">Endereço Completo</label>
                                <input
                                    type="text"
                                    value={contratante.endereco}
                                    onChange={(e) => setContratante({ ...contratante, endereco: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Dados do Cônjuge (apenas PF Casado) */}
                        {authType === 'pf-casado' && (
                            <SpouseSection
                                spouse={conjuge}
                                onChange={setConjuge}
                            />
                        )}

                        {/* Dados dos Sócios (apenas Sociedade) */}
                        {authType === 'socios' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold">👥 Dados dos Sócios</h3>
                                    <button
                                        type="button"
                                        onClick={adicionarSocio}
                                        className="btn-secondary text-sm"
                                    >
                                        + Adicionar Sócio
                                    </button>
                                </div>

                                {socios.map((socio, index) => (
                                    <SocioFields
                                        key={index}
                                        socio={socio}
                                        index={index}
                                        onChange={(updatedSocio) => atualizarSocio(index, updatedSocio)}
                                        onRemove={() => removerSocio(index)}
                                        canRemove={socios.length > 1}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Dados da Empresa (apenas PJ) */}
                        {authType === 'pj' && (
                            <CompanySection
                                empresa={empresa}
                                repLegal={repLegal}
                                onEmpresaChange={setEmpresa}
                                onRepLegalChange={setRepLegal}
                            />
                        )}

                        {/* Dados do Imóvel */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">🏠 Dados do Imóvel</h3>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Descrição do Imóvel *</label>
                                <textarea
                                    value={imovel.descricao}
                                    onChange={(e) => setImovel({ ...imovel, descricao: e.target.value })}
                                    className="input"
                                    rows={2}
                                    placeholder="Ex: Apartamento 3 quartos, 2 vagas"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Endereço Completo *</label>
                                <input
                                    type="text"
                                    value={imovel.endereco}
                                    onChange={(e) => setImovel({ ...imovel, endereco: e.target.value })}
                                    className="input"
                                    placeholder="Rua, número, bairro, cidade"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Valor de Venda (R$) *</label>
                                <input
                                    type="number"
                                    value={imovel.valor || ''}
                                    onChange={(e) => setImovel({ ...imovel, valor: parseFloat(e.target.value) || 0 })}
                                    className="input"
                                    placeholder="0,00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>

                            {/* Campos Financeiros */}
                            <PropertyFinancialFields
                                matricula={imovel.matricula}
                                adminCondominio={imovel.adminCondominio}
                                valorCondominio={imovel.valorCondominio}
                                chamadaCapital={imovel.chamadaCapital}
                                numParcelas={imovel.numParcelas}
                                onChange={(field, value) => setImovel({ ...imovel, [field]: value })}
                            />
                        </div>

                        {/* Dados do Contrato */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Contrato</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Prazo de Exclusividade (dias) *
                                    </label>
                                    <input
                                        type="number"
                                        value={contrato.prazo}
                                        onChange={(e) => setContrato({ ...contrato, prazo: parseInt(e.target.value) })}
                                        className="input"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Comissão (%) *
                                    </label>
                                    <input
                                        type="number"
                                        value={contrato.comissaoPct}
                                        onChange={(e) => setContrato({ ...contrato, comissaoPct: parseFloat(e.target.value) })}
                                        className="input"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nota */}
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                            <p className="text-sm text-blue-800">
                                ℹ️ <strong>Nota:</strong> Este é um formulário simplificado para demonstração.
                                O formulário completo com todos os campos (cônjuge, sócios, imóveis) será implementado em breve.
                            </p>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar e Gerar PDF'}
                            </button>

                            <Link href="/dashboard" className="btn-secondary flex-1 text-center">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
