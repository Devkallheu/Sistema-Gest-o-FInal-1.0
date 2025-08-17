// js/supabaseClient.js - VERSÃO CORRIGIDA COM ASPAS

// Importa a função createClient diretamente da URL da biblioteca
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- SUAS CREDENCIAIS CORRIGIDAS (AGORA COM ASPAS) ---
const SUPABASE_URL = 'https://jgfhocbvnhlsubzyynsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZmhvY2J2bmhsc3Vienl5bnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTExODksImV4cCI6MjA3MDc2NzE4OX0.eIL3mqe4ezjdjmOx_THiRHihCHu8Q-YTIAeRX4xCkKk';
// ----------------------------------------------------

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);