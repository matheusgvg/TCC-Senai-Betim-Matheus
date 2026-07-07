/**
 * MAPA - Quiz Vocacional
 *
 * Este arquivo controla a interface do quiz, o salvamento de progresso e o envio
 * das respostas ao backend. Ele também exibe os resultados finais, gera gráficos
 * e permite baixar um certificado em PDF.
 */

// Endpoint do backend para todas as chamadas do quiz
const API_URL = '../../backend/index.php';

// Perguntas do quiz (mantenha alinhado com backend/perguntas_quiz.php)
const PERGUNTAS = [
    // --- QUESTÕES TÉCNICAS (HARD SKILLS) ---
    { id: 't1', categoria: 'tecnico', eixo: 'C', texto: 'Sei interpretar desenhos técnicos e projetos de caldeiraria.' },
    { id: 't2', categoria: 'tecnico', eixo: 'A', texto: 'Domino ferramentas de corte, solda ou usinagem conforme minha função.' },
    { id: 't3', categoria: 'tecnico', eixo: 'D', texto: 'Consigo identificar falhas em equipamentos e peças metalúrgicas.' },
    { id: 't4', categoria: 'tecnico', eixo: 'D', texto: 'Conheço normas de segurança e qualidade aplicadas no chão de fábrica.' },

    // --- QUESTÕES COMPORTAMENTAIS (SOFT SKILLS) ---
    { id: 'c1', categoria: 'comportamento', eixo: 'B', texto: 'Trabalho bem em equipe mesmo quando o prazo está apertado.' },
    { id: 'c2', categoria: 'comportamento', eixo: 'B', texto: 'Comunico problemas e dificuldades de forma clara com colegas e supervisores.' },
    { id: 'c3', categoria: 'comportamento', eixo: 'C', texto: 'Respeito horários, procedimentos e orientações da liderança.' },
    { id: 'c4', categoria: 'comportamento', eixo: 'C', texto: 'Aceito feedback e busco melhorar meu desempenho continuamente.' },

    // --- QUESTÕES DE LIDERANÇA ---
    { id: 'l1', categoria: 'lideranca', eixo: 'A', texto: 'Assumo responsabilidade quando algo dá errado no meu setor.' },
    { id: 'l2', categoria: 'lideranca', eixo: 'B', texto: 'Ajudo colegas novos a entender o trabalho e os processos.' },
    { id: 'l3', categoria: 'lideranca', eixo: 'A', texto: 'Proponho melhorias quando identifico oportunidades no processo.' },
    { id: 'l4', categoria: 'lideranca', eixo: 'D', texto: 'Consigo organizar tarefas da equipe quando sou solicitado.' },
];

const LABELS_CATEGORIA = {
    tecnico: { nome: 'Hard Skills', classe: '' },
    comportamento: { nome: 'Soft Skills', classe: 'soft' },
    lideranca: { nome: 'Liderança', classe: 'lideranca' },
};

const ESCALA = [
    { valor: 1, texto: '1 - Discordo totalmente' },
    { valor: 2, texto: '2 - Discordo' },
    { valor: 3, texto: '3 - Neutro' },
    { valor: 4, texto: '4 - Concordo' },
    { valor: 5, texto: '5 - Concordo totalmente' },
];

// Estado do quiz na memória do navegador
let usuario = null;           // dados do usuário logado
let indiceAtual = 0;          // índice da pergunta atual exibida
let respostas = {};           // respostas dadas pelo usuário
let salvando = false;         // flag para evitar salvamentos concorrentes
let notasAtuais = null;       // resultado final usado para download de certificado

document.addEventListener('DOMContentLoaded', iniciarQuiz);

/**
 * Inicializa o quiz assim que a página estiver pronta.
 * Valida o usuário logado, vincula eventos aos botões e restaura o progresso.
 */
async function iniciarQuiz() {
    usuario = obterUsuarioLogado();

    if (!usuario || !['colaborador', 'gestor'].includes(usuario.perfil)) {
        alert('Faça login como colaborador ou gestor para acessar o quiz.');
        window.location.href = '../index.html';
        return;
    }

    document.getElementById('nomeUsuario').textContent = `Olá, ${usuario.nome}`;

    vincularEventos();
    await carregarProgressoSalvo();
    renderizarPergunta();
}

