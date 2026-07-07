/**
 * MAPA - Painel do Gestor de RH (Estilo Simples/Iniciante)
 * Este arquivo faz a comunicação com o PHP para listar os funcionários,
 * filtrar quem entende de metalmecânica e criar o gráfico de gaps.
 */

// Caminho para o nosso roteador backend
const API_URL = '../../backend/index.php';

// Variáveis na memória do navegador para guardar o estado
let usuarioGestor = null;
let colaboradoresLista = [];
let mediasEmpresa = {};
let metasEmpresa = {};

// Quando o navegador terminar de carregar o HTML, executa a função iniciar
document.addEventListener('DOMContentLoaded', iniciarPainel);

/**
 * Função inicial: Valida o acesso do gestor e carrega os dados
 */
async function iniciarPainel() {
    // 1. Verifica se o gestor está logado
    usuarioGestor = obterUsuarioLogado();
    if (!usuarioGestor || usuarioGestor.perfil !== 'gestor') {
        alert('Acesso negado. Por favor, faça login como gestor.');
        window.location.href = '../index.html';
        return;
    }

    // Exibe o nome do gestor logado no topo
    document.getElementById('nomeGestor').textContent = `Olá, ${usuarioGestor.nome}`;

    // 2. Vincula os eventos dos filtros de pesquisa e logout
    vincularEventosFiltros();

    // 3. Busca a lista de colaboradores e dados das médias no banco
    await carregarDadosDoBanco();
}

/**
 * Pega os dados do gestor salvos na sessão do navegador
 */
function obterUsuarioLogado() {
    const dados = sessionStorage.getItem('mapa_usuario');
    return dados ? JSON.parse(dados) : null;
}

/**
 * Envia uma requisição POST simples para o backend
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
 * Adiciona escutadores para quando o gestor pesquisar ou selecionar filtros
 */
function vincularEventosFiltros() {
    // Campo de pesquisa por texto
    document.getElementById('buscaTexto').addEventListener('input', filtrarTabela);
    // Dropdown de seleção de metalmecânica
    document.getElementById('filtroMetalmecanica').addEventListener('change', filtrarTabela);

    // Botão de sair (Logout)
    document.getElementById('btnSair').addEventListener('click', () => {
        sessionStorage.removeItem('mapa_usuario');
        window.location.href = '../index.html';
    });
}

/**
 * Carrega a lista completa de dados do PHP
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

            // Atualiza os cartões informativos (KPIs)
            atualizarCartoesResumo();
            // Desenha a tabela com a lista completa
            renderizarTabela(colaboradoresLista);
            // Desenha o gráfico de barras dos Gaps
            desenharGraficoGaps();
            // Gera as sugestões de cursos baseadas nas lacunas
            gerarSugestoesCursos();
        } else {
            alert('Erro ao carregar dados: ' + resposta.mensagem);
        }
    } catch (erro) {
        console.error('Erro ao conectar ao servidor:', erro);
        alert('Não foi possível se conectar ao servidor.');
    }
}

/**
 * Preenche os números dos cartões informativos no topo da tela
 */
function atualizarCartoesResumo() {
    const total = colaboradoresLista.length;
    // Filtra quantos estão com status Concluído
    const concluidos = colaboradoresLista.filter(c => c.status === 'Concluído').length;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiConcluidos').textContent = concluidos;

    // Descobre o maior Gap para colocar no cartão de aviso principal
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

    // Se houver alguma lacuna grande (gap > 0.5), coloca no aviso
    if (maiorGap > 0.5) {
        document.getElementById('kpiAviso').textContent = competenciaAlerta;
    } else {
        document.getElementById('kpiAviso').textContent = 'Nenhum Alerta';
    }
}

/**
 * Desenha as linhas da tabela de colaboradores conforme o filtro
 */
