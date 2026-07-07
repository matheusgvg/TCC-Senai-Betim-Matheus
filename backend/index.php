<?php
// Configurações de cabeçalho para resposta JSON
header("Content-Type: application/json");

require_once __DIR__ . '/funcoes_quiz.php';

// 1. Conexão com o Banco de Dados SQLite
try {
    $db = new PDO('sqlite:' . __DIR__ . '/../database/mapa.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    atualizarEsquemaSQLite($db);
} catch (PDOException $e) {
    echo json_encode(["sucesso" => false, "mensagem" => "Erro ao conectar ao banco: " . $e->getMessage()]);
    exit;
}

// 2. Captura dos dados brutos enviados pelo Frontend (JSON)
$input = file_get_contents('php://input');
$dados = json_decode($input, true);

if (!$dados) {
    echo json_encode(["sucesso" => false, "mensagem" => "Dados inválidos ou vazios."]);
    exit;
}

$acao = $dados['acao'] ?? '';

// 3. Roteamento de Ações
switch ($acao) {
    case 'login':
        processarLogin($db, $dados);
        break;

    case 'cadastro':
        criarUsuario($db, $dados);
        break;

    case 'listar_usuarios':
        listarUsuariosAdmin($db, $dados);
        break;

    case 'salvar_usuario_admin':
        salvarUsuarioAdmin($db, $dados);
        break;

    case 'excluir_usuario_admin':
        excluirUsuarioAdmin($db, $dados);
        break;

    case 'alterar_senha_admin':
        alterarSenhaAdmin($db, $dados);
        break;

    case 'carregar_quiz':
        carregarQuiz($db, $dados);
        break;

    case 'salvar_quiz':
        salvarQuiz($db, $dados);
        break;

    case 'finalizar_quiz':
        finalizarQuiz($db, $dados);
        break;

    case 'finalizar_mapeamento':
        require_once 'processar_perfil.php';
        break;

    // Rota simples criada para carregar as informações do Painel do RH
    case 'obter_dados_gestor':
        obterDadosGestor($db, $dados);
        break;

    // Rota para ler o Relatório de Competências Detalhado do colaborador (PI)
    case 'obter_mapa_competencias':
        obterMapaCompetencias($db, $dados);
        break;

    default:
        echo json_encode(["sucesso" => false, "mensagem" => "Ação não reconhecida."]);
        break;
}
