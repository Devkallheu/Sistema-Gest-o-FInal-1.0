// supabase/functions/delete-user/index.ts - VERSÃO DE DEPURAÇÃO AGRESSIVA

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('--- Função delete-user carregada ---');

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Recebida requisição: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log('É uma requisição OPTIONS (CORS), respondendo com OK.');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Entrando no bloco TRY...');
    
    console.log('Tentando extrair o corpo (body) da requisição como JSON...');
    const body = await req.json();
    console.log('Corpo (body) extraído com sucesso:', body);

    const user_id = body.user_id;
    if (!user_id) {
      console.log('Erro: user_id não encontrado no corpo da requisição.');
      throw new Error("O ID do usuário (user_id) é obrigatório no corpo da requisição.");
    }
    console.log('user_id encontrado:', user_id);

    console.log('Criando o cliente admin do Supabase...');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Cliente admin criado.');

    console.log('Tentando deletar o usuário no Supabase...');
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    console.log('Resposta da API de exclusão recebida.');

    if (error) {
      console.error('A API do Supabase retornou um erro:', error.message);
      throw error;
    }
    console.log('Usuário deletado com sucesso pela API:', data);

    return new Response(JSON.stringify({ message: "Usuário excluído com sucesso" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('--- ERRO CAPTURADO NO BLOCO CATCH ---');
    console.error('O erro foi:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})