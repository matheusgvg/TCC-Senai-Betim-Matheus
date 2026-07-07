<?php
/**
 * SISTEMA MAPA - Indústria PAREX
 * Lista oficial de perguntas do Quiz Vocacional (Backend)
 * 
 * Objetivo: Identificar talentos ocultos e reduzir a subjetividade no RH [3, 4].
 * Metodologia: Baseado nos 4 eixos do Predictive Index (PI) [1, 2]:
 * - A (Dominância): Independência e iniciativa.
 * - B (Extroversão): Interação social e influência.
 * - C (Paciência): Estabilidade e ritmo de trabalho.
 * - D (Formalidade): Precisão e adesão a normas.
 * 
 * Mantenha este arquivo em sincronia com frontend/assets/js/quiz.js
 */

$PERGUNTAS_QUIZ = [
    // --- QUESTÕES TÉCNICAS (HARD SKILLS) ---
    ['id' => 't1', 'categoria' => 'tecnico', 'eixo' => 'C', 'texto' => 'Sei interpretar desenhos técnicos e projetos de caldeiraria.'],
    ['id' => 't2', 'categoria' => 'tecnico', 'eixo' => 'A', 'texto' => 'Domino ferramentas de corte, solda ou usinagem conforme minha função.'],
    ['id' => 't3', 'categoria' => 'tecnico', 'eixo' => 'D', 'texto' => 'Consigo identificar falhas em equipamentos e peças metalúrgicas.'],
    ['id' => 't4', 'categoria' => 'tecnico', 'eixo' => 'D', 'texto' => 'Conheço normas de segurança e qualidade aplicadas no chão de fábrica.'],

    // --- QUESTÕES COMPORTAMENTAIS (SOFT SKILLS) ---
    ['id' => 'c1', 'categoria' => 'comportamento', 'eixo' => 'B', 'texto' => 'Trabalho bem em equipe mesmo quando o prazo está apertado.'],
    ['id' => 'c2', 'categoria' => 'comportamento', 'eixo' => 'B', 'texto' => 'Comunico problemas e dificuldades de forma clara com colegas e supervisores.'],
    ['id' => 'c3', 'categoria' => 'comportamento', 'eixo' => 'C', 'texto' => 'Respeito horários, procedimentos e orientações da liderança.'],
    ['id' => 'c4', 'categoria' => 'comportamento', 'eixo' => 'C', 'texto' => 'Aceito feedback e busco melhorar meu desempenho continuamente.'],

    // --- QUESTÕES DE LIDERANÇA ---
    ['id' => 'l1', 'categoria' => 'lideranca', 'eixo' => 'A', 'texto' => 'Assumo responsabilidade quando algo dá errado no meu setor.'],
    ['id' => 'l2', 'categoria' => 'lideranca', 'eixo' => 'B', 'texto' => 'Ajudo colegas novos a entender o trabalho e os processos.'],
    ['id' => 'l3', 'categoria' => 'lideranca', 'eixo' => 'A', 'texto' => 'Proponho melhorias quando identifico oportunidades no processo.'],
    ['id' => 'l4', 'categoria' => 'lideranca', 'eixo' => 'D', 'texto' => 'Consigo organizar tarefas da equipe quando sou solicitado.'],
];