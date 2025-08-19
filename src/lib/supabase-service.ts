import { supabase } from './supabase';
import type { User, Task, CalendarEvent, Novelty } from '@/types';

// User operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    if (!data) return [];

    const users = data.map((user) => {
      return {
        workHours: user.work_hours,
        frequentTasks: user.frequent_tasks,
        ...user,
      };
    });

    return users;
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;

    const user = {
      workHours: data.work_hours,
      frequentTasks: data.frequent_tasks,
      ...data,
    };

    return user;
  },

  async create(user: User): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...user,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async upsertMany(users: User[]): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .upsert(users)
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
    if (!data) return [];

    const tasks = data.map((task) => {
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        userId: task.user_id,
        startDate: task.start_date,
        endDate: task.end_date,
        startTime: task.start_time,
        notes: task.notes,
      };
    });

    return tasks;
  },

  async getByUserId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (!data) return [];

    const tasks = data.map((task) => {
      return {
        ...task,
        startDate: task.start_date,
        endDate: task.end_date,
        startTime: task.start_time,
      };
    });
    return tasks;
  },

  async create(task: Task): Promise<Task> {
    // console.log('Creating task:', task);
    const { userId, startDate, endDate, startTime, ...etc } = task;
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        ...etc,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
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
    const { data, error } = await supabase
      .from('tasks')
      .upsert(tasks)
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
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
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
    const { data, error } = await supabase
      .from('calendar_events')
      .upsert(events)
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