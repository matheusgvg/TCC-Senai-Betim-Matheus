/**
 * MAPA - Script do Banco de Talentos (Gestor de RH)
 * 
 * Lógica do painel de controle administrativo. Permite visualizar, pesquisar
 * e gerenciar os resultados dos testes dos funcionários, abrindo um modal de opções
 * para gerar Certificados, Relatórios Detalhados (PI) e o Pack Completo Consolidado.
 */

const API_URL = '../../backend/index.php';

// Estado global do painel
let usuarioGestor = null;
let colaboradoresLista = [];
let mediasEmpresa = {};
let metasEmpresa = {};
let colaboradorSelecionado = null; // Guarda qual funcionário foi clicado

document.addEventListener('DOMContentLoaded', iniciarPainel);

/**
 * Função inicial de carregamento da página
 */
async function iniciarPainel() {
    // 1. Garante que quem está acessando é gestor
    usuarioGestor = obterUsuarioLogado();
    if (!usuarioGestor || usuarioGestor.perfil !== 'gestor') {
        alert('Acesso negado. Por favor, faça login como gestor.');
        window.location.href = '../index.html';
        return;
    }

    document.getElementById('nomeGestor').textContent = `Olá, ${usuarioGestor.nome}`;

    // 2. Associa as ações de clique e busca
    vincularEventos();

    // 3. Busca a lista completa de colaboradores
    await carregarDadosDoBanco();
}

function obterUsuarioLogado() {
    const dados = sessionStorage.getItem('mapa_usuario');
    return dados ? JSON.parse(dados) : null;
}

async function enviarParaServidor(acao, dadosExtras = {}) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ...dadosExtras }),
    });
    return response.json();
}

/**
 * Associa eventos de filtros, logout e fechamento do modal de ações
 */
function vincularEventos() {
    document.getElementById('buscaTexto').addEventListener('input', filtrarTabela);
    document.getElementById('filtroMetalmecanica').addEventListener('change', filtrarTabela);

    // Botão de Logout
    document.getElementById('btnSair').addEventListener('click', () => {
        sessionStorage.removeItem('mapa_usuario');
        window.location.href = '../index.html';
    });

    // Fechar o modal de ações
    document.getElementById('fecharModalAcoes').addEventListener('click', fecharModal);
    document.getElementById('modalAcoes').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharModal();
    });

    // Ações dos 3 botões dentro do modal de colaboradores
    document.getElementById('btnVerCertificado').addEventListener('click', baixarCertificado);
    document.getElementById('btnVerMapa').addEventListener('click', abrirRelatorioOnline);
    document.getElementById('btnBaixarPack').addEventListener('click', baixarPackCompleto);
}

function abrirModal(colab) {
    colaboradorSelecionado = colab;
    document.getElementById('modalColabNome').textContent = colab.nome;
    document.getElementById('modalColabEmail').textContent = colab.email;

    // Se o colaborador não concluiu o quiz, desativa os botões de relatório e certificado
    const inativo = colab.status !== 'Concluído';
    document.getElementById('btnVerCertificado').disabled = inativo;
    document.getElementById('btnVerMapa').disabled = inativo;
    document.getElementById('btnBaixarPack').disabled = inativo;

    document.getElementById('modalAcoes').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modalAcoes').classList.add('hidden');
    colaboradorSelecionado = null;
}

/**
 * Busca todos os dados e métricas do RH no PHP
 */
async function carregarDadosDoBanco() {
    try {
        const resposta = await enviarParaServidor('obter_dados_gestor', {
            gestor_id: usuarioGestor.id
        });

        if (resposta.sucesso) {
            colaboradoresLista = resposta.colaboradores || [];
            mediasEmpresa = resposta.medias || {};
            metasEmpresa = resposta.metas || {};

            atualizarCartoesResumo();
            renderizarTabela(colaboradoresLista);
            desenharGraficoGaps();
            gerarSugestoesCursos();
        } else {
            alert('Erro ao carregar dados: ' + resposta.mensagem);
        }
    } catch (erro) {
        console.error('Erro:', erro);
        alert('Não foi possível se conectar ao servidor.');
    }
}