/**
 * Recupera os dados do usuário armazenados na sessão do navegador.
 * Retorna null quando não houver usuário logado.
 */
function obterUsuarioLogado() {
    const dados = sessionStorage.getItem('mapa_usuario');
    return dados ? JSON.parse(dados) : null;
}

/**
 * Associa os botões da interface às funções de navegação, salvamento e saída.
 */
function vincularEventos() {
    document.getElementById('btnAnterior').addEventListener('click', () => mudarPergunta(-1));
    document.getElementById('btnProximo').addEventListener('click', () => mudarPergunta(1));
    document.getElementById('btnSalvar').addEventListener('click', () => salvarProgresso(true));
    document.getElementById('btnTerminar').addEventListener('click', finalizarQuiz);
    document.getElementById('btnSair').addEventListener('click', sairDoQuiz);
    document.getElementById('btnVoltarLogin').addEventListener('click', () => {
        sessionStorage.removeItem('mapa_usuario');
        window.location.href = '../index.html';
    });
    document.getElementById('btnDownloadCertificado').addEventListener('click', () => {
        if (notasAtuais) {
            gerarCertificadoPDF(notasAtuais);
        } else {
            mostrarToast('Não há resultados disponíveis para download.');
        }
    });

    document.getElementById('btnVerMapaCompetencias').addEventListener('click', () => {
        if (usuario) {
            window.open(`../dashboard/mapa_competencias.html?colab_id=${usuario.id}`, '_blank');
        }
    });
}

/**
 * Tenta restaurar o progresso salvo no backend. Se não for possível, usa backup local.
 */
async function carregarProgressoSalvo() {
    try {
        const resultado = await enviarParaServidor('carregar_quiz', {
            usuario_id: usuario.id,
        });

        if (!resultado.sucesso) {
            mostrarToast(resultado.mensagem || 'Não foi possível carregar o progresso.');
            return;
        }

        if (resultado.notas && resultado.progresso?.concluido) {
            mostrarTelaConcluida(resultado.notas, 'Você já concluiu este quiz.');
            return;
        }

        if (resultado.progresso && !resultado.progresso.concluido) {
            respostas = resultado.progresso.respostas || {};
            indiceAtual = resultado.progresso.indice_atual || 0;
            mostrarToast('Progresso recuperado. Continue de onde parou.');
        }
    } catch (erro) {
        console.error(erro);
        carregarBackupLocal();
    }
}

/**
 * Restaura o progresso usando um backup local quando o backend não está disponível.
 */
function carregarBackupLocal() {
    const backup = localStorage.getItem(chaveBackup());
    if (!backup) return;

    const dados = JSON.parse(backup);
    respostas = dados.respostas || {};
    indiceAtual = dados.indice_atual || 0;
    mostrarToast('Usamos um backup local salvo no seu navegador.');
}

/**
 * Retorna a chave única usada para guardar o backup local do quiz.
 */
function chaveBackup() {
    return `mapa_quiz_${usuario.id}`;
}

/**
 * Salva o progresso atual do quiz no localStorage para recuperação futura.
 */
function salvarBackupLocal() {
    localStorage.setItem(chaveBackup(), JSON.stringify({
        respostas,
        indice_atual: indiceAtual,
    }));
}

/**
 * Mostra a pergunta atual na tela, junto com a barra de progresso e as opções de resposta.
 */
