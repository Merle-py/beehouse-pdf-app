'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Input from '@/components/forms/Input';
import MaskedInput from '@/components/forms/MaskedInput';
import Select from '@/components/forms/Select';
import Textarea from '@/components/forms/Textarea';
import SpouseSection from '@/components/forms/SpouseSection';
import PropertyFinancialFields from '@/components/forms/PropertyFinancialFields';
import SocioFields from '@/components/forms/SocioFields';
import { PersonData, SpouseData } from '@/types/authorization';

function NovaAutorizacaoForm() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [authType, setAuthType] = useState('');

    // Estados para dados do contratante
    const [contratante, setContratante] = useState({
        nome: '',
        cpfCnpj: '',
        telefone: '',
        email: '',
        estadoCivil: '',
        regimeCasamento: '',
        profissao: '',
        endereco: ''
    });

    // Estado para empresa (PJ)
    const [empresa, setEmpresa] = useState({
        razaoSocial: '',
        cnpj: '',
        ie: '',
        endereco: '',
        telefone: '',
        email: ''
    });

    // Estado para representante legal (PJ)
    const [repLegal, setRepLegal] = useState({
        nome: '',
        cpf: '',
        cargo: ''
    });

    // Estado para cônjuge (se casado)
    const [conjuge, setConjuge] = useState<SpouseData>({
        nome: '',
        cpf: '',
        profissao: '',
        email: ''
    });

    // Estado para imóvel
    const [imovel, setImovel] = useState({
        endereco: '',
        valor: '',
        matricula: '',
        administradora: '',
        valorCondominio: '',
        chamadaCapital: '',
        numeroParcelas: '',
        descricao: ''
    });

    // Estado para sócios (se "socios")
    const [socios, setSocios] = useState<PersonData[]>([{
        nome: '',
        cpf: '',
        estadoCivil: '',
        profissao: ''
    }]);

    // Atualizar estado civil automaticamente quando authType mudar
    useEffect(() => {
        if (authType === 'pf-solteiro') {
            setContratante(prev => ({ ...prev, estadoCivil: 'solteiro' }));
        } else if (authType === 'pf-casado') {
            setContratante(prev => ({ ...prev, estadoCivil: 'casado' }));
        }
    }, [authType]);

    const authTypeOptions = [
        { value: 'pf-solteiro', label: 'Pessoa Física Solteiro' },
        { value: 'pf-casado', label: 'Pessoa Física Casado' },
        { value: 'socios', label: 'Sociedade (Múltiplos Sócios)' },
        { value: 'pj', label: 'Pessoa Jurídica' }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = {
                authType,
                ...(authType === 'pj' ? {
                    empresa: {
                        ...empresa,
                        cnpj: empresa.cnpj.replace(/\D/g, '')
                    },
                    repLegal: {
                        ...repLegal,
                        cpf: repLegal.cpf.replace(/\D/g, '')
                    }
                } : {
                    contratante: {
                        ...contratante,
                        cpf: contratante.cpfCnpj.replace(/\D/g, '')
                    }
                }),
                ...(authType === 'pf-casado' && {
                    conjuge: {
                        ...conjuge,
                        cpf: conjuge.cpf?.replace(/\D/g, '') || ''
                    }
                }),
                ...(authType === 'socios' && { socios }),
                imovel: {
                    ...imovel,
                    valor: parseFloat(imovel.valor) || 0,
                    valorCondominio: parseFloat(imovel.valorCondominio) || 0
                },
                contrato: {
                    prazo: 90,
                    comissaoPct: 6
                }
            };

            // Usar nova API de geração direta de PDF
            const response = await fetch('/api/pdf/generate-authorization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('PDF gerado com sucesso!');

                // Fazer download automático do PDF
                const link = document.createElement('a');
                link.href = result.pdfUrl;
                link.download = result.pdfFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Opcional: redirecionar ou limpar formulário
                toast.success('Download iniciado!');
            } else {
                toast.error('Erro ao gerar PDF: ' + result.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao gerar PDF');
        } finally {
            setLoading(false);
        }
    };

    const addSocio = () => {
        setSocios([...socios, {
            nome: '',
            cpf: '',
            estadoCivil: '',
            profissao: '',
            endereco: ''
        }]);
    };

    const removeSocio = (index: number) => {
        setSocios(socios.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Nova Autorização</h1>
                    <p className="text-gray-600 mt-2">Preencha os dados para criar uma nova autorização</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Autorização */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">Tipo de Autorização</h2>
                        <Select
                            label="Selecione o tipo"
                            value={authType}
                            onChange={setAuthType}
                            options={authTypeOptions}
                            placeholder="Escolha o tipo de autorização"
                            required
                        />
                    </div>


                    {/* Dados da Empresa (PJ) */}
                    {authType === 'pj' && (
                        <>
                            <div className="card">
                                <h2 className="text-xl font-bold mb-4">Dados da Empresa</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Razão Social"
                                        value={empresa.razaoSocial}
                                        onChange={(v) => setEmpresa({ ...empresa, razaoSocial: v })}
                                        placeholder="Digite a razão social"
                                        required
                                    />
                                    <MaskedInput
                                        label="CNPJ"
                                        value={empresa.cnpj}
                                        onChange={(v) => setEmpresa({ ...empresa, cnpj: v })}
                                        mask="cnpj"
                                        validation="cnpj"
                                        placeholder="00.000.000/0000-00"
                                        required
                                    />
                                    <Input
                                        label="Inscrição Estadual/Municipal"
                                        value={empresa.ie}
                                        onChange={(v) => setEmpresa({ ...empresa, ie: v })}
                                        placeholder="Inscrição Estadual ou Municipal"
                                    />
                                    <Input
                                        label="Endereço da Sede"
                                        value={empresa.endereco}
                                        onChange={(v) => setEmpresa({ ...empresa, endereco: v })}
                                        placeholder="Endereço completo da sede"
                                    />
                                    <MaskedInput
                                        label="Telefone"
                                        value={empresa.telefone}
                                        onChange={(v) => setEmpresa({ ...empresa, telefone: v })}
                                        mask="phone"
                                        validation="phone"
                                        placeholder="(00) 00000-0000"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={empresa.email}
                                        onChange={(v) => setEmpresa({ ...empresa, email: v })}
                                        placeholder="email@empresa.com"
                                    />
                                </div>
                            </div>

                            {/* Dados do Representante Legal */}
                            <div className="card">
                                <h2 className="text-xl font-bold mb-4">Representante Legal</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nome Completo"
                                        value={repLegal.nome}
                                        onChange={(v) => setRepLegal({ ...repLegal, nome: v })}
                                        placeholder="Nome do representante legal"
                                        required
                                    />
                                    <MaskedInput
                                        label="CPF"
                                        value={repLegal.cpf}
                                        onChange={(v) => setRepLegal({ ...repLegal, cpf: v })}
                                        mask="cpf"
                                        validation="cpf"
                                        placeholder="000.000.000-00"
                                        required
                                    />
                                    <Input
                                        label="Cargo"
                                        value={repLegal.cargo}
                                        onChange={(v) => setRepLegal({ ...repLegal, cargo: v })}
                                        placeholder="Ex: Diretor, Sócio-Administrador"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Dados do Contratante (PF) */}
                    {authType && authType !== 'pj' && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Dados do Contratante</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nome Completo"
                                    value={contratante.nome}
                                    onChange={(v) => setContratante({ ...contratante, nome: v })}
                                    placeholder="Digite o nome completo"
                                    required
                                />
                                <MaskedInput
                                    label="CPF"
                                    value={contratante.cpfCnpj}
                                    onChange={(v) => setContratante({ ...contratante, cpfCnpj: v })}
                                    mask="cpf"
                                    validation="cpf"
                                    placeholder="000.000.000-00"
                                    required
                                />
                                <Input
                                    label="Endereço Residencial"
                                    value={contratante.endereco}
                                    onChange={(v) => setContratante({ ...contratante, endereco: v })}
                                    placeholder="Endereço completo"
                                />
                                <MaskedInput
                                    label="Telefone"
                                    value={contratante.telefone}
                                    onChange={(v) => setContratante({ ...contratante, telefone: v })}
                                    mask="phone"
                                    validation="phone"
                                    placeholder="(00) 00000-0000"
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={contratante.email}
                                    onChange={(v) => setContratante({ ...contratante, email: v })}
                                    placeholder="email@exemplo.com"
                                    required
                                />
                                <Select
                                    label="Estado Civil"
                                    value={contratante.estadoCivil}
                                    onChange={(v) => setContratante({ ...contratante, estadoCivil: v })}
                                    options={estadoCivilOptions}
                                    disabled={authType === 'pf-solteiro' || authType === 'pf-casado'}
                                    required
                                />
                                {contratante.estadoCivil === 'casado' && (
                                    <Select
                                        label="Regime de Casamento"
                                        value={contratante.regimeCasamento}
                                        onChange={(v) => setContratante({ ...contratante, regimeCasamento: v })}
                                        options={regimeCasamentoOptions}
                                        required
                                    />
                                )}
                                <Input
                                    label="Profissão"
                                    value={contratante.profissao}
                                    onChange={(v) => setContratante({ ...contratante, profissao: v })}
                                    placeholder="Digite a profissão"
                                />
                            </div>
                        </div>
                    )}

                    {/* Dados do Cônjuge */}
                    {authType === 'pf-casado' && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Dados do Cônjuge</h2>
                            <SpouseSection
                                spouse={conjuge}
                                onChange={(spouse) => setConjuge(spouse as SpouseData)}
                            />
                        </div>
                    )}

                    {/* Sócios (PJ) */}
                    {authType === 'pj' && (
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Sócios</h2>
                                <button
                                    type="button"
                                    onClick={addSocio}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    ➕ Adicionar Sócio
                                </button>
                            </div>
                            {socios.map((socio, index) => (
                                <SocioFields
                                    key={index}
                                    index={index}
                                    socio={socio}
                                    onChange={(updatedSocio) => {
                                        const newSocios = [...socios];
                                        newSocios[index] = updatedSocio;
                                        setSocios(newSocios);
                                    }}
                                    onRemove={() => removeSocio(index)}
                                    canRemove={socios.length > 1}
                                />
                            ))}
                        </div>
                    )}

                    {/* Dados do Imóvel */}
                    {authType && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Dados do Imóvel</h2>
                            <div className="space-y-4">
                                <Textarea
                                    label="Endereço Completo"
                                    value={imovel.endereco}
                                    onChange={(v) => setImovel({ ...imovel, endereco: v })}
                                    placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                                    rows={3}
                                    required
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Valor do Imóvel"
                                        type="number"
                                        value={imovel.valor}
                                        onChange={(v) => setImovel({ ...imovel, valor: v })}
                                        placeholder="0.00"
                                        required
                                    />
                                    <Input
                                        label="Matrícula"
                                        value={imovel.matricula}
                                        onChange={(v) => setImovel({ ...imovel, matricula: v })}
                                        placeholder="Número da matrícula"
                                    />
                                </div>
                                <PropertyFinancialFields
                                    matricula={imovel.matricula}
                                    adminCondominio={imovel.administradora}
                                    valorCondominio={parseFloat(imovel.valorCondominio) || 0}
                                    chamadaCapital={imovel.chamadaCapital}
                                    numParcelas={imovel.numeroParcelas}
                                    onChange={(field, value) => setImovel({ ...imovel, [field]: value })}
                                />
                                <Textarea
                                    label="Descrição do Imóvel"
                                    value={imovel.descricao}
                                    onChange={(v) => setImovel({ ...imovel, descricao: v })}
                                    placeholder="Detalhes adicionais sobre o imóvel"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Botões de Ação */}
                    {authType && (
                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn-secondary"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Gerando PDF...' : 'Gerar PDF'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default NovaAutorizacaoForm;
