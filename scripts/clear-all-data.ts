import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAllData() {
  console.log('🗑️  Starting data deletion...\n');
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Delete in reverse order of dependencies
    // 1. Delete Tasks (depends on users)
    console.log('🗑️  Deleting all tasks...');
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .neq('id', '');  // Delete all records

    if (tasksError) {
      console.error('❌ Error deleting tasks:', tasksError);
      throw tasksError;
    }
    console.log('✅ All tasks deleted\n');

    // 2. Delete Calendar Events
    console.log('🗑️  Deleting all calendar events...');
    const { error: eventsError } = await supabase
      .from('calendar_events')
      .delete()
      .neq('id', '');

    if (eventsError) {
      console.error('❌ Error deleting calendar events:', eventsError);
      throw eventsError;
    }
    console.log('✅ All calendar events deleted\n');

    // 3. Delete Novelties
    console.log('🗑️  Deleting all novelties...');
    const { error: noveltiesError } = await supabase
      .from('novelties')
      .delete()
      .neq('id', '');

    if (noveltiesError) {
      console.error('❌ Error deleting novelties:', noveltiesError);
      throw noveltiesError;
    }
    console.log('✅ All novelties deleted\n');

    // 4. Delete Users (last, as tasks depend on users)
    console.log('🗑️  Deleting all users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '');

    if (usersError) {
      console.error('❌ Error deleting users:', usersError);
      throw usersError;
    }
    console.log('✅ All users deleted\n');

    console.log('🎉 All data cleared successfully!');

  } catch (error) {
    console.error('\n❌ Error during data deletion:', error);
    process.exit(1);
  }
}

// Run the script
clearAllData().then(() => {
  console.log('\n✅ Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});