function renderizarPergunta() {
    const pergunta = PERGUNTAS[indiceAtual];
    const categoria = LABELS_CATEGORIA[pergunta.categoria];

    document.getElementById('badgeCategoria').textContent = categoria.nome;
    document.getElementById('badgeCategoria').className = `badge-categoria ${categoria.classe}`;
    document.getElementById('textoPergunta').textContent = pergunta.texto;
    document.getElementById('textoProgresso').textContent =
        `Pergunta ${indiceAtual + 1} de ${PERGUNTAS.length}`;

    const percentual = ((indiceAtual + 1) / PERGUNTAS.length) * 100;
    document.getElementById('barraPreenchida').style.width = `${percentual}%`;

    const container = document.getElementById('opcoesResposta');
    container.innerHTML = '';

    ESCALA.forEach((opcao) => {
        const label = document.createElement('label');
        label.className = 'opcao-resposta';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `pergunta_${pergunta.id}`;
        input.value = opcao.valor;

        if (Number(respostas[pergunta.id]) === opcao.valor) {
            input.checked = true;
            label.classList.add('selecionada');
        }

        input.addEventListener('change', () => {
            respostas[pergunta.id] = opcao.valor;
            salvarBackupLocal();
            container.querySelectorAll('.opcao-resposta').forEach((el) => el.classList.remove('selecionada'));
            label.classList.add('selecionada');
            atualizarBotoes();
        });

        const texto = document.createElement('span');
        texto.textContent = opcao.texto;

        label.appendChild(input);
        label.appendChild(texto);
        container.appendChild(label);
    });

    atualizarBotoes();
}

function perguntaAtualRespondida() {
    const id = PERGUNTAS[indiceAtual].id;
    return respostas[id] >= 1 && respostas[id] <= 5;
}

function todasRespondidas() {
    return PERGUNTAS.every((pergunta) => respostas[pergunta.id] >= 1 && respostas[pergunta.id] <= 5);
}

function atualizarBotoes() {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');
    const btnTerminar = document.getElementById('btnTerminar');

    btnAnterior.disabled = indiceAtual === 0;
    btnProximo.disabled = !perguntaAtualRespondida();

    const ultimaPergunta = indiceAtual === PERGUNTAS.length - 1;
    btnProximo.classList.toggle('hidden', ultimaPergunta);
    btnTerminar.classList.toggle('hidden', !ultimaPergunta);
    btnTerminar.disabled = !todasRespondidas();
}

function mudarPergunta(direcao) {
    if (direcao > 0 && !perguntaAtualRespondida()) {
        mostrarToast('Selecione uma resposta antes de continuar.');
        return;
    }

    const novoIndice = indiceAtual + direcao;
    if (novoIndice < 0 || novoIndice >= PERGUNTAS.length) return;

    indiceAtual = novoIndice;
    salvarBackupLocal();
    renderizarPergunta();
}

/**
 * Envia o progresso atual ao backend para persistência. Exibe mensagem opcional.
 */
async function salvarProgresso(mostrarMensagem = false) {
    if (salvando) return;
    salvando = true;

    document.getElementById('btnSalvar').disabled = true;

    try {
        const resultado = await enviarParaServidor('salvar_quiz', {
            usuario_id: usuario.id,
            respostas,
            indice_atual: indiceAtual,
        });

        if (resultado.sucesso) {
            salvarBackupLocal();
            if (mostrarMensagem) {
                mostrarToast('Progresso salvo! Você pode fechar e continuar depois.');
            }
        } else {
            mostrarToast(resultado.mensagem || 'Erro ao salvar.');
        }
    } catch (erro) {
        console.error(erro);
        salvarBackupLocal();
        mostrarToast('Servidor indisponível. Salvo localmente no navegador.');
    } finally {
        salvando = false;
        document.getElementById('btnSalvar').disabled = false;
    }
}

/**
 * Finaliza o quiz, envia as respostas ao backend e exibe a tela de conclusão.
 */
async function finalizarQuiz() {
    if (!todasRespondidas()) {
        mostrarToast('Responda todas as perguntas antes de terminar.');
        return;
    }

    const confirmar = confirm('Deseja enviar o quiz e finalizar o mapeamento?');
    if (!confirmar) return;

    document.getElementById('btnTerminar').disabled = true;

    try {
        const resultado = await enviarParaServidor('finalizar_quiz', {
            usuario_id: usuario.id,
            respostas,
        });

        if (!resultado.sucesso) {
            mostrarToast(resultado.mensagem || 'Erro ao finalizar.');
            document.getElementById('btnTerminar').disabled = false;
            return;
        }

        localStorage.removeItem(chaveBackup());
        mostrarTelaConcluida(resultado.notas, resultado.mensagem);
    } catch (erro) {
        console.error(erro);
        mostrarToast('Não foi possível enviar ao servidor. Tente novamente.');
        document.getElementById('btnTerminar').disabled = false;
    }
}

