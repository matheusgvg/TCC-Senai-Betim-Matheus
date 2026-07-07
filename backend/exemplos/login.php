<?php
/**
 * Exemplo didático de login.php para documentação do TCC.
 * Recebe JSON: { "email": "...", "password": "...", "perfil": "..." }
 * Retorna o perfil do usuário autenticado sem expor o hash da senha.
 */

header('Content-Type: application/json; charset=utf-8');

try {
    $db = new PDO('sqlite:' . __DIR__ . '/../../database/mapa.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao conectar ao banco.']);
    exit;
}

$dados = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($dados['email'] ?? '');
$senha = $dados['password'] ?? '';
$perfil = $dados['perfil'] ?? '';

$stmt = $db->prepare('SELECT id, nome, email, perfil, senha_hash FROM usuarios WHERE email = :email AND perfil = :perfil');
$stmt->execute([
    'email' => $email,
    'perfil' => $perfil,
]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Credenciais inválidas.']);
    exit;
}

unset($usuario['senha_hash']);
$usuario['id'] = (int) $usuario['id'];

echo json_encode([
    'sucesso' => true,
    'usuario' => $usuario,
]);
