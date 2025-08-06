import { supabase } from '../lib/supabaseClient';

export const pending = [];

/**
 * Flush everything that’s currently buffered in `pending`
 * to the `messages` table.
 *
 * @returns {Promise<Array>}  The rows that were inserted (empty on error
 *                            or when there was nothing to flush).
 */
export async function flushMessages() {
  if (!pending.length) return [];

  // copy & clear the queue BEFORE the async call
  const batch = pending.splice(0);

  const { data, error } = await supabase
    .from('messages')
    .insert(batch)   // JSON payload – no columns option
    .select();       // have PostgREST echo the new rows

  if (error) {
    console.error('[messages] insert failed →', error);
    // put the batch back so we can retry later
    pending.unshift(...batch);
    return [];
  }
  console.log('inserted rows', data); 
  return data;       // useful if the caller wants to update UI immediately
}