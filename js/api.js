import { supabaseClient } from './supabaseClient.js';

export async function loadInitialData() {
    const { data: pregoes, error } = await supabaseClient.from('pregoes').select(`*, fornecedores ( *, itens ( * ) )`);
    if (error) { console.error('Erro ao buscar dados iniciais:', error); return {}; }
    const databaseObject = {};
    for (const pregao of pregoes) {
        databaseObject[pregao.numero_pregao] = {
            id: pregao.id,
            objeto: pregao.objeto,
            fornecedores: pregao.fornecedores.map(fornecedor => ({
                id_numerico: fornecedor.id,
                id: 'f' + fornecedor.id,
                nome: fornecedor.nome,
                cnpj: fornecedor.cnpj,
                itens: fornecedor.itens.map(item => ({
                    id_numerico: item.id,
                    id: 'i' + item.id,
                    descricao: item.descricao,
                    marca: item.marca,
                    numeroItem: item.numero_item,
                    unidade: item.unidade,
                    quantidadeMax: item.quantidade_max,
                    valor: item.valor
                }))
            }))
        };
    }
    return databaseObject;
}

export async function getPregoes() {
    const { data, error } = await supabaseClient.from('pregoes').select('*, fornecedores(*, itens(*))').order('created_at', { ascending: false });
    if (error) { console.error('Erro ao buscar pregões:', error); return []; }
    return data;
}

export async function addPregao(numeroPregao, objeto) {
    const { data, error } = await supabaseClient.from('pregoes').insert([{ numero_pregao: numeroPregao, objeto: objeto }]);
    if (error) { console.error('Erro ao adicionar pregão:', error); return { data: null, error }; }
    return { data, error: null };
}

export async function deletePregao(pregaoId) {
    const { error } = await supabaseClient.from('pregoes').delete().eq('id', pregaoId);
    if (error) { console.error('Erro ao excluir pregão:', error); return false; }
    return true;
}

export async function updatePregao(pregaoId, updatedData) {
    const { error } = await supabaseClient.from('pregoes').update(updatedData).eq('id', pregaoId);
    if (error) { console.error('Erro ao atualizar pregão:', error); return false; }
    return true;
}

export async function addFornecedor(nome, cnpj, pregaoId) {
    const { data, error } = await supabaseClient.from('fornecedores').insert([{ nome, cnpj, pregao_id: pregaoId }]);
    if (error) { console.error('Erro ao adicionar fornecedor:', error); return { data: null, error }; }
    return { data, error: null };
}

export async function deleteFornecedor(fornecedorId) {
    const { error } = await supabaseClient.from('fornecedores').delete().eq('id', fornecedorId);
    if (error) { console.error('Erro ao excluir fornecedor:', error); return false; }
    return true;
}

export async function addItem(itemData) {
    const { data, error } = await supabaseClient.from('itens').insert([itemData]);
    if (error) { console.error('Erro ao adicionar item:', error); return { data: null, error }; }
    return { data, error: null };
}

export async function deleteItem(itemId) {
    const { error } = await supabaseClient.from('itens').delete().eq('id', itemId);
    if (error) { console.error('Erro ao excluir item:', error); return false; }
    return true;
}

export async function saveNewRequisition(requisitionData) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const dataToInsert = {
        numero_requisicao: requisitionData.numero,
        setor_requisitante: requisitionData.setorRequisitante,
        valor_total: requisitionData.valorTotal,
        dados_completos: requisitionData,
        criado_por_id: user.id
    };
    const { data, error } = await supabaseClient.from('requisicoes').insert([dataToInsert]);
    if (error) { console.error('Erro ao salvar requisição:', error); return { data: null, error }; }
    return { data, error: null };
}

export async function getSavedRequisitions() {
    const { data, error } = await supabaseClient.from('requisicoes').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Erro ao buscar requisições salvas:', error); return []; }
    return data;
}

export async function deleteRequisition(requisitionId) {
    const { error } = await supabaseClient.from('requisicoes').delete().eq('id', requisitionId);
    if (error) { console.error('Erro ao excluir requisição:', error); return false; }
    return true;
}

export async function getSettings() {
    const { data, error } = await supabaseClient.from('configuracoes').select('chave, valor');
    if (error) { console.error('Erro ao buscar configurações:', error); return {}; }
    const settingsObject = data.reduce((acc, setting) => {
        acc[setting.chave] = setting.valor;
        return acc;
    }, {});
    return settingsObject;
}

export async function saveSettings(settingsObject) {
    const dataToUpsert = Object.entries(settingsObject).map(([chave, valor]) => ({ chave, valor }));
    const { error } = await supabaseClient.from('configuracoes').upsert(dataToUpsert, { onConflict: 'chave' });
    if (error) { console.error('Erro ao salvar configurações:', error); return false; }
    return true;
}

export async function getLatestRequisitionNumber() {
    const { data, error } = await supabaseClient.from('requisicoes').select('numero_requisicao').order('numero_requisicao', { ascending: false }).limit(1);
    if (error) { console.error("Erro ao buscar último número de requisição:", error); return 0; }
    if (data && data.length > 0) { return data[0].numero_requisicao; }
    return 0;
}