function mostrarTelaConcluida(notas, mensagem) {
    notasAtuais = notas;
    document.getElementById('areaQuiz').classList.add('hidden');
    document.getElementById('areaConcluido').classList.remove('hidden');
    document.getElementById('mensagemConcluido').textContent = mensagem;

    const resumo = document.getElementById('resumoNotas');
    resumo.innerHTML = `
        <div class="nota-card destaque-perfil">
            <strong>Mapa PI</strong>
            <span>Relatório comportamental</span>
        </div>
        <div class="nota-card destaque-indice">
            <strong>4 eixos</strong>
            <span>Dominância, Extroversão, Paciência e Formalidade</span>
        </div>
        <div class="nota-card">
            <strong>${notas.tecnico}</strong>
            <span>Hard Skills (Técnico)</span>
        </div>
        <div class="nota-card">
            <strong>${notas.comportamento}</strong>
            <span>Soft Skills (Comportamento)</span>
        </div>
        <div class="nota-card">
            <strong>${notas.lideranca}</strong>
            <span>Liderança</span>
        </div>
    `;

    // Desenha o gráfico de radar na tela
    renderizarGraficoRadar(notas);
}

/**
 * Salva localmente antes de sair, se o quiz tiver progresso parcial.
 */
async function sairDoQuiz() {
    if (Object.keys(respostas).length > 0) {
        await salvarProgresso(false);
    }
    window.location.href = usuario.perfil === 'gestor'
        ? '../modulo_gestor/opcoes.html'
        : '../index.html';
}

/**
 * Envia requisições ao backend para salvar, carregar ou finalizar o quiz.
 */
async function enviarParaServidor(acao, dadosExtras = {}) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ...dadosExtras }),
    });

    return response.json();
}

/**
 * Exibe uma notificação temporária no canto da aplicação.
 */
function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.remove('hidden');

    clearTimeout(mostrarToast.timeoutId);
    mostrarToast.timeoutId = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}

/**
 * Cria o gráfico visual de teia de aranha (Radar) com as notas do colaborador.
 * Explicação: Pega os valores de Técnico, Comportamento e Liderança, e os distribui 
 * em um gráfico circular de 3 pontas (escala de 0 a 10) usando a biblioteca Chart.js.
 */