/**
 * Calcula e preenche as caixas informativas superiores
 */
function atualizarCartoesResumo() {
    const total = colaboradoresLista.length;
    const concluidos = colaboradoresLista.filter(c => c.status === 'Concluído').length;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiConcluidos').textContent = concluidos;

    let maiorGap = 0;
    let competenciaAlerta = 'Nenhuma';

    if (concluidos > 0) {
        const gapTecnico = metasEmpresa.tecnico - mediasEmpresa.tecnico;
        const gapComportamento = metasEmpresa.comportamento - mediasEmpresa.comportamento;
        const gapLideranca = metasEmpresa.lideranca - mediasEmpresa.lideranca;

        if (gapTecnico > maiorGap) {
            maiorGap = gapTecnico;
            competenciaAlerta = 'Hard Skills (Técnico)';
        }
        if (gapComportamento > maiorGap) {
            maiorGap = gapComportamento;
            competenciaAlerta = 'Soft Skills (Comportamento)';
        }
        if (gapLideranca > maiorGap) {
            maiorGap = gapLideranca;
            competenciaAlerta = 'Liderança';
        }
    }

    if (maiorGap > 0.5) {
        document.getElementById('kpiAviso').textContent = competenciaAlerta;
    } else {
        document.getElementById('kpiAviso').textContent = 'Nenhum Alerta';
    }
}

/**
 * Alimenta a tabela de colaboradores e vincula o clique de abertura de modal em cada linha
 */
function renderizarTabela(lista) {
    const tbody = document.getElementById('corpoTabela');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhum funcionário encontrado.</td></tr>';
        return;
    }

    lista.forEach(colab => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer'; // Dá a dica visual para clicar na linha

        let classeStatus = 'nao-iniciado';
        if (colab.status === 'Concluído') classeStatus = 'concluido';
        else if (colab.status === 'Em andamento') classeStatus = 'andamento';

        const notaTecnico = colab.tecnico !== null ? colab.tecnico.toFixed(1) : '-';
        const notaComportamento = colab.comportamento !== null ? colab.comportamento.toFixed(1) : '-';
        const notaLideranca = colab.lideranca !== null ? colab.lideranca.toFixed(1) : '-';

        tr.innerHTML = `
            <td><strong>${colab.nome}</strong></td>
            <td>${colab.email}</td>
            <td><span class="badge-status ${classeStatus}">${colab.status}</span></td>
            <td>${colab.pi_disponivel ? '<span class="badge-status concluido">Sim</span>' : '<span class="badge-status nao-iniciado">Não</span>'}</td>
            <td>${notaTecnico}</td>
            <td>${notaComportamento}</td>
            <td>${notaLideranca}</td>
        `;

        // Ao clicar em qualquer parte da linha, abre as opções do gestor
        tr.addEventListener('click', () => abrirModal(colab));

        tbody.appendChild(tr);
    });
}

function filtrarTabela() {
    const textoBusca = document.getElementById('buscaTexto').value.toLowerCase();
    const filtroMetal = document.getElementById('filtroMetalmecanica').value;

    const listaFiltrada = colaboradoresLista.filter(c => {
        const bateTexto = c.nome.toLowerCase().includes(textoBusca) || c.email.toLowerCase().includes(textoBusca);
        let bateMetal = true;
        if (filtroMetal === 'domina') {
            bateMetal = c.status === 'Concluído' && c.tecnico !== null && c.tecnico >= 7.0;
        } else if (filtroMetal === 'treinar') {
            bateMetal = c.status !== 'Concluído' || c.tecnico === null || c.tecnico < 7.0;
        }
        return bateTexto && bateMetal;
    });

    renderizarTabela(listaFiltrada);
}

