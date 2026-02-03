import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are actually set (not placeholders or empty)
const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
const isValidKey = supabaseAnonKey.length > 20; // Anon keys are long JWT-like strings

export const isSupabaseConfigured = isValidUrl && isValidKey;

// Only create client if properly configured to avoid crashes
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Please update your .env file with valid credentials.');
}
