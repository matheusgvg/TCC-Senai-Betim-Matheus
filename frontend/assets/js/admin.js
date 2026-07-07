/**
 * MAPA - Painel do Administrador de T.I.
 *
 * Centraliza o cadastro, edição, troca de senha e exclusão de usuários.
 * O frontend sempre envia o id do administrador logado para o backend validar a permissão.
 */

const API_URL = '../../backend/index.php';

let adminLogado = null;
let usuarios = [];

document.addEventListener('DOMContentLoaded', iniciarPainelAdmin);

async function iniciarPainelAdmin() {
    adminLogado = obterUsuarioLogado();

    if (!adminLogado || adminLogado.perfil !== 'admin') {
        alert('Acesso negado. Entre como Administrador de T.I.');
        window.location.href = '../index.html';
        return;
    }

    document.getElementById('nomeAdmin').textContent = `Olá, ${adminLogado.nome}`;
    vincularEventos();
    await carregarUsuarios();
}

function obterUsuarioLogado() {
    const dados = sessionStorage.getItem('mapa_usuario');
    return dados ? JSON.parse(dados) : null;
}

function vincularEventos() {
    document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);
    document.getElementById('formSenhaAdmin').addEventListener('submit', alterarSenhaAdmin);
    document.getElementById('btnAbrirModalSenha').addEventListener('click', abrirModalSenha);
    document.getElementById('btnFecharModalSenha').addEventListener('click', fecharModalSenha);
    document.getElementById('modalSenhaAdmin').addEventListener('click', (event) => {
        if (event.target === event.currentTarget) {
            fecharModalSenha();
        }
    });
    const buscarInput = document.getElementById('inputBuscarUsuario');
    if (buscarInput) {
        buscarInput.addEventListener('input', renderizarTabela);
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fecharModalSenha();
        }
    });
    document.getElementById('btnCancelarEdicao').addEventListener('click', limparFormulario);
    document.getElementById('btnSair').addEventListener('click', () => {
        sessionStorage.removeItem('mapa_usuario');
        window.location.href = '../index.html';
    });
}

function abrirModalSenha() {
    document.getElementById('modalSenhaAdmin').classList.remove('hidden');
}

function fecharModalSenha() {
    document.getElementById('modalSenhaAdmin').classList.add('hidden');
}

async function carregarUsuarios() {
    const resposta = await enviarParaServidor('listar_usuarios', {
        admin_id: adminLogado.id,
    });

    if (!resposta.sucesso) {
        mostrarToast(resposta.mensagem || 'Não foi possível carregar usuários.');
        return;
    }

    usuarios = resposta.usuarios || [];
    renderizarTabela();
}

function filtrarUsuarios(query) {
    const valor = query.trim().toLowerCase();
    if (!valor) {
        return usuarios;
    }

    return usuarios.filter((usuario) => {
        const nome = usuario.nome?.toLowerCase() || '';
        const email = usuario.email?.toLowerCase() || '';
        const perfil = usuario.perfil?.toLowerCase() || '';

        return nome.includes(valor) || email.includes(valor) || perfil.includes(valor);
    });
}

