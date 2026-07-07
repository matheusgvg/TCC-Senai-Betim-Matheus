/**
 * MAPA - Mapa de Competências (PI)
 * Carrega o diagnóstico comportamental e gera o PDF do relatório.
 */

// Endpoint do backend
const API_URL = '../../backend/index.php';

let usuarioLogado = null;
let colabId = null;
let relatorioDados = null;
let colabNome = '';

document.addEventListener('DOMContentLoaded', iniciarPagina);

/**
 * Função executada ao carregar a página
 */
async function iniciarPagina() {
    // 1. Verifica login
    usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado) {
        alert('Faça login para ver o relatório.');
        window.location.href = '../index.html';
        return;
    }

    // Gestor pode visualizar outro colaborador via ?colab_id= na URL
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('colab_id');
    colabId = idParam ? parseInt(idParam, 10) : usuarioLogado.id;

    // Colaborador só pode ver o próprio relatório
    if (usuarioLogado.perfil === 'colaborador' && colabId !== usuarioLogado.id) {
        alert('Acesso não autorizado.');
        window.location.href = 'dashboard.html';
        return;
    }

    // Configura botões e ações
    vincularEventos();

    // 3. Busca os dados do relatório no PHP
    await carregarMapaCompetencias();
}

/**
 * Pega os dados do usuário salvos no navegador
 */
function obterUsuarioLogado() {
    const dados = sessionStorage.getItem('mapa_usuario');
    return dados ? JSON.parse(dados) : null;
}

/**
 * Vincula as ações dos botões
 */
function vincularEventos() {
    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Botão de download do PDF
    document.getElementById('btnDownloadMapa').addEventListener('click', baixarPDF);

    // Botão Sair
    document.getElementById('btnSair').addEventListener('click', () => {
        sessionStorage.removeItem('mapa_usuario');
        window.location.href = '../index.html';
    });
}

/**
 * Faz a chamada fetch ao PHP para pegar o diagnóstico do PI
 */
async function carregarMapaCompetencias() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acao: 'obter_mapa_competencias',
                usuario_id: colabId,
                requisitante_id: usuarioLogado.id
            })
        });

        const resposta = await response.json();

        if (resposta.sucesso) {
            relatorioDados = resposta.relatorio;
            colabNome = resposta.usuario.nome;

            // Altera o título de saudação na tela
            document.getElementById('nomeColaborador').textContent = `Colaborador: ${colabNome}`;
            
            // Desenha os 4 cards dos eixos do PI
            desenharCardsEixos();
        } else {
            document.getElementById('gridEixos').innerHTML = `
                <div class="mapa-erro">
                    <strong>Atenção:</strong> ${resposta.mensagem}
                </div>
            `;
            document.getElementById('btnDownloadMapa').disabled = true;
        }
    } catch (erro) {
        console.error('Erro:', erro);
        alert('Não foi possível obter os dados do relatório.');
    }
}

/**
 * Renderiza os cards do PI na tela com níveis e textos
 */
