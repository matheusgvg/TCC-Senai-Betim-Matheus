/**
 * MAPA - Autenticação do portal.
 *
 * O login apenas valida usuários previamente cadastrados pelo Administrador de T.I.
 * Não existe mais cadastro aberto nem recuperação de senha na tela pública.
 */

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();

        if (!/^[^@\s]+@parex\.com\.br$/i.test(email)) {
            alert('Use apenas e-mails corporativos do domínio @parex.com.br.');
            return;
        }

        const dadosLogin = {
            perfil: document.getElementById('perfil').value,
            email,
            password: document.getElementById('password').value,
        };

        try {
            const response = await fetch('../backend/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao: 'login', ...dadosLogin }),
            });

            const resultado = await response.json();

            if (!resultado.sucesso) {
                alert('Erro de autenticação: ' + resultado.mensagem);
                return;
            }

            sessionStorage.setItem('mapa_usuario', JSON.stringify(resultado.usuario));
            window.location.href = obterRotaPorPerfil(resultado.usuario.perfil);
        } catch (error) {
            console.error('Erro ao conectar com o servidor:', error);
            alert('Não foi possível conectar ao servidor. Verifique se o Apache/XAMPP está ativo.');
        }
    });
});

/**
 * Define a primeira tela aberta após o login.
 * Gestores passam por uma tela de escolha porque possuem Dashboard e Quiz.
 */
function obterRotaPorPerfil(perfil) {
    const rotas = {
        admin: 'modulo_admin/painel.html',
        colaborador: 'modulo_colaborador/quiz.html',
        gestor: 'modulo_gestor/opcoes.html',
    };

    return rotas[perfil] || 'index.html';
}