function renderizarTabela() {
    const filtro = document.getElementById('inputBuscarUsuario')?.value || '';
    const resultado = filtrarUsuarios(filtro);
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = '';

    document.getElementById('totalUsuarios').textContent =
        `${resultado.length} ${resultado.length === 1 ? 'usuário' : 'usuários'}`;

    if (resultado.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.className = 'empty-row';
        td.textContent = filtro ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    resultado.forEach((usuario) => {
        const tr = document.createElement('tr');

        tr.appendChild(criarCelulaTexto(usuario.nome));
        tr.appendChild(criarCelulaTexto(usuario.email));
        tr.appendChild(criarCelulaPerfil(usuario.perfil));
        tr.appendChild(criarCelulaAcoes(usuario));

        tbody.appendChild(tr);
    });
}

async function salvarUsuario(event) {
    event.preventDefault();

    const id = document.getElementById('usuarioId').value;
    const senha = document.getElementById('senha').value;

    const email = document.getElementById('email').value.trim();

    if (!/^[^@\s]+@parex\.com\.br$/i.test(email)) {
        mostrarToast('Use apenas e-mails corporativos do domínio @parex.com.br.');
        return;
    }

    const dados = {
        admin_id: adminLogado.id,
        id: id ? Number(id) : null,
        nome: document.getElementById('nome').value.trim(),
        email,
        perfil: document.getElementById('perfil').value,
        password: senha,
    };

    if (!id && senha.length < 6) {
        mostrarToast('Informe uma senha inicial com pelo menos 6 caracteres.');
        return;
    }

    const resposta = await enviarParaServidor('salvar_usuario_admin', dados);

    if (!resposta.sucesso) {
        mostrarToast(resposta.mensagem || 'Erro ao salvar usuário.');
        return;
    }

    mostrarToast(resposta.mensagem);
    limparFormulario();
    await carregarUsuarios();
}

async function alterarSenhaAdmin(event) {
    event.preventDefault();

    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarToast('Preencha todos os campos da senha.');
        return;
    }

    if (novaSenha.length < 6) {
        mostrarToast('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (novaSenha !== confirmarSenha) {
        mostrarToast('A confirmação da senha não confere.');
        return;
    }

    const resposta = await enviarParaServidor('alterar_senha_admin', {
        admin_id: adminLogado.id,
        current_password: senhaAtual,
        new_password: novaSenha,
    });

    if (!resposta.sucesso) {
        mostrarToast(resposta.mensagem || 'Erro ao alterar a senha.');
        return;
    }

    mostrarToast(resposta.mensagem);
    document.getElementById('senhaAtual').value = '';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarSenha').value = '';
    fecharModalSenha();
}

function criarCelulaTexto(texto) {
    const td = document.createElement('td');
    td.textContent = texto;
    return td;
}

function criarCelulaPerfil(perfil) {
    const td = document.createElement('td');
    const span = document.createElement('span');
    span.className = `perfil-badge ${perfil}`;
    span.textContent = perfil === 'gestor' ? 'Gestor de RH' : 'Colaborador';
    td.appendChild(span);
    return td;
}

function criarCelulaAcoes(usuario) {
    const td = document.createElement('td');
    td.className = 'actions-cell';

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-edit';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => preencherFormulario(usuario));

    const btnExcluir = document.createElement('button');
    btnExcluir.type = 'button';
    btnExcluir.className = 'btn-danger';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => excluirUsuario(usuario));

    td.appendChild(btnEditar);
    td.appendChild(btnExcluir);
    return td;
}

function preencherFormulario(usuario) {
    document.getElementById('usuarioId').value = usuario.id;
    document.getElementById('nome').value = usuario.nome;
    document.getElementById('email').value = usuario.email;
    document.getElementById('perfil').value = usuario.perfil;
    document.getElementById('senha').value = '';
    document.getElementById('tituloFormulario').textContent = 'Editar usuário';
    document.getElementById('btnSalvarUsuario').textContent = 'Salvar alterações';
    document.getElementById('btnCancelarEdicao').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFormulario() {
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('tituloFormulario').textContent = 'Novo usuário';
    document.getElementById('btnSalvarUsuario').textContent = 'Cadastrar usuário';
    document.getElementById('btnCancelarEdicao').classList.add('hidden');
}

async function excluirUsuario(usuario) {
    const confirmou = confirm(`Deseja excluir o usuário ${usuario.nome}?`);
    if (!confirmou) return;

    const resposta = await enviarParaServidor('excluir_usuario_admin', {
        admin_id: adminLogado.id,
        id: usuario.id,
    });

    if (!resposta.sucesso) {
        mostrarToast(resposta.mensagem || 'Erro ao excluir usuário.');
        return;
    }

    mostrarToast(resposta.mensagem);
    await carregarUsuarios();
}

async function enviarParaServidor(acao, dadosExtras = {}) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ...dadosExtras }),
    });

    return response.json();
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.remove('hidden');

    clearTimeout(mostrarToast.timeoutId);
    mostrarToast.timeoutId = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}
