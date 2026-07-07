<?php
/**
 * MAPA - Processador do Perfil de Competências (PI)
 * 
 * Lógica educativa para calcular, classificar e analisar os 4 eixos do PI:
 * - A: Dominância
 * - B: Extroversão
 * - C: Paciência
 * - D: Formalidade
 */

/**
 * Calcula os eixos A, B, C, D baseando-se nas respostas do quiz (escala 1 a 5).
 * Cada eixo é composto pela média simples de 3 perguntas do quiz.
 */
function montarEixosPI(): array
{
    return [
        'A' => ['l1', 'l3', 't2'],
        'B' => ['c1', 'c2', 'l2'],
        'C' => ['c3', 'c4', 't1'],
        'D' => ['t4', 't3', 'l4'],
    ];
}

function calcularScoresPI(array $respostas): array
{
    $scores = [];
    foreach (montarEixosPI() as $eixo => $ids) {
        $soma = 0;
        $total = count($ids);
        foreach ($ids as $id) {
            $soma += (float) ($respostas[$id] ?? 3);
        }
        $scores[$eixo] = round($soma / $total, 2);
    }

    return $scores;
}

/**
 * Classifica a pontuação média (1 a 5) em Baixo, Médio ou Alto.
 * Lógica de threshold (limiares) simples.
 */
function obterNivelEixo(float $score): string
{
    // LIMIARES (Thresholds):
    // - Menor que 2.5: Nível Baixo (perfil sutil ou reativo na dimensão)
    // - Entre 2.5 e 4.0: Nível Médio (comportamento equilibrado e situacional)
    // - A partir de 4.0: Nível Alto (característica dominante e evidente)
    if ($score < 2.5) {
        return 'Baixo';
    } elseif ($score < 4.0) {
        return 'Médio';
    } else {
        return 'Alto';
    }
}

/**
 * Retorna os Pontos Fortes e Pontos de Melhoria para cada eixo de acordo com o nível.
 * Metodologia adaptada para a Indústria Metalmecânica PAREX.
 */
function obterDiagnosticoEixo(string $eixo, string $nivel): array
{
    $diagnosticos = [
        'A' => [ // Dominância
            'Alto' => [
                'forte' => 'Independência, foco em metas difíceis, tomada de decisão rápida e proatividade no chão de fábrica.',
                'melhoria' => 'Pode parecer autoritário, impaciente com processos lentos ou pouco colaborativo em reuniões.'
            ],
            'Médio' => [
                'forte' => 'Equilíbrio entre firmeza e colaboração. Sabe propor ideias mas respeita a liderança.',
                'melhoria' => 'Pode hesitar em assumir riscos de forma isolada em situações de extrema pressão.'
            ],
            'Baixo' => [
                'forte' => 'Trabalho em equipe altamente cooperativo, boa escuta e foco na harmonia do grupo.',
                'melhoria' => 'Dificuldade em tomar a frente de problemas e relutância em assumir riscos operacionais.'
            ]
        ],
        'B' => [ // Extroversão
            'Alto' => [
                'forte' => 'Comunicação influente, facilidade de integração, mediação de problemas e empatia com colegas.',
                'melhoria' => 'Risco de se dispersar do foco em tarefas solitárias ou de falar mais do que escutar.'
            ],
            'Médio' => [
                'forte' => 'Comunicação direta, objetiva e focada na tarefa. Sabe ouvir feedbacks com serenidade.',
                'melhoria' => 'Pode parecer reservado demais em treinamentos coletivos ou integração de novos membros.'
            ],
            'Baixo' => [
                'forte' => 'Excelente concentração, foco profundo em detalhes analíticos e processos individuais.',
                'melhoria' => 'Dificuldade de expor ideias em público ou interagir em ambientes sob forte pressão social.'
            ]
        ],
        'C' => [ // Paciência
            'Alto' => [
                'forte' => 'Estabilidade sob pressão, persistência em tarefas longas, respeito a prazos e rotinas seguras.',
                'melhoria' => 'Pode resistir a mudanças bruscas de escopo ou adaptação rápida a ferramentas novas.'
            ],
            'Médio' => [
                'forte' => 'Ritmo de trabalho dinâmico e adaptável. Equilibra bem rotinas e imprevistos diários.',
                'melhoria' => 'Pode perder o foco se o ambiente de trabalho for desorganizado ou sem processos claros.'
            ],
            'Baixo' => [
                'forte' => 'Raciocínio ágil, reatividade a problemas de urgência e foco na resolução rápida.',
                'melhoria' => 'Tendência a agir por impulso, podendo cometer falhas por pressa ou pular normas de segurança.'
            ]
        ],
        'D' => [ // Formalidade
            'Alto' => [
                'forte' => 'Extrema precisão técnica, respeito rígido a normas de segurança (EPIs/EPCs) e garantia de qualidade.',
                'melhoria' => 'Pode se mostrar muito rígido com regras e ter dificuldade em aceitar métodos alternativos.'
            ],
            'Médio' => [
                'forte' => 'Segue os procedimentos obrigatórios com bom senso, adaptando-se a improvisos controlados.',
                'melhoria' => 'Pode desviar do padrão em rotinas muito repetitivas por excesso de confiança.'
            ],
            'Baixo' => [
                'forte' => 'Pensamento criativo, flexibilidade metodológica e foco na simplificação do trabalho.',
                'melhoria' => 'Risco de ignorar normas de segurança, instruções de trabalho escritas ou padrões de qualidade.'
            ]
        ]
    ];

    return $diagnosticos[$eixo][$nivel] ?? [
        'forte' => 'Não mapeado.',
        'melhoria' => 'Não mapeado.'
    ];
}

