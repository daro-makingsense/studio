import { createClient } from '@supabase/supabase-js';
import { users, tasks, calendarEvents, novelties } from '../src/lib/seed-data';
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

async function insertDummyData() {
  console.log('🚀 Starting dummy data insertion...\n');

  try {
    // 1. Insert Users
    console.log('📥 Inserting users...');
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      positions: user.positions,
      role: user.role,
      work_hours: user.workHours,
      frequent_tasks: user.frequentTasks,
      color: user.color
    }));

    const { error: usersError } = await supabase
      .from('users')
      .upsert(transformedUsers, { onConflict: 'id' });

    if (usersError) {
      console.error('❌ Error inserting users:', usersError);
      throw usersError;
    }
    console.log(`✅ Successfully inserted ${users.length} users\n`);

    // 2. Insert Tasks
    console.log('📥 Inserting tasks...');
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      user_id: task.userId,
      days: task.days || null,
      start_date: task.startDate || null,
      end_date: task.endDate || null,
      start_time: task.startTime || null,
      duration: task.duration || null,
      priority: task.priority,
      status: task.status,
      notes: task.notes || null
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .upsert(transformedTasks, { onConflict: 'id' });

    if (tasksError) {
      console.error('❌ Error inserting tasks:', tasksError);
      throw tasksError;
    }
    console.log(`✅ Successfully inserted ${tasks.length} tasks\n`);

    // 3. Insert Calendar Events
    console.log('📥 Inserting calendar events...');
    const transformedEvents = calendarEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      type: event.type,
      description: event.description,
      all_day: event.allDay || false
    }));

    const { error: eventsError } = await supabase
      .from('calendar_events')
      .upsert(transformedEvents, { onConflict: 'id' });

    if (eventsError) {
      console.error('❌ Error inserting calendar events:', eventsError);
      throw eventsError;
    }
    console.log(`✅ Successfully inserted ${calendarEvents.length} calendar events\n`);

    // 4. Insert Novelties
    console.log('📥 Inserting novelties...');
    const transformedNovelties = novelties.map(novelty => ({
      id: novelty.id,
      title: novelty.title,
      description: novelty.description || null,
      start: novelty.start,
      end: novelty.end,
      updated_at: novelty.updatedAt || new Date().toISOString()
    }));

    const { error: noveltiesError } = await supabase
      .from('novelties')
      .upsert(transformedNovelties, { onConflict: 'id' });

    if (noveltiesError) {
      console.error('❌ Error inserting novelties:', noveltiesError);
      throw noveltiesError;
    }
    console.log(`✅ Successfully inserted ${novelties.length} novelties\n`);

    console.log('🎉 All dummy data inserted successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Tasks: ${tasks.length}`);
    console.log(`- Calendar Events: ${calendarEvents.length}`);
    console.log(`- Novelties: ${novelties.length}`);

  } catch (error) {
    console.error('\n❌ Error during data insertion:', error);
    process.exit(1);
  }
}

// Run the script
insertDummyData().then(() => {
  console.log('\n✅ Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});