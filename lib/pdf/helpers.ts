/**
 * Formata um valor numérico como moeda brasileira
 */
export function formatCurrency(value?: number): string {
    if (!value || isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata uma data no formato brasileiro por extenso
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Converte FormData para o formato legado esperado pelo gerador de PDF
 */
export function convertFormDataToPDFData(formData: any): any {
    const pdfData: any = {
        authType: formData.authType,
        contratoPrazo: formData.contrato?.prazo || 0,
        contratoComissaoPct: formData.contrato?.comissaoPct || 6,
    };

    // Converte dados de PJ
    if (formData.authType === 'pj' && formData.empresa) {
        pdfData.empresaRazaoSocial = formData.empresa.razaoSocial;
        pdfData.empresaCnpj = formData.empresa.cnpj;
        pdfData.empresaEmail = formData.empresa.email;
        pdfData.empresaTelefone = formData.empresa.telefone;
        pdfData.empresaIe = formData.empresa.ie;
        pdfData.empresaEndereco = formData.empresa.endereco;

        if (formData.repLegal) {
            pdfData.repNome = formData.repLegal.nome;
            pdfData.repCpf = formData.repLegal.cpf;
            pdfData.repCargo = formData.repLegal.cargo;
        }
    }

    // Converte dados de PF/Sócios
    if (formData.authType === 'pf-solteiro' || formData.authType === 'pf-casado') {
        if (formData.contratante) {
            pdfData.contratanteNome = formData.contratante.nome;
            pdfData.contratanteCpf = formData.contratante.cpf;
            pdfData.contratanteRg = formData.contratante.rg;
            pdfData.contratanteProfissao = formData.contratante.profissao;
            pdfData.contratanteEstadoCivil = formData.contratante.estadoCivil;
            pdfData.contratanteRegimeCasamento = formData.contratante.regimeCasamento;
            pdfData.contratanteEndereco = formData.contratante.endereco;
            pdfData.contratanteEmail = formData.contratante.email;
        }

        if (formData.authType === 'pf-casado' && formData.conjuge) {
            pdfData.conjugeNome = formData.conjuge.nome;
            pdfData.conjugeCpf = formData.conjuge.cpf;
            pdfData.conjugeRg = formData.conjuge.rg;
            pdfData.conjugeProfissao = formData.conjuge.profissao;
            pdfData.conjugeEmail = formData.conjuge.email;
        }
    }

    // Converte dados de Sócios
    if (formData.authType === 'socios' && formData.socios) {
        pdfData.numSocios = formData.numSocios || formData.socios.length;
        formData.socios.forEach((socio: any, index: number) => {
            const i = index + 1;
            pdfData[`socio${i}Nome`] = socio.nome;
            pdfData[`socio${i}Cpf`] = socio.cpf;
            pdfData[`socio${i}Rg`] = socio.rg;
            pdfData[`socio${i}Profissao`] = socio.profissao;
            pdfData[`socio${i}EstadoCivil`] = socio.estadoCivil;
            pdfData[`socio${i}RegimeCasamento`] = socio.regimeCasamento;
            pdfData[`socio${i}Endereco`] = socio.endereco;
            pdfData[`socio${i}Email`] = socio.email;
        });
    }

    // Converte dados de Imóvel (único)
    if (formData.imovelUnico) {
        pdfData.imovelDescricao = formData.imovelUnico.descricao;
        pdfData.imovelValor = formData.imovelUnico.valor;
        pdfData.imovelEndereco = formData.imovelUnico.endereco;
        pdfData.imovelMatricula = formData.imovelUnico.matricula;
        pdfData.imovelAdminCondominio = formData.imovelUnico.adminCondominio;
        pdfData.imovelValorCondominio = formData.imovelUnico.valorCondominio;
        pdfData.imovelChamadaCapital = formData.imovelUnico.chamadaCapital;
        pdfData.imovelNumParcelas = formData.imovelUnico.numParcelas;
    }

    // Converte dados de Múltiplos Imóveis
    if (formData.imoveisMultiplos) {
        pdfData.qtdImoveis = formData.imoveisMultiplos.qtdImoveis;
        formData.imoveisMultiplos.unidades?.forEach((unidade: any, index: number) => {
            pdfData[`imovelDescricao_${index}`] = unidade.descricao;
            pdfData[`imovelValor_${index}`] = unidade.valor;
        });
        pdfData.imovelEndereco = formData.imoveisMultiplos.enderecoEmpreendimento;
        pdfData.imovelMatricula = formData.imoveisMultiplos.matricula;
        pdfData.imovelAdminCondominio = formData.imoveisMultiplos.adminCondominio;
        pdfData.imovelValorCondominio = formData.imoveisMultiplos.valorCondominio;
        pdfData.imovelChamadaCapital = formData.imoveisMultiplos.chamadaCapital;
        pdfData.imovelNumParcelas = formData.imoveisMultiplos.numParcelas;
    }

    return pdfData;
}
