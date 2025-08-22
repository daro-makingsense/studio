import { supabase } from "@/lib/supabase";
import { CalendarEvent } from "@/types";

export const calendarEventService = {
    async getAll(): Promise<CalendarEvent[]> {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start', { ascending: true });
      
      if (error) throw error;
      if (!data) return [];
  
      // Normalize event dates to handle both old datetime and new date formats
      const normalizedEvents = data.map((event) => ({
        ...event,
        start: event.start.split('T')[0],
        end: event.end.split('T')[0],
      }));
  
      return normalizedEvents;
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