/**
 * Salva ou atualiza os valores brutos de A, B, C, D do colaborador no banco de dados.
 */
function salvarResultadosPI(PDO $db, int $usuarioId, array $scores): void
{
    $stmt = $db->prepare('
        INSERT INTO resultados_pi (usuario_id, dominancia, extroversao, paciencia, formalidade, data_registro)
        VALUES (:usuario_id, :dominancia, :extroversao, :paciencia, :formalidade, datetime("now", "localtime"))
        ON CONFLICT(usuario_id) DO UPDATE SET
            dominancia = excluded.dominancia,
            extroversao = excluded.extroversao,
            paciencia = excluded.paciencia,
            formalidade = excluded.formalidade,
            data_registro = datetime("now", "localtime")
    ');

    $stmt->execute([
        'usuario_id' => $usuarioId,
        'dominancia' => $scores['A'],
        'extroversao' => $scores['B'],
        'paciencia' => $scores['C'],
        'formalidade' => $scores['D']
    ]);
}

/**
 * Recupera o relatório completo de competências do colaborador.
 */
function obterRelatorioPI(PDO $db, int $usuarioId): ?array
{
    $stmt = $db->prepare('
        SELECT dominancia, extroversao, paciencia, formalidade, data_registro
        FROM resultados_pi
        WHERE usuario_id = :usuario_id
    ');
    $stmt->execute(['usuario_id' => $usuarioId]);
    $pi = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pi) {
        return null;
    }

    $scores = [
        'A' => (float) $pi['dominancia'],
        'B' => (float) $pi['extroversao'],
        'C' => (float) $pi['paciencia'],
        'D' => (float) $pi['formalidade']
    ];

    $diagnostico = [];
    $eixosNomes = [
        'A' => 'Dominância',
        'B' => 'Extroversão',
        'C' => 'Paciência',
        'D' => 'Formalidade'
    ];

    foreach ($scores as $eixo => $score) {
        $nivel = obterNivelEixo($score);
        $textos = obterDiagnosticoEixo($eixo, $nivel);

        $diagnostico[$eixo] = [
            'nome' => $eixosNomes[$eixo],
            'score' => $score,
            'nivel' => $nivel,
            'forte' => $textos['forte'],
            'melhoria' => $textos['melhoria']
        ];
    }

    return [
        'data' => $pi['data_registro'],
        'eixos' => $diagnostico
    ];
}
