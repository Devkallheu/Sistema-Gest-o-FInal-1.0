// js/state.js - VERSÃO CORRIGIDA

let state = {
    database: {},
    requisicoesSalvas: [],
    proximoNumeroRequisicao: 1,
    users: [],
    loggedInUser: null,
    configuracoes: {},
    currentState: {}
};

export const getDB = () => state.database;
export const getUsers = () => state.users;
export const getLoggedInUser = () => state.loggedInUser;
export const getConfiguracoes = () => state.configuracoes;
export const getRequisicoesSalvas = () => state.requisicoesSalvas;
export const getProximoNumeroRequisicao = () => state.proximoNumeroRequisicao;
export const getCurrentState = () => state.currentState;
export const getFullStateForBackup = () => ({
    database: state.database,
    requisicoesSalvas: state.requisicoesSalvas,
    proximoNumeroRequisicao: state.proximoNumeroRequisicao,
    users: state.users,
    configuracoes: state.configuracoes
});

export const setInitialData = (initialData) => {
    state.database = initialData.database;
    state.requisicoesSalvas = initialData.requisicoesSalvas;
    state.proximoNumeroRequisicao = initialData.proximoNumeroRequisicao;
    state.users = initialData.users;
    state.configuracoes = initialData.configuracoes;
};

export const setLoggedInUser = (user) => { state.loggedInUser = user; };
export const setUsers = (newUsers) => { state.users = newUsers; };
export const setDatabase = (newDatabase) => { state.database = newDatabase; };
export const setConfiguracoes = (newConfig) => { state.configuracoes = newConfig; };
export const addRequisicaoSalva = (requisicao) => { state.requisicoesSalvas.push(requisicao); };

// A função updateItemQuantityInDB foi removida daqui.

export const resetCurrentState = () => {
    state.currentState = {
        activeView: 'requisicao',
        step: 1,
        pregaoId: null, pregaoData: null, fornecedorId: null, fornecedorData: null,
        selectedItems: {},
        numeroRequisicaoAtual: null,
        setorRequisitante: '', nup: '', responsavel: '', identidade: '', destino: '', contato: '', email: '', anexos: '',
        justificativa: '', notaCredito: '', planoInterno: '', ptres: '', tipoEmpenho: 'Ordinário',
        fiscalAdm: '', fiscalAdmFunc: '', conformador: '', conformadorFunc: '', ordenador: '', ordenadorFunc: ''
    };
};
export const updateCurrentState = (newState) => {
    state.currentState = { ...state.currentState, ...newState };
};