import { supabase } from './supabase';
import type { User, Task, CalendarEvent, Novelty } from '@/types';

// User operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(user: User): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...user,
        work_hours: user.workHours,
        frequent_tasks: user.frequentTasks
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const updateData: any = { ...updates };
    if (updates.workHours) updateData.work_hours = updates.workHours;
    if (updates.frequentTasks) updateData.frequent_tasks = updates.frequentTasks;
    delete updateData.workHours;
    delete updateData.frequentTasks;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async upsertMany(users: User[]): Promise<User[]> {
    const transformedUsers = users.map(user => ({
      ...user,
      work_hours: user.workHours,
      frequent_tasks: user.frequentTasks
    }));

    const { data, error } = await supabase
      .from('users')
      .upsert(transformedUsers)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Task operations
export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByUserId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(task: Task): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: task.userId,
        start_date: task.startDate,
        end_date: task.endDate,
        start_time: task.startTime
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = { ...updates };
    if (updates.userId) updateData.user_id = updates.userId;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.startTime) updateData.start_time = updates.startTime;
    delete updateData.userId;
    delete updateData.startDate;
    delete updateData.endDate;
    delete updateData.startTime;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertMany(tasks: Task[]): Promise<Task[]> {
    const transformedTasks = tasks.map(task => ({
      ...task,
      user_id: task.userId,
      start_date: task.startDate,
      end_date: task.endDate,
      start_time: task.startTime
    }));

    const { data, error } = await supabase
      .from('tasks')
      .upsert(transformedTasks)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Calendar Event operations
export const calendarEventService = {
  async getAll(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...event,
        all_day: event.allDay
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const updateData: any = { ...updates };
    if (updates.allDay !== undefined) updateData.all_day = updates.allDay;
    delete updateData.allDay;

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertMany(events: CalendarEvent[]): Promise<CalendarEvent[]> {
    const transformedEvents = events.map(event => ({
      ...event,
      all_day: event.allDay
    }));

    const { data, error } = await supabase
      .from('calendar_events')
      .upsert(transformedEvents)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Novelty operations
export const noveltyService = {
  async getAll(): Promise<Novelty[]> {
    const { data, error } = await supabase
      .from('novelties')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(novelty: Novelty): Promise<Novelty> {
    const { data, error } = await supabase
      .from('novelties')
      .insert({
        ...novelty,
        updated_at: novelty.updatedAt || new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Novelty>): Promise<Novelty> {
    const { data, error } = await supabase
      .from('novelties')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('novelties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertMany(novelties: Novelty[]): Promise<Novelty[]> {
    const transformedNovelties = novelties.map(novelty => ({
      ...novelty,
      updated_at: novelty.updatedAt || new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('novelties')
      .upsert(transformedNovelties)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};