function desenharCardsEixos() {
    const grid = document.getElementById('gridEixos');
    grid.innerHTML = ''; // Limpa

    const eixos = relatorioDados.eixos;
    const chaves = ['A', 'B', 'C', 'D'];

    chaves.forEach(chave => {
        const eixo = eixos[chave];
        const card = document.createElement('div');
        
        // Define a classe CSS correta do nível para a cor do badge
        let classeNivel = 'nivel-medio';
        if (eixo.nivel === 'Alto') classeNivel = 'nivel-alto';
        else if (eixo.nivel === 'Baixo') classeNivel = 'nivel-baixo';

        card.className = `eixo-card ${chave}`;
        card.innerHTML = `
            <div class="eixo-header">
                <span class="eixo-nome">${eixo.nome} (Eixo ${chave})</span>
                <span class="eixo-nota">${eixo.score.toFixed(1)} / 5.0</span>
            </div>
            <span class="eixo-nivel ${classeNivel}">Nível ${eixo.nivel}</span>
            
            <div class="info-bloco">
                <strong>Pontos Fortes:</strong>
                <p>${eixo.forte}</p>
            </div>
            
            <div class="info-bloco">
                <strong>Pontos de Melhoria (Treinamentos sugeridos):</strong>
                <p>${eixo.melhoria}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Gera e baixa o PDF do Mapa de Competências usando jsPDF
 */
function baixarPDF() {
    if (!relatorioDados) return;

    const { jsPDF } = window.jspdf;
    
    // Cria uma folha A4 em modo retrato (portrait)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const w = doc.internal.pageSize.getWidth(); // 210 mm
    const h = doc.internal.pageSize.getHeight(); // 297 mm

    // 1. Molduras decorativas na folha em Azul Industrial
    doc.setDrawColor(0, 40, 85);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, w - 16, h - 16);

    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.4);
    doc.rect(9.5, 9.5, w - 19, h - 19);

    // 2. Cabeçalho do Relatório
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 86, 179);
    doc.text("PAREX S.A. - SISTEMA DE MAPEAMENTO DE COMPETÊNCIAS", 15, 18);
    doc.text("MODELO PREDICTIVE INDEX (PI)", w - 68, 18);

    doc.setDrawColor(220, 225, 230);
    doc.line(15, 21, w - 15, 21);

    // 3. Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 40, 85);
    doc.text("MAPA DE COMPETÊNCIAS INDIVIDUAL", 15, 30);

    // 4. Caixa de Informações Básicas
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, 35, w - 30, 22, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Colaborador:", 19, 41);
    doc.text("Metodologia:", 19, 46);
    doc.text("Data de Processamento:", 19, 51);

    doc.setFont('helvetica', 'normal');
    doc.text(colabNome.toUpperCase(), 43, 41);
    doc.text("Comportamental baseada em limiares (A, B, C, D do PI)", 43, 46);
    // Formata a data de registro
    const dataBr = new Date(relatorioDados.data).toLocaleString('pt-BR');
    doc.text(dataBr, 58, 51);

    // 5. Exibição dos 4 eixos
    let currentY = 66;
    const eixos = relatorioDados.eixos;
    const chaves = ['A', 'B', 'C', 'D'];

    chaves.forEach(chave => {
        const eixo = eixos[chave];
        
        // Define as cores do título do eixo
        let corEixo = [0, 40, 85]; // A
        if (chave === 'B') corEixo = [0, 86, 179];
        else if (chave === 'C') corEixo = [15, 118, 110];
        else if (chave === 'D') corEixo = [180, 83, 9];

        // Caixa de fundo suave para o eixo
        doc.setFillColor(252, 252, 253);
        doc.roundedRect(15, currentY, w - 30, 42, 2, 2, 'F');
        
        // Borda de cor vertical no lado esquerdo da caixinha
        doc.setFillColor(corEixo[0], corEixo[1], corEixo[2]);
        doc.rect(15, currentY, 1.5, 42, 'F');

        // Título do Eixo e Pontuação
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(corEixo[0], corEixo[1], corEixo[2]);
        doc.text(`${eixo.nome} (Eixo ${chave})`, 20, currentY + 8);
        
        doc.setFontSize(10);
        doc.text(`Nível: ${eixo.nivel} (${eixo.score.toFixed(1)} / 5.0)`, w - 65, currentY + 8);

        // Linha interna divisória da caixinha
        doc.setDrawColor(235, 240, 245);
        doc.line(20, currentY + 12, w - 20, currentY + 12);

        // Pontos Fortes
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text("Pontos Fortes:", 20, currentY + 18);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const splitForte = doc.splitTextToSize(eixo.forte, w - 45);
        doc.text(splitForte, 20, currentY + 22);

        // Pontos de Melhoria
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        // Calcula o offset de altura dinamicamente para o ponto de melhoria não bater com o ponto forte
        doc.text("Sugestões de Desenvolvimento:", 20, currentY + 31);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const splitMelhoria = doc.splitTextToSize(eixo.melhoria, w - 45);
        doc.text(splitMelhoria, 20, currentY + 35);

        // Próximo eixo desce 47mm
        currentY += 47;
    });

    // 6. Rodapé do Relatório
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text("Relatório individual de caráter consultivo. Uso restrito da PAREX S.A. e do colaborador.", 15, h - 14);
    
    const codValidade = "MAPA-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + colabId;
    doc.text(`Autenticação: ${codValidade}`, w - 70, h - 14);

    // Faz o download do PDF
    doc.save(`Mapa_Competencias_${colabNome.replace(/\s+/g, '_')}.pdf`);
}