function renderizarGraficoRadar(notas) {
    const ctx = document.getElementById('graficoRadar').getContext('2d');
    
    // Evita duplicidade destruindo o gráfico anterior se ele existir
    if (window.instanciaGraficoRadar) {
        window.instanciaGraficoRadar.destroy();
    }
    
    window.instanciaGraficoRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Hard Skills (Técnico)', 'Soft Skills (Comportamento)', 'Liderança'],
            datasets: [{
                label: 'Sua Pontuação',
                data: [
                    parseFloat(notas.tecnico),
                    parseFloat(notas.comportamento),
                    parseFloat(notas.lideranca)
                ],
                backgroundColor: 'rgba(0, 86, 179, 0.15)', 
                borderColor: '#0056b3', 
                borderWidth: 3,
                pointBackgroundColor: '#002855', 
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#002855',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: '#e5e7eb'
                    },
                    grid: {
                        color: '#e5e7eb'
                    },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: {
                        stepSize: 2,
                        backdropColor: 'transparent',
                        color: '#666',
                        font: { size: 10 }
                    },
                    pointLabels: {
                        color: '#333',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} / 10`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Cria e baixa o Certificado de Perfil Profissional em formato PDF (deitado/A4).
 * Explicação: Usa a biblioteca jsPDF para desenhar uma moldura com as cores da empresa,
 * escrever os dados do funcionário centralizados e posicionar 3 caixas coloridas com as notas obtidas.
 */
function gerarCertificadoPDF(notas) {
    if (!usuario) return;
    
    const { jsPDF } = window.jspdf;
    
    // Inicializa a folha deitada (A4)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    const w = doc.internal.pageSize.getWidth(); // 297 mm
    const h = doc.internal.pageSize.getHeight(); // 210 mm
    
    // 1. Moldura externa e interna chique nas cores corporativas (azul escuro e azul claro)
    doc.setDrawColor(0, 40, 85);
    doc.setLineWidth(2);
    doc.rect(8, 8, w - 16, h - 16);
    
    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.5);
    doc.rect(10.5, 10.5, w - 21, h - 21);

    // Detalhe decorativo triangular nos cantos da folha
    doc.setFillColor(0, 40, 85);
    doc.triangle(8, 8, 25, 8, 8, 25, 'F');
    doc.triangle(w - 8, 8, w - 25, 8, w - 8, 25, 'F');
    doc.triangle(8, h - 8, 25, h - 8, 8, h - 25, 'F');
    doc.triangle(w - 8, h - 8, w - 25, h - 8, w - 8, h - 25, 'F');

    // Círculo decorativo central como marca d'água de fundo
    doc.setDrawColor(240, 244, 248);
    doc.setLineWidth(0.2);
    doc.circle(w / 2, h / 2, 60, 'S');

    // 2. Cabeçalho e Título Principal
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
    
    // Nome do Colaborador em destaque
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 86, 179);
    textCentered(doc, usuario.nome.toUpperCase(), 66);
    
    // Texto descritivo adaptado às margens da folha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const textoDescritivo = "concluiu com êxito a avaliação de competências do sistema MAPA da PAREX, demonstrando seu nível de prontidão profissional, comprometimento e adaptabilidade nas dimensões de Hard Skills (Técnico), Soft Skills (Comportamentais) e Liderança, com os resultados consolidados apresentados a seguir:";
    const splitTexto = doc.splitTextToSize(textoDescritivo, w - 60);
    doc.text(splitTexto, w / 2, 76, { align: 'center' });
    
    // 3. Caixas de Notas (Técnico, Comportamento e Liderança)
    const boxY = 96;
    const boxW = 60;
    const boxH = 34;
    const gap = 16;
    const startX = (w - (boxW * 3 + gap * 2)) / 2;
    
    const categorias = [
        { label: 'HARD SKILLS (Técnico)', nota: notas.tecnico, color: [0, 86, 179] },
        { label: 'SOFT SKILLS (Comportamento)', nota: notas.comportamento, color: [15, 118, 110] },
        { label: 'LIDERANÇA', nota: notas.lideranca, color: [180, 83, 9] }
    ];
    
    categorias.forEach((cat, idx) => {
        const x = startX + idx * (boxW + gap);
        
        // Fundo e borda de cor lateral de cada caixinha
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
        doc.text(`${cat.nota} / 10`, x + 5, boxY + 22);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("Pontuação consolidada", x + 5, boxY + 29);
    });
    
    // 4. Faixa inferior com o Perfil Dominante e Índice
    const resumoY = 142;
    doc.setFillColor(240, 244, 248);
    doc.roundedRect(40, resumoY, w - 80, 16, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 40, 85);
    doc.text('Relatório PI concluído: 4 eixos comportamentais', 46, resumoY + 10);
    doc.text('Dominância, Extroversão, Paciência e Formalidade', w - 132, resumoY + 10);

    // 5. Rodapé (Data, Assinatura simulada e Código de validação)
    const footerY = 175;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    doc.text(`Emitido em: ${dataEmissao}`, 40, footerY + 8);
    
    const codigoValidade = "REF-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + usuario.id;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Código de Validação: ${codigoValidade}`, 40, footerY + 16);
    
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(w - 120, footerY, w - 40, footerY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text("Recursos Humanos - PAREX", w - 112, footerY + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Assinatura do Departamento", w - 106, footerY + 11);
    
    // Dispara o download automático do PDF
    doc.save(`Relatorio_PI_${usuario.nome.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Função utilitária para centralizar textos no PDF de forma simplificada
 */
function textCentered(doc, text, y) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
}