function desenharGraficoGaps() {
    const ctx = document.getElementById('graficoGaps').getContext('2d');
    if (window.instanciaGraficoGaps) {
        window.instanciaGraficoGaps.destroy();
    }

    window.instanciaGraficoGaps = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hard Skills (Técnico)', 'Soft Skills (Comportamento)', 'Liderança'],
            datasets: [
                {
                    label: 'Média da Empresa',
                    data: [mediasEmpresa.tecnico, mediasEmpresa.comportamento, mediasEmpresa.lideranca],
                    backgroundColor: '#0056b3',
                    borderWidth: 1
                },
                {
                    label: 'Meta Desejada',
                    data: [metasEmpresa.tecnico, metasEmpresa.comportamento, metasEmpresa.lideranca],
                    backgroundColor: '#e2e8f0',
                    borderColor: '#cbd5e1',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 2 }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            }
        }
    });
}

function gerarSugestoesCursos() {
    const lista = document.getElementById('listaRecomendacoes');
    lista.innerHTML = '';

    const gapTecnico = metasEmpresa.tecnico - mediasEmpresa.tecnico;
    const gapComportamento = metasEmpresa.comportamento - mediasEmpresa.comportamento;
    const gapLideranca = metasEmpresa.lideranca - mediasEmpresa.lideranca;

    let recomendouAlgo = false;

    if (gapTecnico > 0.5) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Treinamento em Metalmecânica recomendado</strong>: Focar em cursos de Desenho Técnico, Caldeiraria, Solda e Metalurgia.`;
        lista.appendChild(li);
        recomendouAlgo = true;
    }
    if (gapComportamento > 0.5) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Treinamento Comportamental recomendado</strong>: Focar em palestras de Comunicação Clara e Trabalho em Equipe.`;
        lista.appendChild(li);
        recomendouAlgo = true;
    }
    if (gapLideranca > 0.5) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Desenvolvimento de Líderes recomendado</strong>: Focar em workshops de Delegação e Gestão de Conflitos no chão de fábrica.`;
        lista.appendChild(li);
        recomendouAlgo = true;
    }

    if (!recomendouAlgo) {
        const li = document.createElement('li');
        li.innerHTML = '<strong>Ótimo desempenho!</strong> Todas as médias da fábrica estão dentro das metas.';
        lista.appendChild(li);
    }
}

// ============================================================================
// LÓGICA DE EXPORTAÇÕES E IMPRESSÃO DE PDF (jsPDF)
// ============================================================================

/**
 * Ação 1: Gera e baixa apenas o Certificado do colaborador em formato Paisagem (A4 deitado)
 */
function baixarCertificado() {
    if (!colaboradorSelecionado) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    desenharCertificadoNaPagina(doc, colaboradorSelecionado);
    doc.save(`Certificado_${colaboradorSelecionado.nome.replace(/\s+/g, '_')}.pdf`);
    fecharModal();
}

/**
 * Ação 2: Abre a página do relatório detalhado em uma nova guia do navegador
 */
function abrirRelatorioOnline() {
    if (!colaboradorSelecionado) return;
    window.open(`mapa_competencias.html?colab_id=${colaboradorSelecionado.id}`, '_blank');
    fecharModal();
}

/**
 * Ação 3: Baixa o Pack Completo (Pág 1: Certificado Deitado / Pág 2: Relatório Em Pé)
 */
async function baixarPackCompleto() {
    if (!colaboradorSelecionado) return;

    try {
        // Busca os dados do relatório detalhado (PI) no PHP
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acao: 'obter_mapa_competencias',
                usuario_id: colaboradorSelecionado.id,
                requisitante_id: usuarioGestor.id
            })
        });

        const resposta = await response.json();

        if (!resposta.sucesso) {
            alert('Não foi possível obter o mapa de competências: ' + resposta.mensagem);
            return;
        }

        const { jsPDF } = window.jspdf;
        // Começa o documento deitado (Paisagem) para o Certificado
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Desenha a Página 1: Certificado (Deitado)
        desenharCertificadoNaPagina(doc, colaboradorSelecionado);

        // Adiciona a Página 2 em pé (Retrato) para o Relatório
        doc.addPage('a4', 'portrait');

        // Desenha a Página 2: Relatório (Retrato)
        desenharRelatorioNaPagina(doc, colaboradorSelecionado.nome, resposta.relatorio);

        // Faz o download do documento final com 2 páginas
        doc.save(`Pack_Completo_${colaboradorSelecionado.nome.replace(/\s+/g, '_')}.pdf`);
        fecharModal();
    } catch (erro) {
        console.error(erro);
        alert('Erro ao gerar o pack completo.');
    }
}

/**
 * Desenha o certificado clássico de perfil na página atual do jsPDF
 */
function desenharCertificadoNaPagina(doc, colab) {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Bordas azul escuro e claro
    doc.setDrawColor(0, 40, 85);
    doc.setLineWidth(2);
    doc.rect(8, 8, w - 16, h - 16);

    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.5);
    doc.rect(10.5, 10.5, w - 21, h - 21);

    // Detalhes nos cantos
    doc.setFillColor(0, 40, 85);
    doc.triangle(8, 8, 25, 8, 8, 25, 'F');
    doc.triangle(w - 8, 8, w - 25, 8, w - 8, 25, 'F');
    doc.triangle(8, h - 8, 25, h - 8, 8, h - 25, 'F');
    doc.triangle(w - 8, h - 8, w - 25, h - 8, w - 8, h - 25, 'F');

    // Cabeçalho e Títulos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 86, 179);
    textCentered(doc, "MAPA - SISTEMA DE MAPEAMENTO DE COMPETÊNCIAS PAREX", 24);

    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.5);
    doc.line(40, 28, w - 40, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(0, 40, 85);
    textCentered(doc, "CERTIFICADO DE PERFIL PROFISSIONAL", 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    textCentered(doc, "Certificamos, para os devidos fins de registro e desenvolvimento, que o colaborador", 54);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 86, 179);
    textCentered(doc, colab.nome.toUpperCase(), 66);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const desc = "concluiu com êxito a avaliação de competências do sistema MAPA da PAREX, demonstrando seu nível de prontidão profissional, comprometimento e adaptabilidade nas dimensões de Hard Skills (Técnico), Soft Skills (Comportamentais) e Liderança, com os resultados consolidados apresentados a seguir:";
    const splitDesc = doc.splitTextToSize(desc, w - 60);
    doc.text(splitDesc, w / 2, 76, { align: 'center' });

    // Caixas com notas
    const boxY = 96;
    const boxW = 60;
    const boxH = 34;
    const gap = 16;
    const startX = (w - (boxW * 3 + gap * 2)) / 2;

    const categorias = [
        { label: 'HARD SKILLS (Técnico)', nota: colab.tecnico, color: [0, 86, 179] },
        { label: 'SOFT SKILLS (Comportamento)', nota: colab.comportamento, color: [15, 118, 110] },
        { label: 'LIDERANÇA', nota: colab.lideranca, color: [180, 83, 9] }
    ];

    categorias.forEach((cat, idx) => {
        const x = startX + idx * (boxW + gap);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, boxY, boxW, boxH, 3, 3, 'F');

        doc.setFillColor(cat.color[0], cat.color[1], cat.color[2]);
        doc.rect(x, boxY, 2, boxH, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(cat.label, x + 5, boxY + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
        doc.text(`${cat.nota !== null ? cat.nota.toFixed(1) : '-'} / 10`, x + 5, boxY + 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("Pontuação consolidada", x + 5, boxY + 29);
    });

    // Resumo Geral
    const resumoY = 142;
    doc.setFillColor(240, 244, 248);
    doc.roundedRect(40, resumoY, w - 80, 16, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 40, 85);
    doc.text('Parecer Comportamental Detalhado', 46, resumoY + 10);
    doc.text('Mapa PI disponível no painel RH', w - 95, resumoY + 10);

    // Rodapé
    const footerY = 175;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    doc.text(`Emitido em: ${dataEmissao}`, 40, footerY + 8);

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(w - 120, footerY, w - 40, footerY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text("Recursos Humanos - PAREX", w - 112, footerY + 6);

    const val = "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + colab.id;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Código Validador: ${val}`, 40, footerY + 16);
}

