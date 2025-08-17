// js/main.js - VERSÃO CORRIGIDA PARA EVITAR DUPLICIDADE

import * as dom from './dom.js';
import * as state from './state.js';
import * as api from './api.js';
import * as auth from './auth.js';
import * as ui from './ui.js';
import { supabaseClient } from './supabaseClient.js';

function handleStep1() {
    const pregaoId = dom.pregaoInput.value.trim();
    const pregaoRegex = /^\d{5}\/\d{4}$/;
    if (!pregaoRegex.test(pregaoId)) {
        dom.errorStep1.textContent = 'Formato inválido. Use NNNNN/AAAA.';
        dom.errorStep1.classList.remove('hidden');
        return;
    }
    const db = state.getDB();
    if (db[pregaoId]) {
        state.updateCurrentState({ pregaoId: pregaoId, pregaoData: db[pregaoId] });
        ui.renderFornecedores();
        ui.navigateToStep(2);
    } else {
        dom.errorStep1.textContent = 'Pregão não encontrado.';
        dom.errorStep1.classList.remove('hidden');
    }
}

function handleStep2() {
    const currentState = state.getCurrentState();
    if (currentState.fornecedorId) {
        const fornecedorData = currentState.pregaoData.fornecedores.find(f => f.id === currentState.fornecedorId);
        state.updateCurrentState({ fornecedorData });
        ui.renderItens();
        ui.navigateToStep(3);
    } else {
        dom.errorStep2.textContent = 'Selecione um fornecedor.';
        dom.errorStep2.classList.remove('hidden');
    }
}

function handleStep3() {
    const currentStateUpdates = {
        setorRequisitante: dom.setorInput.value.trim(),
        nup: dom.nupInput.value.trim(),
        responsavel: dom.responsavelInput.value.trim(),
        identidade: dom.identidadeInput.value.trim(),
        destino: dom.destinoInput.value.trim(),
        contato: dom.contatoInput.value.trim(),
        email: dom.emailInput.value.trim(),
        anexos: dom.anexosInput.value.trim(),
        justificativa: dom.justificativaInput.value.trim(),
        notaCredito: dom.notaCreditoInput.value.trim(),
        planoInterno: dom.planoInternoInput.value.trim(),
        ptres: dom.ptresInput.value.trim(),
        tipoEmpenho: document.querySelector('input[name="tipoEmpenho"]:checked').value,
        fiscalAdm: dom.fiscalAdmInput.value.trim(),
        fiscalAdmFunc: dom.fiscalAdmFuncInput.value.trim(),
        conformador: dom.conformadorInput.value.trim(),
        conformadorFunc: dom.conformadorFuncInput.value.trim(),
        ordenador: dom.ordenadorInput.value.trim(),
        ordenadorFunc: dom.ordenadorFuncInput.value.trim()
    };
    state.updateCurrentState(currentStateUpdates);
    if (!currentStateUpdates.setorRequisitante) {
        alert('O campo "Setor Requisitante" é obrigatório.');
        return;
    }
    ui.renderPreview();
    ui.navigateToStep(4);
}

async function handleSaveConfig(e) {
    e.preventDefault();
    const settingsObject = {
        fiscalAdm: dom.defaultFiscalAdmInput.value.trim(),
        fiscalAdmFunc: dom.defaultFiscalAdmFuncInput.value.trim(),
        conformador: dom.defaultConformadorInput.value.trim(),
        conformadorFunc: dom.defaultConformadorFuncInput.value.trim(),
        ordenador: dom.defaultOrdenadorInput.value.trim(),
        ordenadorFunc: dom.defaultOrdenadorFuncInput.value.trim()
    };
    const sucesso = await api.saveSettings(settingsObject);
    if (sucesso) {
        dom.configSaveSuccess.classList.remove('hidden');
        setTimeout(() => { dom.configSaveSuccess.classList.add('hidden') }, 3000);
    } else {
        alert('Falha ao salvar as configurações.');
    }
}

