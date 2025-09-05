// js/ui.js - VERSÃO FINAL COM INICIALIZAÇÃO AUTOMÁTICA
import * as notify from './notifications.js';
import * as dom from './dom.js';
import * as state from './state.js';
import * as api from './api.js';
import { generatePDF } from './pdfGenerator.js';

export function setupUIForUser() {
    const user = state.getLoggedInUser();
    if (!user) return;

    const userRole = user.role ? user.role.trim().toLowerCase() : 'requisitante';
    const isAdmin = userRole === 'admin';

    dom.welcomeMessage.textContent = `Bem-vindo(a), ${user.username}! (Nível: ${user.role})`;

    if (isAdmin) {
        dom.tabGerenciar.style.display = 'block';
        dom.tabConfiguracoes.style.display = 'block';
        dom.tabBackup.style.display = 'block';
    } else {
        dom.tabGerenciar.style.display = 'none';
        dom.tabConfiguracoes.style.display = 'none';
        dom.tabBackup.style.display = 'none';
    }

    switchView('requisicao');

    // ALTERAÇÃO ADICIONADA AQUI: Inicia uma nova requisição automaticamente
    startNewRequisition();
}

export function switchView(viewName) {
    const views = ['requisicao', 'emitidas', 'gerenciar', 'configuracoes', 'backup'];

    views.forEach(v => {
        const viewId = `view${v.charAt(0).toUpperCase() + v.slice(1)}`;
        const tabId = `tab${v.charAt(0).toUpperCase() + v.slice(1)}`;
        const viewEl = document.getElementById(viewId);
        const tabEl = document.getElementById(tabId);
        if (viewEl) viewEl.classList.add('hidden');
        if (tabEl) tabEl.classList.remove('active');
    });

    const viewToShowId = `view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`;
    const tabToActivateId = `tab${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`;
    const viewToShow = document.getElementById(viewToShowId);
    const tabToActivate = document.getElementById(tabToActivateId);

    if (viewToShow) {
        viewToShow.classList.remove('hidden');
    }
    if (tabToActivate) {
        tabToActivate.classList.add('active');
    }

    if (viewName === 'gerenciar') {
        renderAdminView();
    }
    if (viewName === 'emitidas') {
        renderRequisicoesEmitidas();
    }
    if (viewName === 'configuracoes') {
        loadConfiguracoesView();
    }
}

export function navigateToStep(stepNumber) {
    Object.values(dom.steps).forEach(stepEl => stepEl.classList.add('hidden'));
    if (dom.steps[stepNumber]) {
        dom.steps[stepNumber].classList.remove('hidden');
    }
    state.updateCurrentState({ step: stepNumber });
}

export function startNewRequisition() {
    state.resetCurrentState();
    const config = state.getConfiguracoes();

    const anexosPadrao = 'Nota de crédito, SICAFi, CADINe Certidão do TCU consolidada em dias.';
    const justificativaPadrao = `1.1. Nos termos do contido no Art. 13 da Port. Min N° 305, de 24 Mai 95 - Instruções Gerais para realização de Licitações no Comando do Exército (IG 12-02) solicito providências junto ao Ordenador de Despesas, no sentido de aprovar a requisição do material/serviço.\n1.2. A requisição está alinhada com Objetivo Estratégico Organizacional OE 05, Meta 5.2.1. Aprimorar a gestão de recursos no Cmdo Fron AC/ 4 BIS, Ação 5.2.1.2 do Plano de Gestão do Cmdo Fron AC/4 BIS no que diz respeito à provisão, manutenção e reversão dos meios e serviços necessários à execução das diversas funções. Deste modo, solicito que seja autorizado a aquisição do material de consumo especificado:`;

    dom.pregaoInput.value = '';
    dom.setorInput.value = '';
    dom.nupInput.value = '';
    dom.responsavelInput.value = '';
    dom.identidadeInput.value = '';
    dom.destinoInput.value = '';
    dom.contatoInput.value = '';
    dom.emailInput.value = '';
    dom.anexosInput.value = anexosPadrao;
    dom.justificativaInput.value = justificativaPadrao;
    dom.notaCreditoInput.value = '';
    dom.planoInternoInput.value = '';
    dom.ptresInput.value = '';
    document.querySelector('input[name="tipoEmpenho"][value="Ordinário"]').checked = true;
    dom.fiscalAdmInput.value = config.fiscalAdm || '';
    dom.fiscalAdmFuncInput.value = config.fiscalAdmFunc || '';
    dom.conformadorInput.value = config.conformador || '';
    dom.conformadorFuncInput.value = config.conformadorFunc || '';
    dom.ordenadorInput.value = config.ordenador || '';
    dom.ordenadorFuncInput.value = config.ordenadorFunc || '';

    state.updateCurrentState({
        anexos: anexosPadrao,
        justificativa: justificativaPadrao,
        fiscalAdm: config.fiscalAdm || '',
        fiscalAdmFunc: config.fiscalAdmFunc || '',
        conformador: config.conformador || '',
        conformadorFunc: config.conformadorFunc || '',
        ordenador: config.ordenador || '',
        ordenadorFunc: config.ordenadorFunc || ''
    });

    navigateToStep(1);
    populatePregoesDropdown();
}

