import { getSupabase } from './supabaseClient';

const TABLE = 'users';

export async function listUsers() {
  const supabase = getSupabase();
  if (!supabase) return null;
  // Try snake_case order first, then camelCase, then no order
  let data = null, error = null;
  ({ data, error } = await supabase.from(TABLE).select('*').order('join_date', { ascending: false }));
  if (error && (error.code === 'PGRST204' || error.code === '42703' || /column\s+"?join_date"?\s+does not exist/i.test(String(error.message || '')))) {
    ({ data, error } = await supabase.from(TABLE).select('*').order('joinDate', { ascending: false }));
  }
  if (error) {
    ({ data, error } = await supabase.from(TABLE).select('*'));
  }
  if (error) throw error;
  return data || [];
}

export async function findUserByIdentifier(identifier) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const id = String(identifier).trim();
  const idLower = id.toLowerCase();
  const idDigits = id.replace(/[^\d]/g, '');

  // Try email
  let { data, error } = await supabase.from(TABLE).select('*').eq('email', idLower).limit(1).maybeSingle();
  if (error) throw error;
  if (data) return data;

  // Try username
  ({ data, error } = await supabase.from(TABLE).select('*').eq('username', idLower).limit(1).maybeSingle());
  if (error) throw error;
  if (data) return data;

  // Try phone (normalized)
  ({ data, error } = await supabase.from(TABLE).select('*').contains('phone_digits', idDigits).limit(1).maybeSingle());
  if (error) throw error;
  return data || null;
}

export async function createUser(user) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).insert(user).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateUser(id, updates) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}
