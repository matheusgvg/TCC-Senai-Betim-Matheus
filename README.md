```markdown
<div align="center">

# 🗺️ MAPA
### Mapeamento de Competências e Aptidões Internas

![Status]()
![Instituição]()
![Licença]()
![PHP]()
![SQLite]()

> **Sistema de diagnóstico de perfil comportamental e técnico desenvolvido para a Indústria PAREX.**  
> Projeto de Conclusão de Curso — SENAI Betim | Desenvolvimento de Sistemas

</div>

---

## 🎯 Visão Geral

Organizações de alta performance enfrentam um desafio silencioso: **talentos invisíveis**. Colaboradores com grande potencial passam despercebidos por avaliações subjetivas, incompletas ou despadronizadas.

O **MAPA** foi concebido para resolver esse problema diretamente na **Indústria PAREX**. Por meio de um **Quiz Vocacional interativo**, o sistema cruza de forma sistemática:

- 🔧 **Hard Skills** — competências técnicas mensuráveis
- 🧠 **Soft Skills** — comportamentos e traços de personalidade

O resultado é um **diagnóstico de perfil individual** preciso, acessível ao colaborador e estratégico para o RH.

---

## 🔬 Metodologia Científica

O motor de análise do MAPA é fundamentado nos **4 eixos do Predictive Index (PI)**, metodologia validada internacionalmente para mapeamento de perfis profissionais:

| Eixo | Fator | Descrição |
|------|-------|-----------|
| **A** | Dominância | Necessidade de controle sobre o ambiente e os resultados |
| **B** | Extroversão | Necessidade de relacionamentos e influência social |
| **C** | Paciência | Necessidade de consistência e estabilidade |
| **D** | Formalidade | Necessidade de conformidade com regras e estruturas |

As respostas do quiz são processadas por algoritmos que calculam a intensidade de cada fator, gerando um **vetor de perfil** representado visualmente.

---

## ✨ Funcionalidades Principais

### 👤 Colaborador
- 🔐 Login seguro com autenticação por sessão
- 📝 Quiz Vocacional com **salvamento automático de progresso**
- 📊 **Gráfico de Radar** interativo com diagnóstico visual do perfil
- 🏅 Download de **Certificado de Perfil** personalizado em PDF

### 👔 Gestor de RH
- 🏦 **Banco de Talentos** com filtros avançados por competência, setor e perfil PI
- 📉 **Dashboard de Lacunas (Gaps)** — identifica discrepâncias entre perfil ideal e atual
- 📄 Exportação de relatórios consolidados em **PDF e Excel**

### 🛠️ Administrador
- ⚙️ **CRUD completo** de usuários, departamentos e competências
- Controle granular de permissões e acesso ao sistema

---

## 🏗️ Stack Tecnológica

```

┌─────────────────────────────────────────────────────┐

│                    MAPA — Stack                      │

├──────────────┬──────────────────────────────────────┤

│  Frontend    │  HTML5 · CSS3 · JavaScript ES6+       │

│  Backend     │  PHP 8 (algoritmos PI + integração    │

│              │  de e-mail via PHPMailer)              │

│  Database    │  SQLite (mapa.db)                     │

│  Ambiente    │  XAMPP (Apache + PHP local)           │

└──────────────┴──────────────────────────────────────┘

```

> **Por que SQLite?** Escolhido estrategicamente pelo **baixo custo operacional**, **zero configuração de servidor de banco** e **portabilidade total** — o arquivo `mapa.db` é autocontido e não requer instalação adicional.

---

## 📁 Estrutura de Pastas

```

MAPA/

│

├── 📂 frontend/          # Interface do usuário

│   ├── pages/            # HTML das telas (login, quiz, dashboard...)

│   ├── css/              # Estilos e temas visuais

│   └── js/               # Lógica client-side e requisições AJAX

│

├── 📂 backend/           # Lógica de negócio e API interna

│   ├── auth/             # Autenticação e controle de sessão

│   ├── quiz/             # Processamento do quiz e cálculo PI

│   ├── relatorios/       # Geração de PDF, Excel e certificados

│   └── mail/             # Integração de e-mail

│

├── 📂 database/          # Banco de dados e scripts SQL

│   ├── mapa.db           # Arquivo SQLite principal

│   └── schema.sql        # DDL para recriação do banco

│

├── 📂 assets/            # Recursos estáticos globais

│   ├── img/              # Logotipos, ícones e imagens

│   └── fonts/            # Tipografias customizadas

│

└── README.md

```

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
- XAMPP (v8.x ou superior) instalado e configurado

### Passo a Passo

**1. Clone o repositório**
```

git clone https://github.com/matheusgvg/TCC-Senai-Betim-Matheus.git

```

**2. Mova o projeto para o diretório do Apache**
```

# Windows

Copie a pasta para: C:xampphtdocsmapa

# Linux / macOS

cp -r TCC-Senai-Betim-Matheus /opt/lampp/htdocs/mapa

```

**3. Inicie os serviços no XAMPP**

Abra o **XAMPP Control Panel** e inicie:
- ✅ **Apache**

> O módulo MySQL **não é necessário** — o projeto utiliza SQLite.

**4. Configure o banco de dados**

O arquivo `mapa.db` já vem populado com a estrutura base. Verifique se ele está em:
```

htdocs/mapa/database/mapa.db

```
Caso precise recriar o banco do zero:
```

sqlite3 database/mapa.db < database/schema.sql

```

**5. Acesse o sistema**

Abra o navegador e acesse:
```

http://localhost/mapa/frontend/pages/login.html

```

---

## 👥 Equipe de Desenvolvimento

| Nome | Papel |
|------|-------|
| **Matheus** | 👑 Líder do Projeto & Líder de Turma |
| **Bryan** | Desenvolvimento |
| **Davi Franklin** | Desenvolvimento |
| **Davi Moreno** | Desenvolvimento |
| **Pedro** | Desenvolvimento |
| **Prof.ª Priscila Nascimento** | Orientadora |

> 🏫 Projeto desenvolvido no **SENAI Betim** — Curso Técnico em **Desenvolvimento de Sistemas**.

---

## 📜 Licença

Distribuído sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

---

<div align="center">

Desenvolvido com 💙 pela equipe MAPA · SENAI Betim · 2026

</div>
```