async function handleAdminFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (form.id === 'formAddPregao') {
        const numeroPregao = document.getElementById('adminPregaoId').value.trim();
        const objeto = document.getElementById('adminPregaoObjeto').value.trim();
        if (!numeroPregao || !objeto) return alert('Por favor, preencha todos os campos do pregão.');
        const { error } = await api.addPregao(numeroPregao, objeto);
        if (error) { alert('Falha ao adicionar o pregão. Erro: ' + error.message); }
        else { alert('Pregão adicionado com sucesso!'); form.reset(); ui.renderAdminView(); }
    } else if (form.classList.contains('formAddFornecedor')) {
        const nome = form.elements.nome.value.trim();
        const cnpj = form.elements.cnpj.value.trim();
        const pregaoId = form.dataset.pregaoId;
        if (!nome || !cnpj) return alert('Por favor, preencha todos os campos do fornecedor.');
        const { error } = await api.addFornecedor(nome, cnpj, pregaoId);
        if (error) { alert('Falha ao adicionar o fornecedor. Erro: ' + error.message); }
        else { alert('Fornecedor adicionado com sucesso!'); form.reset(); ui.renderAdminView(); }
    } else if (form.classList.contains('formAddItem')) {
        const fornecedorId = form.dataset.fornecedorId;
        const itemData = {
            fornecedor_id: fornecedorId,
            descricao: form.elements.descricao.value.trim(),
            marca: form.elements.marca.value.trim() || null,
            numero_item: form.elements.numeroItem.value.trim() || null,
            unidade: form.elements.unidade.value,
            quantidade_max: parseInt(form.elements.quantidadeMax.value, 10),
            valor: parseFloat(form.elements.valor.value)
        };
        if (!itemData.descricao || isNaN(itemData.quantidade_max) || isNaN(itemData.valor)) {
            return alert('Descrição, Quantidade e Valor são obrigatórios.');
        }
        const { error } = await api.addItem(itemData);
        if (error) { alert('Falha ao adicionar o item. Erro: ' + error.message); }
        else { alert('Item adicionado com sucesso!'); form.reset(); ui.renderAdminView(); }
    }
}

async function handleAdminClick(e) {
    const target = e.target;
    if (target.classList.contains('edit-pregao')) {
        const pregaoId = parseInt(target.dataset.pregaoId, 10);
        ui.openEditPregaoModal(pregaoId);
    } else if (target.classList.contains('delete-pregao')) {
        const pregaoId = target.dataset.pregaoId;
        if (confirm('Tem certeza que deseja excluir este pregão?')) {
            const sucesso = await api.deletePregao(pregaoId);
            if (sucesso) { alert('Pregão excluído!'); ui.renderAdminView(); }
            else { alert('Falha ao excluir o pregão.'); }
        }
    } else if (target.classList.contains('delete-fornecedor')) {
        const fornecedorId = target.dataset.fornecedorId;
        if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
            const sucesso = await api.deleteFornecedor(fornecedorId);
            if (sucesso) { alert('Fornecedor excluído!'); ui.renderAdminView(); }
            else { alert('Falha ao excluir o fornecedor.'); }
        }
    } else if (target.classList.contains('delete-item')) {
        const itemId = target.dataset.itemId;
        if (confirm('Tem certeza que deseja excluir este item?')) {
            const sucesso = await api.deleteItem(itemId);
            if (sucesso) { alert('Item excluído!'); ui.renderAdminView(); }
            else { alert('Falha ao excluir o item.'); }
        }
    }
}

async function handleEditPregaoSubmit(e) {
    e.preventDefault();
    const pregaoId = dom.editPregaoId.value;
    const updatedData = {
        numero_pregao: dom.editPregaoNumero.value.trim(),
        objeto: dom.editPregaoObjeto.value.trim()
    };
    const sucesso = await api.updatePregao(pregaoId, updatedData);
    if (sucesso) {
        alert('Pregão atualizado com sucesso!');
        ui.closeEditModal();
        await ui.renderAdminView();
    } else {
        alert('Falha ao atualizar o pregão.');
    }
}