function renderizarTabela(lista) {
    const tbody = document.getElementById('corpoTabela');
    tbody.innerHTML = ''; // Limpa a tabela

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhum funcionário encontrado com estes filtros.</td></tr>';
        return;
    }

    lista.forEach(colab => {
        const tr = document.createElement('tr');

        // Define a classe de cor da tag de status (concluido, andamento, nao-iniciado)
        let classeStatus = 'nao-iniciado';
        if (colab.status === 'Concluído') classeStatus = 'concluido';
        else if (colab.status === 'Em andamento') classeStatus = 'andamento';

        // Formata os valores nulos para ficarem mais limpos na visualização
        const notaTecnico = colab.tecnico !== null ? colab.tecnico.toFixed(1) : '-';
        const notaComportamento = colab.comportamento !== null ? colab.comportamento.toFixed(1) : '-';
        const notaLideranca = colab.lideranca !== null ? colab.lideranca.toFixed(1) : '-';

        tr.innerHTML = `
            <td><strong>${colab.nome}</strong></td>
            <td>${colab.email}</td>
            <td><span class="badge-status ${classeStatus}">${colab.status}</span></td>
            <td>${notaTecnico}</td>
            <td>${notaComportamento}</td>
            <td>${notaLideranca}</td>
            <td><em>${colab.perfil}</em></td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Filtra a tabela localmente baseada no que foi digitado ou selecionado nos filtros
 */
function filtrarTabela() {
    const textoBusca = document.getElementById('buscaTexto').value.toLowerCase();
    const filtroMetal = document.getElementById('filtroMetalmecanica').value;

    // Filtra a lista completa em memória
    const listaFiltrada = colaboradoresLista.filter(c => {
        // 1. Filtro de pesquisa de texto (Nome ou Email)
        const bateTexto = c.nome.toLowerCase().includes(textoBusca) || c.email.toLowerCase().includes(textoBusca);

        // 2. Filtro de Metalmecânica (Hard Skills / Técnico >= 7)
        let bateMetal = true;
        if (filtroMetal === 'domina') {
            // Só quem concluiu o teste e tirou nota técnica maior ou igual a 7
            bateMetal = c.status === 'Concluído' && c.tecnico !== null && c.tecnico >= 7.0;
        } else if (filtroMetal === 'treinar') {
            // Quem não terminou o teste OU tirou nota técnica menor que 7
            bateMetal = c.status !== 'Concluído' || c.tecnico === null || c.tecnico < 7.0;
        }

        return bateTexto && bateMetal;
    });

    // Atualiza a visualização da tabela
    renderizarTabela(listaFiltrada);
}

/**
 * Desenha o gráfico de barras simples comparando médias e metas (Gaps)
 */
function desenharGraficoGaps() {
    const ctx = document.getElementById('graficoGaps').getContext('2d');

    // Se já houver um gráfico desenhado anteriormente, destrói para evitar bugs
    if (window.instanciaGraficoGaps) {
        window.instanciaGraficoGaps.destroy();
    }

    // Inicializa o gráfico de colunas simples do Chart.js
    window.instanciaGraficoGaps = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hard Skills (Técnico)', 'Soft Skills (Comportamento)', 'Liderança'],
            datasets: [
                {
                    label: 'Média da Empresa',
                    data: [mediasEmpresa.tecnico, mediasEmpresa.comportamento, mediasEmpresa.lideranca],
                    backgroundColor: '#0056b3', // Azul claro PAREX
                    borderWidth: 1
                },
                {
                    label: 'Meta Desejada',
                    data: [metasEmpresa.tecnico, metasEmpresa.comportamento, metasEmpresa.lideranca],
                    backgroundColor: '#e2e8f0', // Cinza de fundo
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
                    max: 10, // Escala de notas de 0 a 10
                    ticks: {
                        stepSize: 2
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom', // Coloca a legenda embaixo para não espremer o gráfico
                    labels: {
                        boxWidth: 12,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

/**
 * Gera as recomendações em texto simples baseada no cálculo das lacunas de notas
 */
function gerarSugestoesCursos() {
    const lista = document.getElementById('listaRecomendacoes');
    lista.innerHTML = ''; // Limpa as sugestões anteriores

    // Calcula os gaps
    const gapTecnico = metasEmpresa.tecnico - mediasEmpresa.tecnico;
    const gapComportamento = metasEmpresa.comportamento - mediasEmpresa.comportamento;
    const gapLideranca = metasEmpresa.lideranca - mediasEmpresa.lideranca;

    let recomendouAlgo = false;

    // Se o gap técnico for considerável, sugere cursos de Metalmecânica
    if (gapTecnico > 0.5) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Treinamento em Metalmecânica recomendado</strong>: Média técnica está em ${mediasEmpresa.tecnico} (Meta: ${metasEmpresa.tecnico}). Focar em cursos de Desenho Técnico, Caldeiraria, Solda e Metalurgia.`;
        lista.appendChild(li);
        recomendouAlgo = true;
    }

    // Se o gap comportamental for considerável, sugere cursos de integração
    if (gapComportamento > 0.5) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Treinamento Comportamental recomendado</strong>: Média de comportamento está em ${mediasEmpresa.comportamento} (Meta: ${metasEmpresa.comportamento}). Focar em palestras de Comunicação Clara, Trabalho em Equipe e Segurança do Trabalho.`;
        lista.appendChild(li);
        recomendouAlgo = true;
    }

    // Se o gap de liderança for considerável, sugere cursos de liderança
    if (gapLideranca > 0.5) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Desenvolvimento de Líderes recomendado</strong>: Média de liderança está em ${mediasEmpresa.lideranca} (Meta: ${metasEmpresa.lideranca}). Focar em workshops de Delegação, Organização de Equipes e Gestão de Conflitos no chão de fábrica.`;
        lista.appendChild(li);
        recomendouAlgo = true;
    }

    // Se não tiver nenhum gap pendente
    if (!recomendouAlgo) {
        const li = document.createElement('li');
        li.innerHTML = '<strong>Ótimo desempenho!</strong> Todas as médias da fábrica estão dentro das metas de desempenho da PAREX.';
        lista.appendChild(li);
    }
}