/**
 * Desenha o mapa de competências detalhado na página atual do jsPDF (deve ser chamada na página 2 orientada em pé)
 */
function desenharRelatorioNaPagina(doc, nomeColaborador, relatorio) {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Moldura retrato
    doc.setDrawColor(0, 40, 85);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, w - 16, h - 16);

    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.4);
    doc.rect(9.5, 9.5, w - 19, h - 19);

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 86, 179);
    doc.text("PAREX S.A. - SISTEMA DE MAPEAMENTO DE COMPETÊNCIAS", 15, 18);
    doc.text("MODELO PREDICTIVE INDEX (PI)", w - 68, 18);

    doc.setDrawColor(220, 225, 230);
    doc.line(15, 21, w - 15, 21);

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 40, 85);
    doc.text("MAPA DE COMPETÊNCIAS DETALHADO", 15, 30);

    // Caixa informativa
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, 35, w - 30, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Colaborador:", 19, 41);
    doc.text("Metodologia de Análise:", 19, 46);
    doc.text("Data do Diagnóstico:", 19, 51);

    doc.setFont('helvetica', 'normal');
    doc.text(nomeColaborador.toUpperCase(), 43, 41);
    doc.text("Classificação por limiares (Baixo, Médio, Alto) dos eixos comportamentais", 58, 46);
    const dataBr = new Date(relatorio.data).toLocaleString('pt-BR');
    doc.text(dataBr, 52, 51);

    // Renderiza cada um dos 4 eixos
    let currentY = 66;
    const eixos = relatorio.eixos;
    const chaves = ['A', 'B', 'C', 'D'];

    chaves.forEach(chave => {
        const eixo = eixos[chave];
        let corEixo = [0, 40, 85];
        if (chave === 'B') corEixo = [0, 86, 179];
        else if (chave === 'C') corEixo = [15, 118, 110];
        else if (chave === 'D') corEixo = [180, 83, 9];

        doc.setFillColor(252, 252, 253);
        doc.roundedRect(15, currentY, w - 30, 42, 2, 2, 'F');

        doc.setFillColor(corEixo[0], corEixo[1], corEixo[2]);
        doc.rect(15, currentY, 1.5, 42, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(corEixo[0], corEixo[1], corEixo[2]);
        doc.text(`${eixo.nome} (Eixo ${chave})`, 20, currentY + 8);
        
        doc.setFontSize(9.5);
        doc.text(`Nível: ${eixo.nivel} (${eixo.score.toFixed(1)} / 5.0)`, w - 65, currentY + 8);

        doc.setDrawColor(235, 240, 245);
        doc.line(20, currentY + 12, w - 20, currentY + 12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text("Pontos Fortes:", 20, currentY + 18);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const splitForte = doc.splitTextToSize(eixo.forte, w - 45);
        doc.text(splitForte, 20, currentY + 22);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text("Sugestões de Desenvolvimento:", 20, currentY + 31);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const splitMelhoria = doc.splitTextToSize(eixo.melhoria, w - 45);
        doc.text(splitMelhoria, 20, currentY + 35);

        currentY += 47;
    });

    // Rodapé
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text("Pack Completo de Talentos - Uso restrito da PAREX S.A.", 15, h - 14);
}

function textCentered(doc, text, y) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
}
