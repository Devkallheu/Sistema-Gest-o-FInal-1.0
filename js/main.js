// js/main.js - VERSÃO FINAL COMPLETA E CORRIGIDA

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
       // CÓDIGO NOVO em main.js
if (error) {
    // Verifica se a mensagem de erro é sobre chave duplicada
    if (error.message.includes('duplicate key value violates unique constraint')) {
        alert('Esse pregão já está cadastrado, por favor, confirme o número correto da contratação e tente novamente.');
    } else {
        // Para qualquer outro erro, mostra a mensagem técnica
        alert('Falha ao adicionar o pregão. Erro: ' + error.message);
    }
} else {
    alert('Pregão adicionado com sucesso!');
    form.reset();
    ui.renderAdminView();
}

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
    const addListener = (element, event, handler) => {
        if (element) {
            element.addEventListener(event, handler);
        }
    };

    addListener(dom.loginForm, 'submit', auth.handleLogin);
    addListener(dom.logoutButton, 'click', auth.handleLogout);
    addListener(dom.homeButton, 'click', ui.startNewRequisition);
    addListener(dom.btnNewRequisition, 'click', () => { ui.startNewRequisition(); ui.navigateToStep(1); });
    addListener(dom.tabRequisicao, 'click', () => ui.switchView('requisicao'));
    addListener(dom.tabGerenciar, 'click', () => ui.switchView('gerenciar'));
    addListener(dom.tabEmitidas, 'click', () => ui.switchView('emitidas'));
    addListener(dom.tabConfiguracoes, 'click', () => ui.switchView('configuracoes'));
    addListener(dom.tabBackup, 'click', () => ui.switchView('backup'));
    addListener(dom.btnStep1, 'click', handleStep1);
    addListener(dom.btnStep2, 'click', handleStep2);
    addListener(dom.btnStep3, 'click', handleStep3);
    addListener(dom.btnDownloadPDF, 'click', () => ui.handleDownloadHistoricPdf(state.getCurrentState()));
    addListener(dom.btnSave, 'click', async () => {
        dom.btnSave.disabled = true;
        await ui.saveRequisition();
    });
    addListener(dom.pregaoInput, 'input', () => dom.errorStep1.classList.add('hidden'));
    addListener(document.getElementById('backToStep1'), 'click', () => ui.navigateToStep(1));
    addListener(document.getElementById('backToStep2'), 'click', () => ui.navigateToStep(2));
    addListener(document.getElementById('backToStep3'), 'click', () => {
        dom.finalActions.classList.remove('hidden');
        dom.startNewAction.classList.add('hidden');
        ui.navigateToStep(3);
    });
    addListener(dom.fornecedoresList, 'click', (e) => {
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
    addListener(dom.itemsTableBody, 'change', (e) => {
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
    addListener(dom.listRequisicoesEmitidas, 'click', async (e) => {
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
                target.disabled = true;
                target.textContent = "Excluindo...";
                const sucesso = await api.deleteRequisition(requisitionId);
                if (sucesso) {
                    alert('Requisição excluída e saldos restaurados com sucesso!');
                    const databaseAtualizado = await api.loadInitialData();
                    state.setDatabase(databaseAtualizado);
                    ui.renderRequisicoesEmitidas();
                } else {
                    alert('Falha ao excluir a requisição.');
                    target.disabled = false;
                    target.textContent = "Excluir";
                }
            }
        }
    });
    addListener(dom.adminPregoesContainer, 'submit', handleAdminFormSubmit);
    addListener(dom.adminPregoesContainer, 'click', handleAdminClick);
    addListener(dom.formAddPregao, 'submit', handleAdminFormSubmit);
    addListener(dom.formConfiguracoes, 'submit', handleSaveConfig);
    addListener(dom.formEditPregao, 'submit', handleEditPregaoSubmit);
    addListener(dom.btnCancelEdit, 'click', ui.closeEditModal);
}

async function initializeApp() {
    setupEventListeners();

    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
        console.error("ERRO CRÍTICO no Passo 1: Não foi possível obter a sessão.", sessionError);
        return;
    }

    if (!session) {
        dom.loginView.classList.remove('hidden');
        dom.appContainer.classList.add('hidden');
        return;
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profileError) {
        console.error("ERRO no Passo 2: A consulta à tabela 'profiles' falhou.", profileError.message);
    }

    let finalRole = 'requisitante';
    if (profile && profile.role) {
        finalRole = profile.role;
    }

    state.setLoggedInUser({
        id: session.user.id,
        email: session.user.email,
        role: finalRole,
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
}

document.addEventListener('DOMContentLoaded', () => {
    dom.initializeDomElements();
    initializeApp();
});