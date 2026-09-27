import { createClient } from "@supabase/supabase-js";
import { createFleetClient } from '../foundation/session'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createFleetClient(createClient, supabaseUrl, supabaseAnonKey)
