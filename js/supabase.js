// ─────────────────────────────────────────────
//  Supabase configuration
//  Replace SUPABASE_URL and SUPABASE_ANON_KEY
//  with your own values from supabase.com
// ─────────────────────────────────────────────

const SUPABASE_URL    = 'https://iosehlqrmeycdmkvsoso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc2VobHFybWV5Y2Rta3Zzb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTA1MzUsImV4cCI6MjA4ODU4NjUzNX0.1CD58vEt32P089O_XCXqIjrA8N_2JR2HG0VY3w2uAXQ';

// Load the Supabase client from CDN (injected before this script via a <script> tag)
// We create and export a single instance used across pages.
let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;

  // supabaseJs is loaded from the CDN script tag below in each HTML file.
  // If you see an error here, make sure the CDN script is loaded first.
  if (typeof supabase === 'undefined') {
    console.error('Supabase CDN not loaded. Add the script tag before supabase.js.');
    return null;
  }
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}
