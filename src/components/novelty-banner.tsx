'use client';

import React, { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Megaphone, X } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';

import type { Novelty, User } from '@/types';

interface NoveltyBannerProps {
  novelties: Novelty[];
  currentDate: Date | null;
  currentUser: User | null;
  onDismiss: (noveltyId: string, userId: string) => Promise<void>;
  mode?: 'week' | 'day';
}

export default function NoveltyBanner({ novelties, currentDate, currentUser, onDismiss, mode = 'day' }: NoveltyBannerProps) {
  const activeNovelties = useMemo(() => {
    if (!currentDate || !currentUser) return [];
    
    // First filter by date range
    let filteredNovelties: Novelty[];
    
    if (mode === 'week') {
      // Week mode: check for overlap between novelty interval and week interval
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      
      filteredNovelties = novelties.filter(n => {
        // Use string comparison to avoid timezone issues
        const weekStartString = format(weekStart, 'yyyy-MM-dd');
        const weekEndString = format(weekEnd, 'yyyy-MM-dd');

        // Check for overlap between novelty interval and week interval
        return n.start <= weekEndString && n.end >= weekStartString;
      });
    } else {
      // Day mode: check if the selected date is within the novelty interval using string comparison
      const currentDateString = format(currentDate, 'yyyy-MM-dd');
      filteredNovelties = novelties.filter(n => 
        currentDateString >= n.start && currentDateString <= n.end
      );
    }
    
    // Then filter out novelties that have already been viewed by the current user
    return filteredNovelties.filter(n => {
      const viewed = n.viewed || [];
      return !viewed.includes(currentUser.id);
    });
  }, [novelties, currentDate, currentUser, mode]);

  if (activeNovelties.length === 0) {
    return null;
  }

  const handleDismiss = async (noveltyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) return;
    
    try {
      await onDismiss(noveltyId, currentUser.id);
    } catch (error) {
      console.error('Error dismissing novelty:', error);
    }
  };

  return (
    <div className="mb-4 space-y-2">
      {activeNovelties.map(novelty => (
        <Alert key={novelty.id} className="bg-blue-50 border-blue-200 relative">
          <Megaphone className="h-4 w-4 !text-blue-600" />
          <AlertTitle className="text-blue-800 pr-8">{novelty.title}</AlertTitle>
          {novelty.description && (
            <AlertDescription className="text-blue-700">
              {novelty.description}
            </AlertDescription>
          )}
          <div className="absolute top-2 right-2 z-10 flex items-center justify-center">
            <Button 
              className="h-8 w-8 hover:bg-blue-100 hover:text-blue-800" 
              variant="ghost" 
              size="icon" 
              title="Descartar novedad"
              onClick={(e) => handleDismiss(novelty.id, e)}
            >
              <X className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}