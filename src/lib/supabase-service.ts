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
    const { workHours, frequentTasks, ...etc } = user as unknown as any;
    const payload = {
      work_hours: workHours,
      frequent_tasks: frequentTasks,
      ...etc,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;

    const createdUser: User = {
      workHours: (data as any).work_hours,
      frequentTasks: (data as any).frequent_tasks,
      ...data,
    };

    return createdUser;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { workHours, frequentTasks, ...rest } = updates as unknown as any;
    const updatePayload = {
      ...rest,
      ...(typeof workHours !== 'undefined' ? { work_hours: workHours } : {}),
      ...(typeof frequentTasks !== 'undefined' ? { frequent_tasks: frequentTasks } : {}),
    };

    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    const updatedUser: User = {
      workHours: (data as any).work_hours,
      frequentTasks: (data as any).frequent_tasks,
      ...data,
    };

    return updatedUser;
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
        days: task.days,
        startTime: task.start_time,
        duration: task.duration,
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
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      userId: data.user_id,
      startDate: data.start_date,
      endDate: data.end_date,
      days: data.days,
      startTime: data.start_time,
      duration: data.duration,
      notes: data.notes,
    };
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { userId, startDate, endDate, startTime, ...etc } = updates;
    const { data, error } = await supabase
      .from('tasks')
      .update({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        ...etc,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      userId: data.user_id,
      startDate: data.start_date,
      endDate: data.end_date,
      days: data.days,
      startTime: data.start_time,
      duration: data.duration,
      notes: data.notes,
    };
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
    const { updatedAt, ...etc } = updates;
    const payload = { updated_at: updatedAt, ...etc };

    const { data, error } = await supabase
      .from('novelties')
      .update(payload)
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