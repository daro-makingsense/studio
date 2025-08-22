import { supabase } from "@/lib/supabase";
import { Novelty } from "@/types";

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
    },
  
    async markAsViewed(noveltyId: string, userId: string): Promise<Novelty> {
      // First get the current novelty to add the user ID to the viewed array
      const { data: currentNovelty, error: fetchError } = await supabase
        .from('novelties')
        .select('viewed')
        .eq('id', noveltyId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentViewed = currentNovelty?.viewed || [];
      const updatedViewed = currentViewed.includes(userId) 
        ? currentViewed 
        : [...currentViewed, userId];
  
      const { data, error } = await supabase
        .from('novelties')
        .update({ viewed: updatedViewed })
        .eq('id', noveltyId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
};