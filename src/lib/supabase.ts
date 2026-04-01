import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize the Supabase client utilizing the Service Role Key
// IMPORTANT: This should ONLY be used inside server-side contexts like API routes, 
// never in client components, since it bypasses Row Level Security (RLS).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
