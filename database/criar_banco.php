<?php
/**
 * MAPA - Script para criar o banco SQLite.
 *
 * Este arquivo prepara a base do TCC com a nova regra de negócio:
 * somente o Administrador de T.I. cadastra usuários, e os perfis aceitos são
 * admin, gestor e colaborador.
 *
 * Como usar:
 * - Navegador: http://localhost/Projeto-TCC-Senai/database/criar_banco.php
 * - Terminal:  C:\xampp\php\php.exe database\criar_banco.php
 */

$caminhoBanco = __DIR__ . '/mapa.db';

try {
    $db = new PDO('sqlite:' . $caminhoBanco);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Tabela de usuários com senha em hash e perfil controlado.
    $db->exec("
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'gestor', 'colaborador'))
        )
    ");

    // Tabela de resultados consolidados do quiz.
    $db->exec("
        CREATE TABLE IF NOT EXISTS notas_quiz (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            lideranca REAL NOT NULL,
            tecnico REAL NOT NULL,
            comportamento REAL NOT NULL,
            perfil_resultado TEXT,
            indice_preditivo REAL,
            data_registro TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    ");

    // Tabela para salvar respostas parciais e permitir continuar depois.
    $db->exec("
        CREATE TABLE IF NOT EXISTS progresso_quiz (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL UNIQUE,
            respostas TEXT NOT NULL,
            indice_atual INTEGER NOT NULL DEFAULT 0,
            concluido INTEGER NOT NULL DEFAULT 0,
            atualizado_em TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    ");

    // Tabela do parecer comportamental detalhado do PI.
    $db->exec("
        CREATE TABLE IF NOT EXISTS resultados_pi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL UNIQUE,
            dominancia REAL NOT NULL,
            extroversao REAL NOT NULL,
            paciencia REAL NOT NULL,
            formalidade REAL NOT NULL,
            data_registro TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    ");

    $totalUsuarios = (int) $db->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();

    if ($totalUsuarios === 0) {
        $senhaHash = password_hash('123456', PASSWORD_DEFAULT);

        $inserirUsuario = $db->prepare("
            INSERT INTO usuarios (nome, email, senha_hash, perfil)
            VALUES (:nome, :email, :senha_hash, :perfil)
        ");

        $inserirUsuario->execute([
            'nome' => 'Administrador T.I.',
            'email' => 'admin@parex.com.br',
            'senha_hash' => $senhaHash,
            'perfil' => 'admin',
        ]);

        $inserirUsuario->execute([
            'nome' => 'João Silva',
            'email' => 'joao@parex.com.br',
            'senha_hash' => $senhaHash,
            'perfil' => 'colaborador',
        ]);

        $inserirUsuario->execute([
            'nome' => 'Maria Santos',
            'email' => 'maria@parex.com.br',
            'senha_hash' => $senhaHash,
            'perfil' => 'gestor',
        ]);

        $db->prepare("
            INSERT INTO notas_quiz (usuario_id, lideranca, tecnico, comportamento, perfil_resultado, indice_preditivo)
            VALUES (2, 7.5, 8.0, 6.5, 'Perfil Técnico', 8.1)
        ")->execute();
    }

    $mensagem = "Banco criado com sucesso em: {$caminhoBanco}";
} catch (PDOException $e) {
    $mensagem = 'Erro ao criar o banco: ' . $e->getMessage();
}

if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>MAPA - Banco</title></head><body>';
    echo '<h1>MAPA - Criação do banco</h1>';
    echo '<p>' . htmlspecialchars($mensagem) . '</p>';
    echo '<p><strong>Usuários de teste</strong> (senha: 123456):</p>';
    echo '<ul>';
    echo '<li>admin@parex.com.br — admin (T.I.)</li>';
    echo '<li>joao@parex.com.br — colaborador</li>';
    echo '<li>maria@parex.com.br — gestor de RH</li>';
    echo '</ul>';
    echo '</body></html>';
} else {
    echo $mensagem . PHP_EOL;
}
