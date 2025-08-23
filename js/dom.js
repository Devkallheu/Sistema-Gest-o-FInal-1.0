// js/dom.js - VERSÃO FINAL CORRIGIDA

// 1. Exportamos as variáveis vazias (let) para que possam ser preenchidas depois.
export let loginView, appContainer, loginForm, loginError, welcomeMessage, logoutButton,
           homeButton, viewRequisicao, viewGerenciar, viewEmitidas, viewConfiguracoes, viewBackup,
           tabRequisicao, tabGerenciar, tabEmitidas, tabConfiguracoes, tabBackup, steps,
           pregaoInput, btnStep1, errorStep1, pregaoInfo, fornecedoresList, btnStep2, errorStep2,
           fornecedorInfo, itemsTableBody, btnStep3, errorStep3, totalValueEl, setorInput,
           nupInput, responsavelInput, identidadeInput, destinoInput, contatoInput, emailInput,
           anexosInput, justificativaInput, notaCreditoInput, planoInternoInput, ptresInput,
           fiscalAdmInput, fiscalAdmFuncInput, conformadorInput, conformadorFuncInput,
           ordenadorInput, ordenadorFuncInput, previewNumRequisicao, previewSetor, previewPregao,
           previewFornecedor, previewValor, finalActions, btnDownloadPDF, btnSave, saveSuccess,
           startNewAction, btnNewRequisition, adminPregoesContainer, formAddPregao,
           errorAdminPregao, listRequisicoesEmitidas, formConfiguracoes, configSaveSuccess,
           userManagementSection, usersList, formAddUser, addUserError,
           defaultFiscalAdmInput, defaultFiscalAdmFuncInput, defaultConformadorInput,

           defaultConformadorFuncInput, defaultOrdenadorInput, defaultOrdenadorFuncInput,
           btnCreateBackup, backupFileInput, btnRestoreBackup, restoreStatus, editModal,
           editModalTitle, formEditPregao, editPregaoId, editPregaoNumero,
           editPregaoObjeto, btnCancelEdit, previewJustificativa;

// 2. Criamos uma função que será chamada APENAS quando o HTML estiver pronto.
export function initializeDomElements() {
    loginView = document.getElementById('viewLogin');
    appContainer = document.getElementById('appContainer');
    loginForm = document.getElementById('loginForm');
    loginError = document.getElementById('loginError');
    welcomeMessage = document.getElementById('welcomeMessage');
    logoutButton = document.getElementById('logoutButton');
    homeButton = document.getElementById('homeButton');
    viewRequisicao = document.getElementById('viewRequisicao');
    viewGerenciar = document.getElementById('viewGerenciar');
    viewEmitidas = document.getElementById('viewEmitidas');
    viewConfiguracoes = document.getElementById('viewConfiguracoes');
    viewBackup = document.getElementById('viewBackup');
    tabRequisicao = document.getElementById('tabRequisicao');
    tabGerenciar = document.getElementById('tabGerenciar');
    tabEmitidas = document.getElementById('tabEmitidas');
    tabConfiguracoes = document.getElementById('tabConfiguracoes');
    tabBackup = document.getElementById('tabBackup');
    steps = { 1: document.getElementById('step1'), 2: document.getElementById('step2'), 3: document.getElementById('step3'), 4: document.getElementById('step4'), 5: document.getElementById('step5') };
    pregaoInput = document.getElementById('pregaoInput');
    btnStep1 = document.getElementById('btnStep1');
    errorStep1 = document.getElementById('errorStep1');
    pregaoInfo = document.getElementById('pregaoInfo');
    fornecedoresList = document.getElementById('fornecedoresList');
    btnStep2 = document.getElementById('btnStep2');
    errorStep2 = document.getElementById('errorStep2');
    fornecedorInfo = document.getElementById('fornecedorInfo');
    itemsTableBody = document.getElementById('itemsTableBody');
    btnStep3 = document.getElementById('btnStep3');
    errorStep3 = document.getElementById('errorStep3');
    totalValueEl = document.getElementById('totalValue');
    setorInput = document.getElementById('setorInput');
    nupInput = document.getElementById('nupInput');
    responsavelInput = document.getElementById('responsavelInput');
    identidadeInput = document.getElementById('identidadeInput');
    destinoInput = document.getElementById('destinoInput');
    contatoInput = document.getElementById('contatoInput');
    emailInput = document.getElementById('emailInput');
    anexosInput = document.getElementById('anexosInput');
    justificativaInput = document.getElementById('justificativaInput');
    notaCreditoInput = document.getElementById('notaCreditoInput');
    planoInternoInput = document.getElementById('planoInternoInput');
    ptresInput = document.getElementById('ptresInput');
    fiscalAdmInput = document.getElementById('fiscalAdmInput');
    fiscalAdmFuncInput = document.getElementById('fiscalAdmFuncInput');
    conformadorInput = document.getElementById('conformadorInput');
    conformadorFuncInput = document.getElementById('conformadorFuncInput');
    ordenadorInput = document.getElementById('ordenadorInput');
    ordenadorFuncInput = document.getElementById('ordenadorFuncInput');
    previewNumRequisicao = document.getElementById('previewNumRequisicao');
    previewSetor = document.getElementById('previewSetor');
    previewPregao = document.getElementById('previewPregao');
    previewFornecedor = document.getElementById('previewFornecedor');
    previewValor = document.getElementById('previewValor');
    finalActions = document.getElementById('finalActions');
    btnDownloadPDF = document.getElementById('btnDownloadPDF');
    btnSave = document.getElementById('btnSave');
    saveSuccess = document.getElementById('saveSuccess');
    startNewAction = document.getElementById('startNewAction');
    btnNewRequisition = document.getElementById('btnNewRequisition');
    adminPregoesContainer = document.getElementById('adminPregoesContainer');
    formAddPregao = document.getElementById('formAddPregao');
    errorAdminPregao = document.getElementById('errorAdminPregao');
    listRequisicoesEmitidas = document.getElementById('listRequisicoesEmitidas');
    formConfiguracoes = document.getElementById('formConfiguracoes');
    configSaveSuccess = document.getElementById('configSaveSuccess');
    userManagementSection = document.getElementById('userManagementSection');
    usersList = document.getElementById('usersList');
    formAddUser = document.getElementById('formAddUser');
    addUserError = document.getElementById('addUserError');
    defaultFiscalAdmInput = document.getElementById('defaultFiscalAdmInput');
    defaultFiscalAdmFuncInput = document.getElementById('defaultFiscalAdmFuncInput');
    defaultConformadorInput = document.getElementById('defaultConformadorInput');
    defaultConformadorFuncInput = document.getElementById('defaultConformadorFuncInput');
    defaultOrdenadorInput = document.getElementById('defaultOrdenadorInput');
    defaultOrdenadorFuncInput = document.getElementById('defaultOrdenadorFuncInput');
    btnCreateBackup = document.getElementById('btnCreateBackup');
    backupFileInput = document.getElementById('backupFileInput');
    btnRestoreBackup = document.getElementById('btnRestoreBackup');
    restoreStatus = document.getElementById('restoreStatus');
    editModal = document.getElementById('editModal');
    editModalTitle = document.getElementById('editModalTitle');
    formEditPregao = document.getElementById('formEditPregao');
    editPregaoId = document.getElementById('editPregaoId');
    editPregaoNumero = document.getElementById('editPregaoNumero');
    editPregaoObjeto = document.getElementById('editPregaoObjeto');
    btnCancelEdit = document.getElementById('btnCancelEdit');
    previewJustificativa = document.getElementById('previewJustificativa');
}