// Em ui.js, substitua a função renderFornecedores inteira por esta:

export function renderFornecedores(searchTerm = '') {
    dom.fornecedoresList.innerHTML = '';
    dom.errorStep2.classList.add('hidden');
    dom.btnStep2.disabled = true;

    const currentState = state.getCurrentState();
    const pregao = currentState.pregaoData;
    dom.pregaoInfo.textContent = `Pregão ${currentState.pregaoId}: ${pregao.objeto}`;

    const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();

    // Filtra a lista de fornecedores com base no termo de busca
    const fornecedoresFiltrados = pregao.fornecedores.filter(fornecedor => {
        const nome = fornecedor.nome.toLowerCase();
        // Limpa o CNPJ para buscar apenas por números
        const cnpj = fornecedor.cnpj.replace(/[^\d]/g, ''); 
        const termoBuscaLimpo = lowerCaseSearchTerm.replace(/[^\d]/g, '');

        // Retorna verdadeiro se o nome OU o CNPJ incluírem o termo buscado
        return nome.includes(lowerCaseSearchTerm) || (termoBuscaLimpo && cnpj.includes(termoBuscaLimpo));
    });

    if (fornecedoresFiltrados.length === 0) {
        dom.fornecedoresList.innerHTML = '<p class="text-gray-500 text-center">Nenhum fornecedor encontrado.</p>';
    } else {
        fornecedoresFiltrados.forEach(fornecedor => {
            const div = document.createElement('div');
            div.className = 'p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition';
            div.innerHTML = `<label class="flex items-center space-x-3"><input type="radio" name="fornecedor" value="${fornecedor.id}" class="form-radio h-5 w-5 text-blue-600"><div><p class="font-semibold text-gray-800">${fornecedor.nome}</p><p class="text-sm text-gray-500">CNPJ: ${fornecedor.cnpj}</p></div></label>`;
            dom.fornecedoresList.appendChild(div);
        });
    }
}

export function renderItens() {
    dom.itemsTableBody.innerHTML = '';
    dom.errorStep3.classList.add('hidden');
    const currentState = state.getCurrentState();
    state.updateCurrentState({ selectedItems: {} });
    updateTotal();
    const fornecedor = currentState.fornecedorData;
    dom.fornecedorInfo.innerHTML = `Fornecedor: <span class="font-semibold">${fornecedor.nome}</span>`;
    fornecedor.itens.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = item.quantidadeMax <= 0 ? 'opacity-50' : '';
        tr.innerHTML = `<td class="px-2 py-4 whitespace-nowrap text-center"><input type="checkbox" data-item-id="${item.id}" class="item-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" ${item.quantidadeMax <= 0 ? 'disabled' : ''}></td><td class="px-6 py-4 whitespace-normal"><div class="text-sm font-medium text-gray-900">${item.descricao}</div>${item.numeroItem ? `<div class="text-xs text-gray-500">Nº do Item: ${item.numeroItem}</div>` : ''}${item.marca ? `<div class="text-xs text-gray-500">Marca: ${item.marca}</div>` : ''}<div class="text-xs text-gray-500">Unidade: ${item.unidade}</div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">R$ ${item.valor.toFixed(2).replace('.', ',')}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">${item.quantidadeMax}</td><td class="px-6 py-4 whitespace-nowrap"><input type="number" data-item-id="${item.id}" min="0" max="${item.quantidadeMax}" class="item-quantity w-24 px-2 py-1 border border-gray-300 rounded-md" disabled></td>`;
        dom.itemsTableBody.appendChild(tr);
    });
}

