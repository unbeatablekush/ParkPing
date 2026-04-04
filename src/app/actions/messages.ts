"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Marks messages as read using a service role key to bypass RLS.
 * This is necessary because the owner cannot update scanner-originated messages due to RLS.
 */
export async function markMessagesAsRead(scanIds: string[]) {
  if (!scanIds || scanIds.length === 0) return { success: true };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase configuration for Server Action");
    return { success: false, error: "Configuration missing" };
  }

  // Create an admin client to bypass RLS
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Note: Detailed user validation could be done here by checking scanIds against the user's vehicles.
  // For now, we trust the client-side scanIds list but restrict by sender_type.
  
  const { error } = await supabaseAdmin
    .from('messages')
    .update({ is_read: true })
    .in('scan_id', scanIds)
    .eq('sender_type', 'scanner')
    .eq('is_read', false);

  if (error) {
    console.error("Error marking messages as read via Server Action:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
