// ============================================================
//  BlakNet — Supabase Client
// ============================================================
//
//  HOW TO CONNECT:
//
//  1. Go to your Supabase project dashboard
//  2. Navigate to: Settings → API
//  3. Copy your:
//     - Project URL  → paste below in SUPABASE_URL
//     - anon/public key → paste below in SUPABASE_PUBLIC_KEY
//
//  These are safe to expose in client-side code (the public key
//  is designed to be public — Row Level Security protects your data).
// ============================================================

import { createClient } from "@supabase/supabase-js";

// 👇 PASTE YOUR SUPABASE URL HERE
const SUPABASE_URL = "https://dlltfrajpnuujbbpqadz.supabase.co";

// 👇 PASTE YOUR SUPABASE PUBLIC (anon) KEY HERE
const SUPABASE_PUBLIC_KEY = "sb_publishable_LNayL_VRk1SznCf0P6xudg_T0JUfwOM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
