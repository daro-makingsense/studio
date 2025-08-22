import { supabase } from "@/lib/supabase";
import { Task } from "@/types";

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