export function updateTotal() {
    let total = 0;
    const currentState = state.getCurrentState();
    const fornecedor = currentState.fornecedorData;
    if (!fornecedor) return;
    for (const itemId in currentState.selectedItems) {
        const quantidade = currentState.selectedItems[itemId];
        const itemData = fornecedor.itens.find(i => i.id === itemId);
        if (itemData && quantidade > 0) {
            total += itemData.valor * quantidade;
        }
    }
    dom.totalValueEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    dom.btnStep3.disabled = total <= 0;
}

export function renderPreview() {
    const currentState = state.getCurrentState();
    const numeroRequisicaoAtual = state.getProximoNumeroRequisicao();
    state.updateCurrentState({ numeroRequisicaoAtual });
    dom.previewNumRequisicao.textContent = String(numeroRequisicaoAtual).padStart(4, '0');
    dom.previewSetor.textContent = currentState.setorRequisitante;
    dom.previewPregao.textContent = currentState.pregaoId;
    dom.previewFornecedor.textContent = currentState.fornecedorData.nome;
    dom.previewValor.textContent = dom.totalValueEl.textContent;
    dom.previewJustificativa.textContent = currentState.justificativa;
    dom.finalActions.classList.remove('hidden');
    dom.startNewAction.classList.add('hidden');
    dom.saveSuccess.classList.add('hidden');
    dom.btnSave.disabled = false;
}

export async function saveRequisition() {
    const currentState = state.getCurrentState();
    const loggedInUser = state.getLoggedInUser();
    const requisicao = {
        pregaoId: currentState.pregaoId,
        fornecedorData: currentState.fornecedorData,
        selectedItems: currentState.selectedItems,
        nup: currentState.nup,
        setorRequisitante: currentState.setorRequisitante,
        responsavel: currentState.responsavel,
        identidade: currentState.identidade,
        destino: currentState.destino,
        contato: currentState.contato,
        email: currentState.email,
        anexos: currentState.anexos,
        justificativa: currentState.justificativa,
        notaCredito: currentState.notaCredito,
        planoInterno: currentState.planoInterno,
        ptres: currentState.ptres,
        tipoEmpenho: currentState.tipoEmpenho,
        fiscalAdm: currentState.fiscalAdm,
        fiscalAdmFunc: currentState.fiscalAdmFunc,
        conformador: currentState.conformador,
        conformadorFunc: currentState.conformadorFunc,
        ordenador: currentState.ordenador,
        ordenadorFunc: currentState.ordenadorFunc,
        numero: state.getProximoNumeroRequisicao(),
        data: new Date().toISOString(),
        valorTotal: parseFloat(dom.totalValueEl.textContent.replace('R$ ', '').replace('.', ',')),
        createdBy: loggedInUser.username
    };
    try {
        const db = state.getDB();
        for (const itemId in requisicao.selectedItems) {
            const quantidadeRequisitada = requisicao.selectedItems[itemId];
            const itemNoBanco = db[requisicao.pregaoId]?.fornecedores.find(f => f.id === requisicao.fornecedorData.id)?.itens.find(i => i.id === itemId);
            if (itemNoBanco) {
                itemNoBanco.quantidadeMax -= quantidadeRequisitada;
            }
        }
        state.setDatabase(db);
        state.incrementProximoNumeroRequisicao();
        dom.saveSuccess.classList.remove('hidden');
        dom.finalActions.classList.add('hidden');
        dom.startNewAction.classList.remove('hidden');
    } catch (e) {
        console.error("Erro ao atualizar o estado local:", e);
        return { data: null, error: e };
    }
    const { data, error } = await api.saveNewRequisition(requisicao);
    if (error) {
    notify.showError('Erro de Sincronização', 'A requisição foi salva localmente, mas falhou ao enviar ao servidor. Verifique sua conexão e os dados. Erro: ' + error.message);
}
    return { data, error };
}

// Em ui.js, substitua a função inteira por esta:

export async function renderRequisicoesEmitidas() {
    const loggedInUser = state.getLoggedInUser();
    dom.listRequisicoesEmitidas.innerHTML = '<div class="flex justify-center items-center p-4"><div class="loader"></div></div>';
    
    const requisicoesSalvas = await api.getSavedRequisitions();
    
    // 1. A lógica para decidir QUAIS requisições mostrar continua a mesma:
    const isAdmin = loggedInUser.role === 'admin';
    let reqsToShow = isAdmin ? requisicoesSalvas : requisicoesSalvas.filter(req => req.criado_por_id === loggedInUser.id);

    if (reqsToShow.length === 0) {
        dom.listRequisicoesEmitidas.innerHTML = `<p class="text-gray-500">Nenhuma requisição foi emitida.</p>`;
        return;
    }

    let tableHTML = `<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Req.</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
    
    reqsToShow.forEach(req => {
        const reqData = req.dados_completos;
        
        // 2. NOVA LÓGICA: Decide se o botão "Excluir" deve aparecer
        const canDelete = isAdmin || loggedInUser.id === req.criado_por_id;

        tableHTML += `<tr>
            <td class="px-4 py-4 text-sm font-bold text-gray-800">${String(reqData.numero).padStart(4, '0')}</td>
            <td class="px-4 py-4 text-sm text-gray-600">${new Date(reqData.data).toLocaleDateString('pt-BR')}</td>
            <td class="px-4 py-4 text-sm text-gray-600">${reqData.setorRequisitante}</td>
            <td class="px-4 py-4 text-sm font-semibold text-gray-800">R$ ${reqData.valorTotal.toFixed(2).replace('.', ',')}</td>
            <td class="px-4 py-4 text-sm">
                <button class="download-historic-pdf text-blue-600 hover:text-blue-800" 
                        data-requisition-id="${req.id}">
                  Baixar PDF
                </button>
                ${canDelete ? // Se 'canDelete' for verdadeiro, mostra o botão Excluir
                  `<button class="delete-requisition text-red-500 hover:text-red-700 ml-4 font-semibold" 
                           data-requisition-id="${req.id}">
                     Excluir
                   </button>` 
                  : '' // Se não, não mostra nada
                }
            </td>
        </tr>`;
    });
    
    tableHTML += `</tbody></table>`;
    dom.listRequisicoesEmitidas.innerHTML = tableHTML;
}

export function handleDownloadHistoricPdf(requisicaoCompleta) {
    if (requisicaoCompleta) {
        try {
            generatePDF(requisicaoCompleta);
        } catch (error) {
    console.error("Erro PDF:", error);
    notify.showError('Erro ao Gerar PDF', 'Houve um problema ao tentar criar o documento.');
}
    }
}

async function loadConfiguracoesView() {
    const config = await api.getSettings();
    dom.defaultFiscalAdmInput.value = config.fiscalAdm || '';
    dom.defaultFiscalAdmFuncInput.value = config.fiscalAdmFunc || '';
    dom.defaultConformadorInput.value = config.conformador || '';
    dom.defaultConformadorFuncInput.value = config.conformadorFunc || '';
    dom.defaultOrdenadorInput.value = config.ordenador || '';
    dom.defaultOrdenadorFuncInput.value = config.ordenadorFunc || '';
}

export async function renderAdminView() {
    await renderAdminPregoes();
    if (state.getLoggedInUser()?.role === 'admin') {
        await renderUserManagementView();
    }
}

async function renderAdminPregoes() {
    const container = dom.adminPregoesContainer;
    container.innerHTML = '<div class="flex justify-center items-center p-4"><div class="loader"></div></div>';
    const database = await api.loadInitialData();
    state.setDatabase(database);
    const pregoesIds = Object.keys(database);
    container.innerHTML = '';
    if (pregoesIds.length === 0) {
        container.innerHTML = `<p class="text-gray-500">Nenhum pregão cadastrado.</p>`;
        return;
    }
    pregoesIds.forEach(pregaoNumero => {
        const pregaoData = database[pregaoNumero];
        const pregaoId = pregaoData.id;
        const pregaoContainer = document.createElement('div');
        pregaoContainer.className = 'p-4 border border-gray-200 rounded-lg';
        const fornecedoresHtml = pregaoData.fornecedores.map(fornecedor => {
            const fornecedorIdNumerico = fornecedor.id_numerico;
            const itensHtml = fornecedor.itens.map(item => `<tr class="border-b last:border-b-0"><td class="py-2 pr-2"><div class="font-medium text-gray-800">${item.descricao}</div><div class="text-xs text-gray-500">${item.numeroItem ? `<span>Cód. ${item.numeroItem}</span>` : ''}${item.marca ? `<span class="ml-2">Marca: ${item.marca}</span>` : ''}</div></td><td class="py-2 px-2 text-center"><button class="delete-item text-red-500 hover:text-red-700 font-bold" data-item-id="${item.id_numerico}">X</button></td></tr>`).join('');
            return `<div class="p-3 bg-gray-50 rounded-md border mt-2"><div class="flex justify-between items-start mb-2"><p class="font-semibold">${fornecedor.nome} <span class="font-normal text-gray-500 text-sm">- ${fornecedor.cnpj}</span></p><button class="delete-fornecedor text-red-500 hover:text-red-700 text-xs font-bold" data-fornecedor-id="${fornecedorIdNumerico}">EXCLUIR</button></div><div class="mt-2 text-sm"><table class="min-w-full"><thead><tr class="border-b"><th class="py-1 pr-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th><th class="py-1 px-2 text-center text-xs font-medium text-gray-500 uppercase">Ação</th></tr></thead><tbody>${itensHtml || '<tr><td colspan="2" class="py-2 text-center text-gray-500">Nenhum item.</td></tr>'}</tbody></table><form class="formAddItem grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-3 mt-2 border-t" data-fornecedor-id="${fornecedorIdNumerico}"><div class="lg:col-span-4"><label class="text-xs font-medium">Descrição</label><input type="text" name="descricao" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><div class="lg:col-span-2"><label class="text-xs font-medium">Marca</label><input type="text" name="marca" class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><div class="lg:col-span-2"><label class="text-xs font-medium">Nº do Item</label><input type="text" name="numeroItem" class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><div><label class="text-xs font-medium">Unidade</label><select name="unidade" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"><option>UN</option><option>KG</option><option>M</option><option>M²</option><option>M³</option></select></div><div><label class="text-xs font-medium">Qtd. Máx.</label><input type="number" name="quantidadeMax" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><div><label class="text-xs font-medium">Valor Unit.</label><input type="number" step="0.01" name="valor" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><div class="lg:col-span-4"><button type="submit" class="w-full bg-sky-600 text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-sky-700 mt-2">Adicionar Item</button></div></form></div></div>`;
        }).join('');
        pregaoContainer.innerHTML = `<div class="flex justify-between items-center mb-2"><div class="font-bold text-lg">${pregaoNumero}</div><div><button class="edit-pregao text-sm text-blue-500 hover:text-blue-700 font-semibold mr-4" data-pregao-id="${pregaoId}">Editar</button><button class="delete-pregao text-sm text-red-500 hover:text-red-700 font-semibold" data-pregao-id="${pregaoId}">Excluir Pregão</button></div></div><p class="text-gray-600 mb-4">${pregaoData.objeto}</p><div class="pl-4 border-l-2 border-gray-200 space-y-4"><h4 class="font-semibold text-md">Fornecedores</h4>${fornecedoresHtml || '<p class="text-sm text-gray-500">Nenhum fornecedor.</p>'}<form class="formAddFornecedor grid grid-cols-1 sm:grid-cols-3 gap-2 items-end pt-4 border-t" data-pregao-id="${pregaoId}"><div class="sm:col-span-1"><label class="text-xs font-medium">Nome do Fornecedor</label><input type="text" name="nome" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><div class="sm:col-span-1"><label class="text-xs font-medium">CNPJ</label><input type="text" name="cnpj" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div><button type="submit" class="w-full sm:w-auto justify-self-end bg-teal-600 text-white text-sm font-semibold px-4 py-1 rounded-md hover:bg-teal-700">Add Fornecedor</button></form></div>`;
        container.appendChild(pregaoContainer);
    });
}

export function closeEditModal() {
    dom.editModal.classList.add('hidden');
    dom.formEditPregao.reset();
}

export function openEditPregaoModal(pregaoId) {
    const db = state.getDB();
    let pregaoData;
    let pregaoNumero;
    for (const numero in db) {
        if (db[numero].id === pregaoId) {
            pregaoData = db[numero];
            pregaoNumero = numero;
            break;
        }
    }
    if (!pregaoData) {
    notify.showError('Erro', 'Pregão não encontrado para edição.');
    return;
    }
    dom.editPregaoId.value = pregaoId;
    dom.editPregaoNumero.value = pregaoNumero;
    dom.editPregaoObjeto.value = pregaoData.objeto;
    dom.editModal.classList.remove('hidden');
}

// NOVA FUNÇÃO PARA RENDERIZAR O GERENCIAMENTO DE USUÁRIOS
export async function renderUserManagementView() {
    const container = dom.userManagementSection;
    if (!container) return;

    // Limpa o formulário antigo e renderiza o novo
    container.innerHTML = `
        <h2 class="text-xl font-semibold mb-4">Gerenciar Usuários</h2>
        <div class="bg-gray-50 p-4 rounded-lg border mb-6">
            <h3 class="font-semibold mb-2">Adicionar Novo Usuário</h3>
            <form id="formAddNewUser" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><label for="newUserInputEmail" class="block text-sm font-medium">Email</label><input type="email" id="newUserInputEmail" required class="mt-1 w-full px-3 py-2 border rounded-md"></div>
                <div><label for="newUserInputPassword" class="block text-sm font-medium">Senha</label><input type="password" id="newUserInputPassword" required class="mt-1 w-full px-3 py-2 border rounded-md"></div>
                <div><label for="newUserInputRole" class="block text-sm font-medium">Papel</label><select id="newUserInputRole" required class="mt-1 w-full px-3 py-2 border rounded-md"><option value="requisitante">Requisitante</option><option value="admin">Admin</option></select></div>
                <div class="md:col-span-3"><button type="submit" class="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700">Adicionar Usuário</button></div>
            </form>
            <p id="addUserStatus" class="text-sm mt-2 font-medium"></p>
        </div>
        <div>
            <h3 class="font-semibold mb-2">Usuários Existentes</h3>
            <div id="usersListContainer" class="overflow-x-auto"><div class="flex justify-center p-4"><div class="loader"></div></div></div>
        </div>
    `;

    const usersListContainer = document.getElementById('usersListContainer');
    const { data: users, error } = await api.listUsers();

    if (error) {
        usersListContainer.innerHTML = `<p class="text-red-500">Erro ao carregar usuários: ${error.message}</p>`;
        return;
    }

    let tableHTML = `<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Login</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
    users.forEach(user => {
        const userRole = user.user_metadata?.role || 'requisitante';
        tableHTML += `<tr>
            <td class="px-4 py-4 text-sm font-medium text-gray-800">${user.email}</td>
            <td class="px-4 py-4 text-sm"><select class="user-role-select border rounded-md p-1 bg-white" data-user-id="${user.id}"><option value="requisitante" ${userRole === 'requisitante' ? 'selected' : ''}>Requisitante</option><option value="admin" ${userRole === 'admin' ? 'selected' : ''}>Admin</option></select></td>
            <td class="px-4 py-4 text-sm text-gray-600">${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}</td>
        </tr>`;
    });
    tableHTML += `</tbody></table>`;
    usersListContainer.innerHTML = tableHTML;
}

