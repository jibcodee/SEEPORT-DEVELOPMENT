import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qodrnrewzwrcejelcbwl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHJucmV3endyY2VqZWxjYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTc4NTUsImV4cCI6MjEwMTU3Mzg1NX0.NU2jjTfgXRIW-Y5wxegyEU-ZelmkGdkId6Na15wo8hk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
