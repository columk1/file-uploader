import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ulgkocqdombbzvyucicr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY)

export default supabaseAdmin
