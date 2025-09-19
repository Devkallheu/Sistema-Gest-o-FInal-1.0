// js/api.js - VERSÃO ATUALIZADA
import { supabaseClient } from './supabaseClient.js';

// ================= PREGÕES =================
// js/api.js - VERSÃO FINAL E CORRETA
export async function loadInitialData() {
    const { data: pregoes, error } = await supabaseClient
        .from('pregoes')
        .select(`*, fornecedores ( *, itens ( * ) )`);

    if (error) { 
        console.error('Erro ao buscar dados iniciais:', error); 
        return {}; 
    }

    if (!pregoes) {
        console.warn("O Supabase retornou 'null' como dados.");
        return {};
    }

    const databaseObject = {};
    for (const pregao of pregoes) {
        const numeroKey = pregao.numero_pregao || pregao.numero;

        if (!numeroKey) {
            console.error("Objeto de pregão inválido recebido do Supabase. Não contém a coluna 'numero_pregao' ou 'numero'. Objeto:", pregao);
            continue;
        }

        databaseObject[numeroKey] = {
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
    const { data, error } = await supabaseClient
        .from('pregoes')
        .select('*, fornecedores(*, itens(*))')
        .order('created_at', { ascending: false });

    if (error) { 
        console.error('Erro ao buscar pregões:', error); 
        return []; 
    }
    return data;
}

export async function addPregao(numeroPregao, objeto) {
    const { data, error } = await supabaseClient
        .from('pregoes')
        .insert([{ numero_pregao: numeroPregao, objeto: objeto }]);

    if (error) { 
        console.error('Erro ao adicionar pregão:', error); 
        return { data: null, error }; 
    }
    return { data, error: null };
}

export async function deletePregao(pregaoId) {
    const { error } = await supabaseClient
        .from('pregoes')
        .delete()
        .eq('id', pregaoId);

    if (error) { 
        console.error('Erro ao excluir pregão:', error); 
        return false; 
    }
    return true;
}

export async function updatePregao(pregaoId, updatedData) {
    const { error } = await supabaseClient
        .from('pregoes')
        .update(updatedData)
        .eq('id', pregaoId);

    if (error) { 
        console.error('Erro ao atualizar pregão:', error); 
        return false; 
    }
    return true;
}

// ================= FORNECEDORES =================
export async function addFornecedor(nome, cnpj, pregaoId) {
    const { data, error } = await supabaseClient
        .from('fornecedores')
        .insert([{ nome, cnpj, pregao_id: pregaoId }]);

    if (error) { 
        console.error('Erro ao adicionar fornecedor:', error); 
        return { data: null, error }; 
    }
    return { data, error: null };
}

export async function deleteFornecedor(fornecedorId) {
    const { error } = await supabaseClient
        .from('fornecedores')
        .delete()
        .eq('id', fornecedorId);

    if (error) { 
        console.error('Erro ao excluir fornecedor:', error); 
        return false; 
    }
    return true;
}

// ================= ITENS =================
export async function addItem(itemData) {
    const { data, error } = await supabaseClient
        .from('itens')
        .insert([itemData]);

    if (error) { 
        console.error('Erro ao adicionar item:', error); 
        return { data: null, error }; 
    }
    return { data, error: null };
}

export async function deleteItem(itemId) {
    const { error } = await supabaseClient
        .from('itens')
        .delete()
        .eq('id', itemId);

    if (error) { 
        console.error('Erro ao excluir item:', error); 
        return false; 
    }
    return true;
}

// ================= REQUISIÇÕES =================
export async function getSavedRequisitions() {
    try {
        const { data, error } = await supabaseClient
            .from('requisicoes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar requisições salvas:", error);
            return [];
        }
        return data;
    } catch (err) {
        console.error("Erro inesperado ao buscar requisições:", err);
        return [];
    }
}

export async function saveNewRequisition(requisitionData) {
    console.log("%c--- INICIANDO PROCESSO DE SALVAR REQUISIÇÃO ---", "color: blue; font-weight: bold;");
    console.log("Dados da requisição recebidos pela função:", requisitionData);

    try {
        console.log("A iniciar a atualização de saldos dos itens...");

        for (const itemId in requisitionData.selectedItems) {
            const quantidadeRequisitada = requisitionData.selectedItems[itemId];
            const itemOriginal = requisitionData.fornecedorData.itens.find(i => i.id === itemId);

            console.log(`%c--> A processar item ID: ${itemId}`, "color: green;");

            if (itemOriginal && quantidadeRequisitada > 0) {
                console.log(`   - Item encontrado: ${itemOriginal.descricao}`);
                console.log(`   - ID numérico no DB: ${itemOriginal.id_numerico}`);

                const { data: currentItemData, error: currentItemError } = await supabaseClient
                    .from('itens')
                    .select('quantidade_max')
                    .eq('id', itemOriginal.id_numerico)
                    .single();

                if (currentItemError) {
                    throw new Error(`Erro ao buscar saldo atual do item ${itemOriginal.id_numerico}: ${currentItemError.message}`);
                }

                const novaQuantidade = currentItemData.quantidade_max - quantidadeRequisitada;

                if (novaQuantidade < 0) {
                    alert(`SALDO INSUFICIENTE para o item: ${itemOriginal.descricao}`);
                    throw new Error(`Saldo insuficiente para o item: ${itemOriginal.descricao}`);
                }

                const { error: updateError } = await supabaseClient
                    .from('itens')
                    .update({ quantidade_max: novaQuantidade })
                    .eq('id', itemOriginal.id_numerico);

                if (updateError) {
                    throw new Error(`Erro ao atualizar o item ${itemOriginal.descricao}: ${updateError.message}`);
                }
            }
        }

        const { data: { user } } = await supabaseClient.auth.getUser();

        const dataToInsert = {
            numero_requisicao: requisitionData.numero,
            setor_requisitante: requisitionData.setorRequisitante,
            valor_total: requisitionData.valorTotal,
            dados_completos: requisitionData,
            criado_por_id: user.id
        };

        const { data, error: insertError } = await supabaseClient
            .from('requisicoes')
            .insert([dataToInsert]);

        if (insertError) throw insertError;

        console.log("%c--- PROCESSO CONCLUÍDO COM SUCESSO ---", "color: blue; font-weight: bold;");
        return { data, error: null };

    } catch (error) {
        console.error('%c--- PROCESSO INTERROMPIDO POR ERRO ---', 'color: red; font-weight: bold;');
        console.error('Erro detalhado durante o salvamento:', error);
        return { data: null, error };
    }
}

export async function deleteRequisition(requisitionId) {
    try {
        const { data: requisitionToDelete, error: fetchError } = await supabaseClient
            .from('requisicoes')
            .select('dados_completos')
            .eq('id', requisitionId)
            .single();

        if (fetchError) {
            throw new Error(`Erro ao buscar dados da requisição para exclusão: ${fetchError.message}`);
        }

        const requisitionData = requisitionToDelete.dados_completos;

        for (const itemId in requisitionData.selectedItems) {
            const quantidadeEstornada = requisitionData.selectedItems[itemId];
            const itemOriginal = requisitionData.fornecedorData.itens.find(i => i.id === itemId);

            if (itemOriginal && quantidadeEstornada > 0) {
                const { data: currentItemData, error: currentItemError } = await supabaseClient
                    .from('itens')
                    .select('quantidade_max')
                    .eq('id', itemOriginal.id_numerico)
                    .single();

                if (currentItemError) {
                    throw new Error(`Erro ao buscar saldo atual do item ${itemOriginal.id_numerico}: ${currentItemError.message}`);
                }

                const novaQuantidade = currentItemData.quantidade_max + quantidadeEstornada;

                const { error: updateError } = await supabaseClient
                    .from('itens')
                    .update({ quantidade_max: novaQuantidade })
                    .eq('id', itemOriginal.id_numerico);

                if (updateError) {
                    throw new Error(`Erro ao restaurar saldo do item ${itemOriginal.descricao}: ${updateError.message}`);
                }
            }
        }

        const { error: deleteError } = await supabaseClient
            .from('requisicoes')
            .delete()
            .eq('id', requisitionId);

        if (deleteError) {
            throw new Error(`Erro ao excluir o registo da requisição: ${deleteError.message}`);
        }

        return true;
    } catch (error) {
        console.error('Erro detalhado ao excluir requisição e restaurar saldos:', error);
        return false;
    }
}

export async function updateRequisition(requisitionId, originalData, updatedData) {
    console.log("%c--- INICIANDO PROCESSO DE ATUALIZAÇÃO DE REQUISIÇÃO ---", "color: orange; font-weight: bold;");
    
    try {
        const allItemIds = new Set([
            ...Object.keys(originalData.selectedItems),
            ...Object.keys(updatedData.selectedItems)
        ]);

        // Passo 1: Verificar se há saldo para todas as alterações
        for (const itemId of allItemIds) {
            const itemOriginal = originalData.fornecedorData.itens.find(i => i.id === itemId);
            if (!itemOriginal) continue;

            const originalQty = originalData.selectedItems[itemId] || 0;
            const updatedQty = updatedData.selectedItems[itemId] || 0;
            const diff = updatedQty - originalQty; // Diferença a ser subtraída do estoque

            if (diff > 0) { // Apenas checa se está tentando pegar mais itens
                 const { data: currentItemData, error: currentItemError } = await supabaseClient
                    .from('itens')
                    .select('quantidade_max')
                    .eq('id', itemOriginal.id_numerico)
                    .single();

                if (currentItemError) {
                    throw new Error(`Erro ao buscar saldo do item ${itemOriginal.descricao}: ${currentItemError.message}`);
                }
                if (currentItemData.quantidade_max < diff) {
                    throw new Error(`Saldo insuficiente para o item: ${itemOriginal.descricao}. Necessário: ${diff}, Disponível: ${currentItemData.quantidade_max}`);
                }
            }
        }
        
        // Passo 2: Se todos os saldos são suficientes, aplicar as alterações
        for (const itemId of allItemIds) {
            const itemOriginal = originalData.fornecedorData.itens.find(i => i.id === itemId);
            if (!itemOriginal) continue;

            const originalQty = originalData.selectedItems[itemId] || 0;
            const updatedQty = updatedData.selectedItems[itemId] || 0;
            const saldo_diff = originalQty - updatedQty; 

            if (saldo_diff !== 0) {
                 const { data: currentItemData, error: currentItemError } = await supabaseClient
                    .from('itens')
                    .select('quantidade_max')
                    .eq('id', itemOriginal.id_numerico)
                    .single();
                
                if (currentItemError) throw currentItemError;

                const novaQuantidade = currentItemData.quantidade_max + saldo_diff;

                const { error: updateError } = await supabaseClient
                    .from('itens')
                    .update({ quantidade_max: novaQuantidade })
                    .eq('id', itemOriginal.id_numerico);

                if (updateError) {
                    throw new Error(`Erro ao atualizar o saldo do item ${itemOriginal.descricao}: ${updateError.message}`);
                }
            }
        }

        // Passo 3: Atualizar o registro da requisição principal
        const { data, error: updateRequisitionError } = await supabaseClient
            .from('requisicoes')
            .update({ 
                dados_completos: updatedData,
                valor_total: updatedData.valorTotal,
                setor_requisitante: updatedData.setorRequisitante
            })
            .eq('id', requisitionId);

        if (updateRequisitionError) throw updateRequisitionError;

        console.log("%c--- ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ---", "color: green; font-weight: bold;");
        return { data, error: null };

    } catch (error) {
        console.error('%c--- PROCESSO DE ATUALIZAÇÃO INTERROMPIDO POR ERRO ---', 'color: red; font-weight: bold;');
        console.error('Erro detalhado:', error);
        return { data: null, error };
    }
}

// ================= CONFIGURAÇÕES =================
export async function getSettings() {
    const { data, error } = await supabaseClient
        .from('configuracoes')
        .select('chave, valor');

    if (error) { 
        console.error('Erro ao buscar configurações:', error); 
        return {}; 
    }

    return data.reduce((acc, setting) => {
        acc[setting.chave] = setting.valor;
        return acc;
    }, {});
}

export async function saveSettings(settingsObject) {
    const dataToUpsert = Object.entries(settingsObject).map(([chave, valor]) => ({ chave, valor }));
    const { error } = await supabaseClient
        .from('configuracoes')
        .upsert(dataToUpsert, { onConflict: 'chave' });

    if (error) { 
        console.error('Erro ao salvar configurações:', error); 
        return false; 
    }
    return true;
}

// ================= USUÁRIOS =================
export async function listUsers() {
    try {
        const { data, error } = await supabaseClient.functions.invoke('list-users');
        if (error) throw error;
        return { data: data.users, error: null };
    } catch (err) {
        console.error("Erro ao invocar a função list-users:", err);
        return { data: [], error: err };
    }
}

export async function createNewUser(email, password, role) {
    try {
        const { data, error } = await supabaseClient.functions.invoke('create-user', {
            body: { email, password, role },
        });
        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error("Erro ao invocar a função create-user:", err);
        return { data: null, error: err };
    }
}

export async function deleteUser(userId) {
    try {
        const { data, error } = await supabaseClient.functions.invoke('delete-user', {
            body: { user_id: userId },
        });

        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error("Erro detalhado ao invocar a função delete-user:", err);
        const specificMessage = err.context?.json?.error || err.message;
        return { data: null, error: { message: specificMessage } };
    }
}