function setupEventListeners() {
    dom.loginForm.addEventListener('submit', auth.handleLogin);
    dom.logoutButton.addEventListener('click', auth.handleLogout);
    dom.homeButton.addEventListener('click', ui.startNewRequisition);
    dom.btnNewRequisition.addEventListener('click', () => {
        ui.startNewRequisition();
        ui.navigateToStep(1); 
    });
    dom.tabRequisicao.addEventListener('click', () => ui.switchView('requisicao'));
    dom.tabGerenciar.addEventListener('click', () => ui.switchView('gerenciar'));
    dom.tabEmitidas.addEventListener('click', () => ui.switchView('emitidas'));
    dom.tabConfiguracoes.addEventListener('click', () => ui.switchView('configuracoes'));
    dom.tabBackup.addEventListener('click', () => ui.switchView('backup'));
    dom.btnStep1.addEventListener('click', handleStep1);
    dom.btnStep2.addEventListener('click', handleStep2);
    dom.btnStep3.addEventListener('click', handleStep3);
    dom.btnDownloadPDF.addEventListener('click', () => ui.handleDownloadHistoricPdf(state.getCurrentState()));
    
    // A LINHA PROBLEMÁTICA FOI REMOVIDA DAQUI:
    // dom.btnSave.addEventListener('click', ui.saveRequisition); 

    dom.btnNewRequisition.addEventListener('click', ui.startNewRequisition);
    dom.pregaoInput.addEventListener('input', () => dom.errorStep1.classList.add('hidden'));
    document.getElementById('backToStep1').addEventListener('click', () => ui.navigateToStep(1));
    document.getElementById('backToStep2').addEventListener('click', () => ui.navigateToStep(2));
    document.getElementById('backToStep3').addEventListener('click', () => {
        dom.finalActions.classList.remove('hidden');
        dom.startNewAction.classList.add('hidden');
        ui.navigateToStep(3);
    });
    dom.fornecedoresList.addEventListener('click', (e) => {
        const targetDiv = e.target.closest('div.p-4');
        if (!targetDiv) return;
        const radio = targetDiv.querySelector('input[name="fornecedor"]');
        if (radio) {
            if (!radio.checked) radio.checked = true;
            state.updateCurrentState({ fornecedorId: radio.value });
            dom.btnStep2.disabled = false;
            dom.errorStep2.classList.add('hidden');
        }
    });
    dom.itemsTableBody.addEventListener('change', (e) => {
        const target = e.target;
        const itemId = target.dataset.itemId;
        const currentState = state.getCurrentState();
        if (target.classList.contains('item-checkbox')) {
            const quantityInput = dom.itemsTableBody.querySelector(`.item-quantity[data-item-id="${itemId}"]`);
            if (target.checked) {
                quantityInput.disabled = false;
                quantityInput.value = 1;
                currentState.selectedItems[itemId] = 1;
            } else {
                quantityInput.disabled = true;
                quantityInput.value = '';
                delete currentState.selectedItems[itemId];
            }
        }
        if (target.classList.contains('item-quantity')) {
            const quantity = parseInt(target.value, 10);
            const max = parseInt(target.max, 10);
            if (quantity > max) { target.value = max; currentState.selectedItems[itemId] = max; }
            else if (quantity >= 0) { currentState.selectedItems[itemId] = quantity; }
            else { target.value = 0; currentState.selectedItems[itemId] = 0; }
        }
        state.updateCurrentState({ selectedItems: currentState.selectedItems });
        ui.updateTotal();
    });
    dom.adminPregoesContainer.addEventListener('submit', handleAdminFormSubmit);
    dom.adminPregoesContainer.addEventListener('click', handleAdminClick);
    dom.formAddPregao.addEventListener('submit', handleAdminFormSubmit);
    dom.formAddUser.addEventListener('submit', auth.handleAddUser);
    dom.usersList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-user')) {
            auth.handleDeleteUser(e.target.dataset.username);
        }
    });
    dom.formConfiguracoes.addEventListener('submit', handleSaveConfig);
    dom.formEditPregao.addEventListener('submit', handleEditPregaoSubmit);
    dom.btnCancelEdit.addEventListener('click', ui.closeEditModal);
}

