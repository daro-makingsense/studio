import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { DataContext } from "@/context/DataContext";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";

const weekDays: { id: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday", label: string }[] = [
    { id: 'Monday', label: 'Lunes' },
    { id: 'Tuesday', label: 'Martes' },
    { id: 'Wednesday', label: 'Miércoles' },
    { id: 'Thursday', label: 'Jueves' },
    { id: 'Friday', label: 'Viernes' },
    { id: 'Saturday', label: 'Sábado' },
    { id: 'Sunday', label: 'Domingo' },
];

const newTaskFormSchema = z.object({
    title: z.string().min(2, 'El título debe tener al menos 2 caracteres.'),
    description: z.string().optional(),
    userId: z.string({ required_error: 'Por favor seleccione un usuario.' }),
    days: z.array(z.string()).optional(),
    startDate: z.date({ required_error: 'Por favor seleccione una fecha de inicio.' }),
    endDate: z.date().optional(),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')
      .optional()
      .or(z.literal('')),
    duration: z.coerce.number().optional().or(z.literal(0)),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum(['todo', 'in-progress', 'done']),
  }).refine(data => data.startDate || (data.days && data.days.length > 0), {
      message: "Debe seleccionar al menos una fecha de inicio o un día recurrente.",
      path: ["startDate"],
  }).refine(data => {
    if(data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  }, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["endDate"],
  });
  
export default function CreateTaskModal({ closeDialog, startDate, userId }: { closeDialog: () => void, startDate: Date | undefined, userId: string }) {
    const { users } = useContext(UserContext);
    const { addTask, refreshData } = useContext(DataContext);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof newTaskFormSchema>>({
      resolver: zodResolver(newTaskFormSchema),
      defaultValues: {
        title: '',
        description: '',
        userId: userId || '',
        days: [],
        priority: 'medium',
        status: 'todo',
        duration: 0,
        startTime: '',
        startDate: startDate || new Date(),
      },
    });
  
    async function onSubmit(values: z.infer<typeof newTaskFormSchema>) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...values,
        userId: userId || '',
        startDate: values.startDate.toISOString(),
        endDate: values.endDate?.toISOString() || undefined,
        days: values.days as Task['days'] || [],
        description: values.description || '',
      };
      try {
        await addTask(newTask);
        toast({
          variant: "success",
          title: "¡Éxito!",
          description: "¡Tarea creada exitosamente!",
        });
        closeDialog();
        refreshData();
      } catch (error) {
        console.error('Error creating task:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al crear la tarea. Por favor, inténtalo de nuevo.",
        });
      }
    }
    
    return (
      <div className="space-y-1">
        <div className="pb-4 border-b">
          <h2 className="text-xl font-bold">Crear Tarea</h2>
          <p className="text-sm text-muted-foreground">Complete los campos para crear una nueva tarea</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignar a</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar un usuario" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={'outline'} className={cn('pl-3 text-left font-normal w-full',!field.value && 'text-muted-foreground')}>
                            {field.value ? (format(field.value, 'PPP', { locale: es })) : (<span>Seleccionar fecha</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={'outline'} className={cn('pl-3 text-left font-normal w-full',!field.value && 'text-muted-foreground')}>
                            {field.value ? (format(field.value, 'PPP', { locale: es })) : (<span>Seleccionar fecha</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => form.getValues('startDate') ? date < form.getValues('startDate')! : false} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <div className="mb-3">
                    <FormLabel className="text-base">Días recurrentes</FormLabel>
                    <FormDescription className="text-sm">
                      Si se elige, la tarea se repetirá en los días seleccionados entre la fecha de inicio y fin.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <FormField
                      key={day.id}
                      control={form.control}
                      name="days"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day.id}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), day.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== day.id
                                        )
                                      )
                                }}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de inicio (opcional)</FormLabel>
                    <FormControl><Input placeholder="HH:mm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración en minutos (opcional)</FormLabel>
                    <FormControl><Input type="number" step="30" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar prioridad" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Notas</FormLabel>
                  <FormControl><Textarea placeholder="Detalles adicionales sobre la tarea..." className="min-h-[80px] resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button type="submit">Crear Tarea</Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }