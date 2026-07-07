<?php
/**
 * MAPA - Conexão reutilizável com o banco SQLite/ PDO é tipo um JDBC, jeito de manipular banco de dados em PHP;
 *
 * Use este arquivo em outros scripts PHP do backend:
 *   require_once __DIR__ . '/../database/conexao.php';
 *   // a variável $db já estará disponível
 */

$caminhoBanco = __DIR__ . '/mapa.db';

try {
    $db = new PDO('sqlite:' . $caminhoBanco);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Erro ao conectar ao banco: ' . $e->getMessage());
}