async function initializeApp() {
    setupEventListeners();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        console.log("Sessão de usuário encontrada!", session.user);
        state.setLoggedInUser({
            id: session.user.id,
            email: session.user.email,
            role: 'admin',
            username: session.user.email.split('@')[0]
        });
        const [dbData, ultimoNumero, settingsData] = await Promise.all([
            api.loadInitialData(),
            api.getLatestRequisitionNumber(),
            api.getSettings()
        ]);
        const proximoNumeroRequisicao = ultimoNumero + 1;
        state.setInitialData({
            database: dbData,
            requisicoesSalvas: [],
            proximoNumeroRequisicao: proximoNumeroRequisicao,
            users: [],
            configuracoes: settingsData
        });
        dom.loginView.classList.add('hidden');
        dom.appContainer.classList.remove('hidden');
        ui.setupUIForUser();
    } else {
        console.log("Nenhuma sessão encontrada. Mostrando tela de login.");
        dom.loginView.classList.remove('hidden');
        dom.appContainer.classList.add('hidden');
    }
}

// ESTE É O LISTENER CORRETO E ÚNICO QUE DEVE EXISTIR PARA O BOTÃO SALVAR
// NOVO BLOCO PARA SUBSTITUIR O ANTIGO
dom.btnSave.addEventListener('click', async () => {
    dom.btnSave.disabled = true;
    dom.btnSave.textContent = 'A salvar...';

    // A função saveRequisition agora cuida da atualização da UI e do estado local.
    const { error } = await ui.saveRequisition();

    // A UI já foi atualizada de forma otimista.
    // Não precisamos mais recarregar todos os dados com api.loadInitialData().

    if (error) {
        // O erro já é tratado dentro de saveRequisition, mas podemos reativar o botão aqui.
        dom.btnSave.disabled = false;
        dom.btnSave.textContent = 'Salvar e Concluir';
    }
    // Se for sucesso, o botão já está escondido, então não fazemos nada.
});

// ESTE É O LISTENER CORRETO PARA A LISTA DE REQUISIÇÕES
// NOVO BLOCO PARA SUBSTITUIR O ANTIGO
dom.listRequisicoesEmitidas.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('download-historic-pdf')) {
        const requisitionId = target.dataset.requisitionId;
        const requisicoes = await api.getSavedRequisitions();
        const reqData = requisicoes.find(r => r.id == requisitionId);
        if (reqData) { ui.handleDownloadHistoricPdf(reqData.dados_completos); }
        else { alert('Não foi possível encontrar os dados da requisição.'); }
    } else if (target.classList.contains('delete-requisition')) {
        const requisitionId = target.dataset.requisitionId;
        if (confirm('Tem certeza que deseja excluir esta requisição? O saldo dos itens será restaurado.')) {
            
            // Desativa o botão para evitar cliques duplos
            target.disabled = true;
            target.textContent = "Excluindo...";

            const sucesso = await api.deleteRequisition(requisitionId);
            
            if (sucesso) {
                alert('Requisição excluída e saldos restaurados com sucesso!');
                
                // Em vez de recarregar tudo, podemos apenas remover a linha da tabela.
                // Mas recarregar aqui é menos custoso, pois o usuário não está com pressa.
                // Para manter a consistência, vamos recarregar os dados aqui.
                const databaseAtualizado = await api.loadInitialData();
                state.setDatabase(databaseAtualizado);
                ui.renderRequisicoesEmitidas(); // Redesenha a lista
            }
            else { 
                alert('Falha ao excluir a requisição. Verifique o console para mais detalhes.'); 
                target.disabled = false; // Reativa o botão em caso de falha
                target.textContent = "Excluir";
            }
        }
    }
});


initializeApp();
