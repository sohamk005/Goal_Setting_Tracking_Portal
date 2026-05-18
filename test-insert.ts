import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const row1 = {
    id: "44444444-4444-4444-4444-444444444444",
    employee_id: "33333333-3333-3333-3333-333333333333",
    employee_name: "Employee",
    manager_id: "22222222-2222-2222-2222-222222222222",
    title: "Test Goal 1",
    targets: "Test Target",
    thrust_area: "Unassigned",
    uom_type: "numeric",
    target_value: 10,
    weightage: 10,
    metric_type: "min",
    status: "not_started",
    quarter: "Q1",
    is_locked: false,
    review_status: "pending",
  };

  const row2 = {
    employee_id: "33333333-3333-3333-3333-333333333333",
    employee_name: "Employee",
    manager_id: "22222222-2222-2222-2222-222222222222",
    title: "Test Goal 2",
    targets: "Test Target",
    thrust_area: "Unassigned",
    uom_type: "numeric",
    target_value: 10,
    weightage: 10,
    metric_type: "min",
    status: "not_started",
    quarter: "Q1",
    is_locked: false,
    review_status: "pending",
  };

  const { data, error } = await supabase.from('goals').upsert([row1, row2], {
    onConflict: 'id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("SUPABASE ERROR:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS:", data);
  }
}

test().catch(console.error);
