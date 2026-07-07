# Projeto-TCC-Senai

## Objetivos do Repositório
O tema deste projeto foi escolhido com base nas demandas cadastradas por empresas na plataforma SAGA SENAI, uma plataforma que tem por objetivo permitir que os alunos resolvam demandas reais do mercado de trabalho.

Escolhemos a demanda **Mapeamento de Competências e Aptidões Internas** (ID da Demanda: 12276), que visa atender a empresa **PAREX Indústria Mecânica, Caldeiraria e Estruturas Metálicas S.A.** no seguinte desafio:

A empresa Parex necessita identificar talentos e competências de forma estruturada para otimizar a distribuição de funções e o desenvolvimento profissional. Nossa solução consiste no desenvolvimento de um sistema de mapeamento via "Quiz Vocacional". O colaborador responderá a um formulário interativo de competências técnicas e comportamentais (soft skills), e o sistema processará os dados para gerar um banco de talentos, sugerindo a melhor alocação ou trilha de treinamento para cada perfil.

## Sobre o Desafio
* O mapeamento de competências e aptidões internas permite identificar de forma estruturada os conhecimentos, habilidades, comportamentos e potenciais dos colaboradores.
* Isso possibilita compreender talentos, otimizar a distribuição de funções, apoiar decisões de desenvolvimento profissional e fortalecer a gestão de pessoas, gerando mais eficiência, alinhamento estratégico e melhor aproveitamento das capacidades individuais e coletivas.

## Tecnologias e Metodologia
A construção da ferramenta digital proposta baseia-se em uma arquitetura de software dividida nas camadas de Frontend, Backend e Banco de Dados, estruturada para atender a dois perfis de usuários distintos: o Colaborador e o Gestor de RH.

* **Front-End**: O sistema utilizará HTML5 e CSS3 para criar uma interface de quiz moderna e amigável, reduzindo a resistência dos colaboradores. JavaScript será utilizado para gerenciar a lógica em tempo real e fornecer um feedback visual imediato ao usuário.
* **Back-End**: O sistema será desenvolvido utilizando a linguagem PHP para receber os dados, processar os algoritmos de mapeamento e gerar diagnósticos individuais.
* **Banco de Dados**: Utilizaremos SQLite para armazenar as informações localmente de forma estruturada, com custo de infraestrutura praticamente nulo.

## Relatório de Competências PI

O sistema entrega um parecer detalhado de comportamento com base nos quatro eixos do Predictive Index (PI): Dominância, Extroversão, Paciência e Formalidade. Cada colaborador recebe:
* Pontuação média em cada eixo (escala 1-5);
* Classificação por nível: Baixo, Médio ou Alto;
* Pontos fortes comportamentais;
* Sugestões de desenvolvimento com foco em autoconhecimento e planejamento de carreira.

A visão do Gestor de RH permite identificar rapidamente quais colaboradores já possuem o mapa de competências completo e acessar o relatório online ou o pack consolidado em PDF.

## Equipe Desenvolvedora
* Matheus Gustavo Vieira Gonzaga (Líder)
* Bryan Irios de Souza Rodrigues
* Davi Henriques de Freitas Moreno
* Davi Franklin Pinto Araujo Souza
* Pedro Neri Pereira
