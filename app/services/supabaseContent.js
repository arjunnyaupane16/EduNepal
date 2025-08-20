import { getSupabase } from './supabaseClient';

const TABLE = 'content';

export async function listContent() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createContent(item) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).insert(item).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateContent(id, updates) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteContent(id) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}