// Em ui.js, substitua a função inteira por esta versão corrigida

export function populatePregoesDropdown() {
    const selectEl = dom.pregaoInput;
    const database = state.getDB();
    const pregoesIds = Object.keys(database);

    // =================================================================
    // ========= ALTERAÇÃO ADICIONADA AQUI PARA ORDENAR A LISTA =========
    // =================================================================
    pregoesIds.sort();
    // =================================================================

    // Limpa opções antigas
    selectEl.innerHTML = '';

    // Adiciona a primeira opção padrão
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um pregão...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectEl.appendChild(defaultOption);

    // Adiciona cada pregão como uma nova opção (agora de forma ordenada)
    pregoesIds.forEach(pregaoNumero => {
        const pregaoData = database[pregaoNumero];
        const option = document.createElement('option');
        option.value = pregaoNumero;
        option.textContent = `${pregaoNumero} - ${pregaoData.objeto}`;
        selectEl.appendChild(option);
    });
}
// Adicione no final do ficheiro ui.js

/**
 * Ativa o estado de carregamento de um botão.
 * @param {HTMLButtonElement} button O elemento do botão a ser modificado.
 * @param {string} loadingText O texto a ser exibido durante o carregamento (ex: "Salvando...").
 */
export function showButtonLoading(button, loadingText = 'Aguarde...') {
  // Salva o conteúdo original do botão para poder restaurá-lo depois.
  button.dataset.originalContent = button.innerHTML;
  
  // Desativa o botão.
  button.disabled = true;
  
  // Define o novo conteúdo com o spinner e o texto de carregamento.
  button.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
}

/**
 * Restaura um botão ao seu estado original após o carregamento.
 * @param {HTMLButtonElement} button O elemento do botão a ser restaurado.
 */
export function hideButtonLoading(button) {
  // Verifica se havia conteúdo original salvo.
  if (button.dataset.originalContent) {
    button.innerHTML = button.dataset.originalContent;
  }
  
  // Reativa o botão.
  button.disabled = false;
}