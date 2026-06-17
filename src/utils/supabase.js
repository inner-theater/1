import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uemvpdbuhzfomfstqias.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbXZwZGJ1aHpmb21mc3RxaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NzU2ODQsImV4cCI6MjA5NzI1MTY4NH0.CSVN_Q-EOIq37D4CkacmuZ7TNcGjzzfYtfF8DP4JQP4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
