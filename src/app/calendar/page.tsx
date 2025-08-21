'use client';

import React from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  add,
  sub,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info, Ban, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CalendarEvent } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const currentUserId = 'user-1';

const eventFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  start: z.date({ required_error: "La fecha de inicio es requerida." }),
  end: z.date({ required_error: "La fecha de fin es requerida." }),
  type: z.enum(["info", "blocker"]),
  description: z.string().optional(),
}).refine(data => data.end >= data.start, {
  message: "La fecha de fin no puede ser anterior a la de inicio.",
  path: ["end"],
});

export default function CalendarPage() {
  const { users } = React.useContext(UserContext);
  const { calendarEvents, addCalendarEvent } = React.useContext(DataContext);
  const currentUser = users.find(u => u.id === currentUserId);
  const canEditCalendar = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const [currentDate, setCurrentDate] = React.useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrentDate(new Date());
  }, []);


  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "info",
    }
  });

  if (!currentDate) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <p>Cargando calendario...</p>
        </div>
    );
  }

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { locale: es }),
    end: endOfWeek(lastDayOfMonth, { locale: es }),
  });

  const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
  const prevMonth = () => setCurrentDate(sub(currentDate, { months: 1 }));

  function onSubmit(values: z.infer<typeof eventFormSchema>) {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      description: values.description ?? '',
      ...values,
      start: values.start.toISOString(),
      end: values.end.toISOString(),
    };
    addCalendarEvent(newEvent);
    alert("¡Evento creado exitosamente!");
    setIsFormOpen(false);
    form.reset();
  }

  return (
    <TooltipProvider>
    <div className="flex h-full flex-col">
      {/* Header with just title */}
      <div className="pb-4">
        <h1 className="text-3xl font-bold font-headline">Calendario</h1>
      </div>
      
      {/* Navigation and add event button on same line */}
      <div className="flex items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} className="bg-white shadow-sm border-gray-300 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold capitalize px-4">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth} className="bg-white shadow-sm border-gray-300 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Add event button */}
        {canEditCalendar && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="start"
                          render={({ field }) => (
                              <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Inicio</FormLabel>
                              <Popover>
                                  <PopoverTrigger asChild>
                                  <FormControl>
                                      <Button
                                      variant={"outline"}
                                      className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                      )}
                                      >
                                      {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                      </Button>
                                  </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                  </PopoverContent>
                              </Popover>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                       <FormField
                          control={form.control}
                          name="end"
                          render={({ field }) => (
                              <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Fin</FormLabel>
                              <Popover>
                                  <PopoverTrigger asChild>
                                  <FormControl>
                                      <Button
                                      variant={"outline"}
                                      className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                      )}
                                      >
                                      {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                      </Button>
                                  </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < form.getValues('start')} initialFocus />
                                  </PopoverContent>
                              </Popover>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                  <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Tipo de Evento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              <SelectItem value="info">Informativo</SelectItem>
                              <SelectItem value="blocker">Bloqueo</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (Opcional)</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Guardar Evento</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="grid grid-cols-7 border-b">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="p-4 text-center font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid h-[calc(100%-4rem)] grid-cols-7 grid-rows-6">
          {daysInMonth.map((day) => {
             const eventsOnDay = calendarEvents.filter((event) => 
                isWithinInterval(day, { start: new Date(event.start), end: new Date(event.end) })
             );
            return (
              <div
                key={day.toString()}
                className={cn(
                  'border-b border-r p-2 flex flex-col',
                  !isSameMonth(day, currentDate) && 'bg-muted/50 text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full self-start',
                    isToday(day) && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1 overflow-auto">
                  {eventsOnDay.map((event) => (
                    <Tooltip key={event.id}>
                        <TooltipTrigger asChild>
                             <div className={cn(
                                "flex items-center gap-2 p-1.5 rounded-md text-white text-xs cursor-pointer",
                                event.type === 'blocker' ? 'bg-destructive' : 'bg-blue-500'
                             )}>
                               {event.type === 'blocker' ? <Ban className="h-3 w-3 shrink-0"/> : <Info className="h-3 w-3 shrink-0" />}
                               <p className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-bold">{event.title}</p>
                            {event.description && <p>{event.description}</p>}
                        </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
