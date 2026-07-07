-- ============================================================
-- MAPA - Esquema do banco de dados (SQLite)
-- ============================================================
-- Este arquivo mostra a estrutura das tabelas em SQL puro.
-- Para criar o banco de fato, use o script: criar_banco.php
-- ============================================================

-- Tabela de usuários do sistema.
-- O perfil admin é exclusivo do profissional de T.I.
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'gestor', 'colaborador'))
);

-- Tabela de notas do quiz de competências.
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
);

-- Tabela de progresso parcial do quiz (salvar e continuar depois).
CREATE TABLE IF NOT EXISTS progresso_quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    respostas TEXT NOT NULL,
    indice_atual INTEGER NOT NULL DEFAULT 0,
    concluido INTEGER NOT NULL DEFAULT 0,
    atualizado_em TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela do parecer comportamental detalhado do PI.
CREATE TABLE IF NOT EXISTS resultados_pi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    dominancia REAL NOT NULL,
    extroversao REAL NOT NULL,
    paciencia REAL NOT NULL,
    formalidade REAL NOT NULL,
    data_registro TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
