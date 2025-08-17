import * as dom from './dom.js';
import * as state from './state.js';
import { setupUIForUser } from './ui.js';
import { supabaseClient } from './supabaseClient.js';

export async function handleLogin(event) {
    event.preventDefault();
    dom.loginError.classList.add('hidden');
    const email = dom.loginForm.username.value;
    const password = dom.loginForm.password.value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Erro no login:', error.message);
        dom.loginError.textContent = 'Email ou senha inválidos.';
        dom.loginError.classList.remove('hidden');
        return;
    }
    console.log('Login bem-sucedido:', data.user);
    state.setLoggedInUser({
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        username: data.user.email.split('@')[0]
    });
    location.reload(); // Força um recarregamento completo para o initializeApp cuidar do resto
}

export async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Erro no logout:', error);
        alert('Não foi possível fazer o logout.');
        return;
    }
    state.setLoggedInUser(null);
    location.reload();
}

export function handleAddUser(event) {
    event.preventDefault();
    alert('Função desativada. O cadastro de usuários agora é feito pelo Supabase.');
}

export function handleDeleteUser(username) {
    alert('Função desativada. O gerenciamento de usuários agora é feito pelo Supabase.');
}

export function renderUsersList() {
    dom.usersList.innerHTML = `<p class="text-gray-500">O gerenciamento de usuários será recriado para usar o banco de dados.</p>`;
}