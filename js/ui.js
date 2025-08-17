// js/ui.js - VERSÃO COMPLETA E FINAL

import * as dom from './dom.js';
import * as state from './state.js';
import * as api from './api.js';
import { renderUsersList } from './auth.js';
import { generatePDF } from './pdfGenerator.js';

export function setupUIForUser() {
    const user = state.getLoggedInUser();
    if (!user) return;
    dom.welcomeMessage.textContent = `Bem-vindo(a), ${user.username}! (Nível: ${user.role})`;
    const isAdmin = user.role === 'admin';
    dom.tabGerenciar.style.display = isAdmin ? 'block' : 'none';
    dom.tabConfiguracoes.style.display = isAdmin ? 'block' : 'none';
    dom.tabBackup.style.display = isAdmin ? 'block' : 'none';
    dom.userManagementSection.style.display = isAdmin ? 'block' : 'none';
    startNewRequisition();
}

export function switchView(viewName) {
    Object.values(dom).forEach(element => {
        if (element && element.id && element.id.startsWith('view')) {
            element.classList.add('hidden');
        }
    });
    [dom.tabRequisicao, dom.tabGerenciar, dom.tabEmitidas, dom.tabConfiguracoes, dom.tabBackup].forEach(tab => tab.classList.remove('active'));
    switch (viewName) {
        case 'requisicao':
            dom.viewRequisicao.classList.remove('hidden');
            dom.tabRequisicao.classList.add('active');
            break;
        case 'gerenciar':
            dom.viewGerenciar.classList.remove('hidden');
            dom.tabGerenciar.classList.add('active');
            renderAdminView();
            break;
        case 'emitidas':
            dom.viewEmitidas.classList.remove('hidden');
            dom.tabEmitidas.classList.add('active');
            renderRequisicoesEmitidas();
            break;
        case 'configuracoes':
            dom.viewConfiguracoes.classList.remove('hidden');
            dom.tabConfiguracoes.classList.add('active');
            loadConfiguracoesView();
            break;
        case 'backup':
            dom.viewBackup.classList.remove('hidden');
            dom.tabBackup.classList.add('active');
            break;
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
    if(!config) return; 
    dom.pregaoInput.value = '';
    dom.setorInput.value = '';
    dom.nupInput.value = '';
    dom.responsavelInput.value = '';
    dom.identidadeInput.value = '';
    dom.destinoInput.value = '';
    dom.contatoInput.value = '';
    dom.emailInput.value = '';
    dom.anexosInput.value = 'Nota de crédito, SICAFi, CADINe Certidão do TCU consolidada em dias.';
    // SUBSTITUA A DEFINIÇÃO ANTIGA DA VARIÁVEL POR ESTA:
    const justificativaPadrao = `1.1. Nos termos do contido no Art. 13 da Port. Min N° 305, de 24 Mai 95 - Instruções Gerais para realização
de Licitações no Comando do Exército (IG 12-02) solicito providências junto ao Ordenador de Despesas, no sentido de aprovar a requisição do material/serviço.
1.2. A requisição está alinhada com Objetivo Estratégico Organizacional OE 05, Meta 5.2.1. Aprimorar a gestão de recursos no Cmdo Fron AC/ 4 BIS, Ação 5.2.1.2 do Plano de Gestão do Cmdo Fron AC/4 BIS no 
que diz respeito à provisão, manutenção e reversão dos meios e serviços necessários à execução das diversas funções. Deste modo, solicito que seja autorizado a aquisição do material de consumo especificado:`;
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
    switchView('requisicao');
}

export function renderFornecedores() {
    dom.fornecedoresList.innerHTML = '';
    dom.errorStep2.classList.add('hidden');
    dom.btnStep2.disabled = true;
    const currentState = state.getCurrentState();
    const pregao = currentState.pregaoData;
    dom.pregaoInfo.textContent = `Pregão ${currentState.pregaoId}: ${pregao.objeto}`;
    pregao.fornecedores.forEach(fornecedor => {
        const div = document.createElement('div');
        div.className = 'p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition';
        div.innerHTML = `<label class="flex items-center space-x-3"><input type="radio" name="fornecedor" value="${fornecedor.id}" class="form-radio h-5 w-5 text-blue-600"><div><p class="font-semibold text-gray-800">${fornecedor.nome}</p><p class="text-sm text-gray-500">CNPJ: ${fornecedor.cnpj}</p></div></label>`;
        dom.fornecedoresList.appendChild(div);
    });
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
        tr.innerHTML = `<td class="px-2 py-4 whitespace-nowrap text-center"><input type="checkbox" data-item-id="${item.id}" class="item-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" ${item.quantidadeMax <= 0 ? 'disabled' : ''}></td>
                        <td class="px-6 py-4 whitespace-normal">
                            <div class="text-sm font-medium text-gray-900">${item.descricao}</div>
                            ${item.numeroItem ? `<div class="text-xs text-gray-500">Nº do Item: ${item.numeroItem}</div>` : ''}
                            ${item.marca ? `<div class="text-xs text-gray-500">Marca: ${item.marca}</div>` : ''}
                            <div class="text-xs text-gray-500">Unidade: ${item.unidade}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">${item.quantidadeMax}</td>
                        <td class="px-6 py-4 whitespace-nowrap"><input type="number" data-item-id="${item.id}" min="0" max="${item.quantidadeMax}" class="item-quantity w-24 px-2 py-1 border border-gray-300 rounded-md" disabled></td>`;
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
    dom.finalActions.classList.remove('hidden');
    dom.startNewAction.classList.add('hidden');
    dom.saveSuccess.classList.add('hidden');
    dom.btnSave.disabled = false;
    dom.btnSave.classList.remove('bg-gray-400', 'hover:bg-gray-400');
    dom.btnSave.classList.add('bg-teal-600', 'hover:bg-teal-700');
    dom.previewFornecedor.textContent = currentState.fornecedorData.nome;
    dom.previewValor.textContent = dom.totalValueEl.textContent;

    // LINHA QUE VOCÊ PRECISA ADICIONAR
    dom.previewJustificativa.textContent = currentState.justificativa; 

    dom.finalActions.classList.remove('hidden');
}

// NOVO BLOCO PARA SUBSTITUIR O ANTIGO
export async function saveRequisition() {
    const currentState = state.getCurrentState();
    const loggedInUser = state.getLoggedInUser();

    // 1. Prepara os dados da requisição
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

    // 2. ATUALIZAÇÃO OTIMISTA: Modifica o estado local IMEDIATAMENTE
    try {
        const db = state.getDB();
        for (const itemId in requisicao.selectedItems) {
            const quantidadeRequisitada = requisicao.selectedItems[itemId];
            const itemNoBanco = db[requisicao.pregaoId]
                ?.fornecedores.find(f => f.id === requisicao.fornecedorData.id)
                ?.itens.find(i => i.id === itemId);

            if (itemNoBanco) {
                itemNoBanco.quantidadeMax -= quantidadeRequisitada;
            }
        }
        state.setDatabase(db); // Aplica as alterações ao estado
        state.incrementProximoNumeroRequisicao(); // Incrementa o número da requisição

        // Atualiza a UI para mostrar sucesso instantaneamente
        dom.saveSuccess.classList.remove('hidden');
        dom.finalActions.classList.add('hidden');
        dom.startNewAction.classList.remove('hidden');

    } catch (e) {
        console.error("Erro ao atualizar o estado local:", e);
        // Se a atualização local falhar, não prosseguimos.
        return { data: null, error: e };
    }

    // 3. Envia a requisição para o banco de dados em segundo plano
    const { data, error } = await api.saveNewRequisition(requisicao);

    if (error) {
        // Se a API falhar, precisamos avisar o usuário e talvez reverter o estado.
        // Por enquanto, um alerta é suficiente.
        alert('ATENÇÃO: A requisição foi exibida como salva, mas ocorreu um erro ao comunicar com o servidor. Por favor, recarregue a página e verifique os dados. Erro: ' + error.message);
        // Aqui, uma lógica de reversão mais complexa poderia ser implementada.
    }
    
    // Retorna o resultado da operação da API
    return { data, error };
}


export async function renderRequisicoesEmitidas() {
    const loggedInUser = state.getLoggedInUser();
    dom.listRequisicoesEmitidas.innerHTML = '<div class="flex justify-center items-center p-4"><div class="loader"></div></div>';
    const requisicoesSalvas = await api.getSavedRequisitions();
    let reqsToShow = requisicoesSalvas;
    if (loggedInUser.role !== 'admin' && loggedInUser.id) {
        reqsToShow = requisicoesSalvas.filter(req => req.criado_por_id === loggedInUser.id);
    }
    if (reqsToShow.length === 0) {
        dom.listRequisicoesEmitidas.innerHTML = `<p class="text-gray-500">Nenhuma requisição foi emitida.</p>`;
        return;
    }
    let tableHTML = `<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>
        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Req.</th>
        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
        </tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
    reqsToShow.forEach(req => {
        const reqData = req.dados_completos;
        tableHTML += `<tr>
                <td class="px-4 py-4 text-sm font-bold text-gray-800">${String(reqData.numero).padStart(4, '0')}</td>
                <td class="px-4 py-4 text-sm text-gray-600">${new Date(reqData.data).toLocaleDateString('pt-BR')}</td>
                <td class="px-4 py-4 text-sm text-gray-600">${reqData.setorRequisitante}</td>
                <td class="px-4 py-4 text-sm font-semibold text-gray-800">R$ ${reqData.valorTotal.toFixed(2).replace('.', ',')}</td>
                <td class="px-4 py-4 text-sm">
                    <button class="download-historic-pdf text-blue-600 hover:text-blue-800" data-requisition-id="${req.id}">Baixar PDF</button>
                    <button class="delete-requisition text-red-500 hover:text-red-700 ml-4 font-semibold" data-requisition-id="${req.id}">Excluir</button>
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
        }
        catch (error) {
            console.error("Erro PDF:", error);
            alert("Não foi possível gerar o PDF.");
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
        renderUsersList();
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
        container.innerHTML = `<p class="text-gray-500">Nenhum pregão cadastrado no banco de dados.</p>`;
        return;
    }
    pregoesIds.forEach(pregaoNumero => {
        const pregaoData = database[pregaoNumero];
        const pregaoId = pregaoData.id;
        const pregaoContainer = document.createElement('div');
        pregaoContainer.className = 'p-4 border border-gray-200 rounded-lg';
        const fornecedoresHtml = pregaoData.fornecedores.map(fornecedor => {
            const fornecedorIdNumerico = fornecedor.id_numerico;
            const itensHtml = fornecedor.itens.map(item => `
                <tr class="border-b last:border-b-0">
                    <td class="py-2 pr-2">
                        <div class="font-medium text-gray-800">${item.descricao}</div>
                        <div class="text-xs text-gray-500">
                            ${item.numeroItem ? `<span>Cód. ${item.numeroItem}</span>` : ''}
                            ${item.marca ? `<span class="ml-2">Marca: ${item.marca}</span>` : ''}
                        </div>
                    </td>
                    <td class="py-2 px-2 text-center">
                        <button class="delete-item text-red-500 hover:text-red-700 font-bold" data-item-id="${item.id_numerico}">X</button>
                    </td>
                </tr>
            `).join('');
            return `
            <div class="p-3 bg-gray-50 rounded-md border mt-2">
                <div class="flex justify-between items-start mb-2">
                    <p class="font-semibold">${fornecedor.nome} <span class="font-normal text-gray-500 text-sm">- ${fornecedor.cnpj}</span></p>
                    <button class="delete-fornecedor text-red-500 hover:text-red-700 text-xs font-bold" data-fornecedor-id="${fornecedorIdNumerico}">EXCLUIR</button>
                </div>
                <div class="mt-2 text-sm">
                    <table class="min-w-full">
                        <thead><tr class="border-b"><th class="py-1 pr-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição do Item</th><th class="py-1 px-2 text-center text-xs font-medium text-gray-500 uppercase">Ação</th></tr></thead>
                        <tbody>${itensHtml || '<tr><td colspan="2" class="py-2 text-center text-gray-500">Nenhum item.</td></tr>'}</tbody>
                    </table>
                    <form class="formAddItem grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-3 mt-2 border-t" data-fornecedor-id="${fornecedorIdNumerico}">
                        <div class="lg:col-span-4"><label class="text-xs font-medium">Descrição</label><input type="text" name="descricao" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                        <div class="lg:col-span-2"><label class="text-xs font-medium">Marca</label><input type="text" name="marca" class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                        <div class="lg:col-span-2"><label class="text-xs font-medium">Nº do Item</label><input type="text" name="numeroItem" class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                        <div><label class="text-xs font-medium">Unidade</label><select name="unidade" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"><option>UN</option><option>KG</option><option>M</option><option>M²</option><option>M³</option></select></div>
                        <div><label class="text-xs font-medium">Qtd. Máx.</label><input type="number" name="quantidadeMax" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                        <div><label class="text-xs font-medium">Valor Unit.</label><input type="number" step="0.01" name="valor" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                        <div class="lg:col-span-4"><button type="submit" class="w-full bg-sky-600 text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-sky-700 mt-2">Adicionar Item</button></div>
                    </form>
                </div>
            </div>`;
        }).join('');
        pregaoContainer.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="font-bold text-lg">${pregaoNumero}</div>
                <div>
                    <button class="edit-pregao text-sm text-blue-500 hover:text-blue-700 font-semibold mr-4" data-pregao-id="${pregaoId}">Editar</button>
                    <button class="delete-pregao text-sm text-red-500 hover:text-red-700 font-semibold" data-pregao-id="${pregaoId}">Excluir Pregão</button>
                </div>
            </div>
            <p class="text-gray-600 mb-4">${pregaoData.objeto}</p>
            <div class="pl-4 border-l-2 border-gray-200 space-y-4">
                <h4 class="font-semibold text-md">Fornecedores</h4>
                ${fornecedoresHtml || '<p class="text-sm text-gray-500">Nenhum fornecedor cadastrado.</p>'}
                <form class="formAddFornecedor grid grid-cols-1 sm:grid-cols-3 gap-2 items-end pt-4 border-t" data-pregao-id="${pregaoId}">
                    <div class="sm:col-span-1"><label class="text-xs font-medium">Nome do Fornecedor</label><input type="text" name="nome" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                    <div class="sm:col-span-1"><label class="text-xs font-medium">CNPJ</label><input type="text" name="cnpj" required class="mt-1 w-full text-sm px-2 py-1 border rounded-md"></div>
                    <button type="submit" class="w-full sm:w-auto justify-self-end bg-teal-600 text-white text-sm font-semibold px-4 py-1 rounded-md hover:bg-teal-700">Add Fornecedor</button>
                </form>
            </div>`;
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
        alert('Erro: Pregão não encontrado para edição.');
        return;
    }
    dom.editPregaoId.value = pregaoId;
    dom.editPregaoNumero.value = pregaoNumero;
    dom.editPregaoObjeto.value = pregaoData.objeto;
    dom.editModal.classList.remove('hidden');
}
