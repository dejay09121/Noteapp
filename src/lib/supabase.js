import { createClient } from "@supabase/supabase-js";

// 🔴 CHANGE THESE
const SUPABASE_URL = 'https://cfvhnhijbimidgodzmuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdmhuaGlqYmltaWRnb2R6bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTA2MzQsImV4cCI6MjA4MDE4NjYzNH0.p_0J4tuc9e52XhHqNEFy_iJfNI6-UnloKM-PDrc7ba8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔐 Helper functions
export async function signIn({ email, password }) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp({ email, password }) {
  return await supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}
