'use client';

import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Task, User, Novelty } from '@/types';
import { Download, PlusCircle, Edit, Calendar as CalendarIcon, Trash2, Archive, User as UserIcon, Lock, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { DataContext } from '@/context/DataContext';
import { UserContext } from '@/context/UserContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


// --- SECCIÓN DE GESTIÓN DE TAREAS (ADMIN) ---

const priorityVariant = {
  low: 'secondary',
  medium: 'outline',
  high: 'destructive',
} as const;

const statusVariant = {
  todo: 'outline',
  'in-progress': 'default',
  done: 'secondary',
  archived: 'ghost',
} as const;

const dayMap: { [key: string]: string } = {
    Monday: 'Lun',
    Tuesday: 'Mar',
    Wednesday: 'Mié',
    Thursday: 'Jue',
    Friday: 'Vie',
    Saturday: 'Sáb',
    Sunday: 'Dom',
};

const weekDays: { id: Task['days'] extends (infer U)[] ? U : never, label: string }[] = [
    { id: 'Monday', label: 'Lunes' },
    { id: 'Tuesday', label: 'Martes' },
    { id: 'Wednesday', label: 'Miércoles' },
    { id: 'Thursday', label: 'Jueves' },
    { id: 'Friday', label: 'Viernes' },
    { id: 'Saturday', label: 'Sábado' },
    { id: 'Sunday', label: 'Domingo' },
];

const statusMap: { [key: string]: string } = {
    todo: 'Por hacer',
    'in-progress': 'En progreso',
    done: 'Hecho',
    archived: 'Archivado',
};

const taskFormSchema = z.object({
  id: z.string(),
  title: z.string().min(2, "El título debe tener al menos 2 caracteres."),
  description: z.string().optional(),
  userId: z.string({ required_error: "Por favor seleccione un usuario." }),
  days: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startTime: z.string().optional(),
  duration: z.coerce.number().optional().or(z.literal(0)),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in-progress", "done", "archived"]),
  notes: z.string().optional(),
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


type TaskFormValues = z.infer<typeof taskFormSchema>;

function EditTaskForm({ task, onUpdate, onDelete, closeDialog }: { task: Task, onUpdate: (values: Task) => void, onDelete: (taskId: string) => void, closeDialog: () => void }) {
    const { users } = useContext(UserContext);

    if (!task) {
        return null;
    }

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            ...task,
            days: task.days || [],
            startDate: task.startDate ? new Date(task.startDate) : undefined,
            endDate: task.endDate ? new Date(task.endDate) : undefined,
            description: task.description || '',
            notes: task.notes || '',
            startTime: task.startTime || '',
            duration: task.duration || 0,
        },
    });

    const selectedUserId = useWatch({ control: form.control, name: 'userId' });

    function onSubmit(values: TaskFormValues) {
        onUpdate({
            ...values,
            startTime: values.startTime === 'none' ? '' : values.startTime,
            description: values.description ?? '',
        });
        closeDialog();
    }

    const handleArchive = () => {
        onUpdate({ ...task, status: 'archived' });
        closeDialog();
    }

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem><FormLabel>Asignar a</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar un usuario" /></SelectTrigger></FormControl><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio</FormLabel>
                         <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
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
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => form.getValues('startDate') ? date < form.getValues('startDate')! : false}
                            />
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
                      <div className="mb-4">
                        <FormLabel className="text-base">Días recurrentes</FormLabel>
                        <FormDescription>
                          Seleccione los días en que esta tarea se repetirá.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                      {weekDays.map((day) => (
                        <FormField
                          key={day.id}
                          control={form.control}
                          name="days"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
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
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
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

                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de inicio (opcional)</FormLabel>
                        <FormControl><Input placeholder="HH:mm" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem><FormLabel>Duración en minutos</FormLabel><FormControl><Input type="number" step="30" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   
                    <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem><FormLabel>Prioridad</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar prioridad" /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Baja</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="todo">Por hacer</SelectItem><SelectItem value="in-progress">En progreso</SelectItem><SelectItem value="done">Hecho</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                </div>
                
                 <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notas Adicionales</FormLabel><FormControl><Textarea placeholder="Añada notas o comentarios sobre la tarea..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="flex justify-between gap-2 pt-4">
                    <div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" ><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(task.id)}>Continuar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" /> Archivar</Button>
                        <Button type="submit">Guardar Cambios</Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}

function AdminTasksTable({ tasks, onEdit }: { tasks: Task[], onEdit: (task: Task) => void }) {
    const { users } = useContext(UserContext);
    if (tasks.length === 0) {
        return (
            <div className="h-24 text-center flex justify-center items-center">
                No se encontraron tareas con los filtros actuales.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Programación</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                        <div className="font-bold">{task.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</div>
                    </TableCell>
                    <TableCell>{users.find((u) => u.id === task.userId)?.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {task.startDate && (
                          <Badge variant="outline">
                            Inicio: {format(new Date(task.startDate), 'd MMM yyyy', {locale: es})}
                          </Badge>
                        )}
                        {task.endDate && (
                          <Badge variant="outline">
                            Fin: {format(new Date(task.endDate), 'd MMM yyyy', {locale: es})}
                          </Badge>
                        )}
                        {task.days && task.days.length > 0 && <div className="flex gap-1 flex-wrap">{task.days.map(d => <Badge variant="secondary" key={d}>{dayMap[d]}</Badge>)}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[task.priority]} className="capitalize">
                        {task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : 'Alta'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[task.status as keyof typeof statusVariant]} className="capitalize">
                        {statusMap[task.status as keyof typeof statusMap]}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
    )
}


const newTaskFormSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres.'),
  description: z.string().optional(),
  userId: z.string({ required_error: 'Por favor seleccione un usuario.' }),
  days: z.array(z.string()).optional(),
  startDate: z.date().optional(),
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

function TaskCreatorForm({ closeDialog }: { closeDialog: () => void }) {
  const { users } = useContext(UserContext);
  const { addTask } = useContext(DataContext);
  
  const form = useForm<z.infer<typeof newTaskFormSchema>>({
    resolver: zodResolver(newTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      userId: '',
      days: [],
      priority: 'medium',
      status: 'todo',
      duration: 0,
      startTime: '',
    },
  });

  function onSubmit(values: z.infer<typeof newTaskFormSchema>) {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...values,
      days: values.days as Task['days'] || [],
      description: values.description || '',
    };
    addTask(newTask);
    alert('¡Tarea creada exitosamente!');
    closeDialog();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={'outline'} className={cn('pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
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
                      <Button variant={'outline'} className={cn('pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
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
              <div className="mb-4">
                <FormLabel className="text-base">Días recurrentes</FormLabel>
                <FormDescription>
                  Si se elige, la tarea se repetirá en los días seleccionados entre la fecha de inicio y fin.
                </FormDescription>
              </div>
              <div className="grid grid-cols-4 gap-2">
              {weekDays.map((day) => (
                <FormField
                  key={day.id}
                  control={form.control}
                  name="days"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={day.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
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
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
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
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              <FormControl><Textarea placeholder="" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Cancelar</Button>
            <Button type="submit">Crear Tarea</Button>
        </div>
      </form>
    </Form>
  );
}

function TasksManager() {
  const { tasks, updateTask, deleteTask } = useContext(DataContext);
  const { users, currentUser } = useContext(UserContext);
  const [filters, setFilters] = useState({
    user: 'all',
    status: 'all',
    day: 'all',
    searchTerm: '',
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const userMatch = filters.user === 'all' || task.userId === filters.user;
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const dayMatch = filters.day === 'all' || (task.days && task.days.includes(filters.day));
      const searchMatch =
        filters.searchTerm === '' ||
        task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      return userMatch && statusMatch && dayMatch && searchMatch;
    });
  }, [tasks, filters]);

  const activeTasks = useMemo(() => filteredTasks.filter(t => t.status !== 'archived'), [filteredTasks]);
  const archivedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'archived'), [filteredTasks]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleUpdateTask = (updatedTask: Task) => {
    updateTask(updatedTask);
    setEditingTask(null);
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setEditingTask(null);
  }

  const exportToCSV = (tasksToExport: Task[]) => {
    const headers = ['ID', 'Título', 'Descripción', 'Usuario', 'Días Recurrentes', 'Fecha Inicio', 'Fecha Fin', 'Prioridad', 'Estado', 'Notas'];
    const rows = tasksToExport.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      users.find(u => u.id === task.userId)?.name || '',
      task.days ? `"${task.days.map(d => dayMap[d]).join(', ')}"` : '',
      task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
      task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '',
      task.priority,
      statusMap[task.status as keyof typeof statusMap] || task.status,
      `"${(task.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lista_de_tareas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const [isTaskCreatorOpen, setIsTaskCreatorOpen] = useState(false);

  if (!isClient) {
    return <Card><CardHeader><CardTitle>Cargando Tareas...</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
            <CardTitle>Gestor Completo de Tareas</CardTitle>
            <CardDescription>
                Cree, edite, filtre y exporte todas las tareas del sistema.
            </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => setIsTaskCreatorOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Tarea
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(filteredTasks)}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Todo
                </Button>
            </div>
        </div>
        <div className="mt-4 flex flex-col md:flex-row gap-2">
            <Input
            placeholder="Buscar por título o descripción..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="max-w-sm"
            />
            <Select
            value={filters.user}
            onValueChange={(value) => handleFilterChange('user', value)}
            >
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por usuario" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Usuarios</SelectItem>
                {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                    {user.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>

            <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
            >
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="todo">Por hacer</SelectItem>
                <SelectItem value="in-progress">En progreso</SelectItem>
                <SelectItem value="done">Hecho</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
            </Select>

            <Select
            value={filters.day}
            onValueChange={(value) => handleFilterChange('day', value)}
            >
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por día" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Días</SelectItem>
                {Object.entries(dayMap).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="active">
             <TabsList className="mb-4">
                <TabsTrigger value="active">Activas</TabsTrigger>
                <TabsTrigger value="archived">Archivadas</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
                <AdminTasksTable tasks={activeTasks} onEdit={setEditingTask} />
            </TabsContent>
            <TabsContent value="archived">
                <AdminTasksTable tasks={archivedTasks} onEdit={setEditingTask} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
      
    <Dialog open={!!editingTask} onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}>
        <DialogContent className="max-w-2xl grid-rows-[auto,1fr,auto] p-0 max-h-[90dvh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Editar Tarea</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-6">
              {editingTask && (
                <EditTaskForm
                  task={editingTask}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  closeDialog={() => setEditingTask(null)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
    </Dialog>

    <Dialog open={isTaskCreatorOpen} onOpenChange={setIsTaskCreatorOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
            </DialogHeader>
            <TaskCreatorForm closeDialog={() => setIsTaskCreatorOpen(false)}/>
        </DialogContent>
    </Dialog>
    </>
  );
}


// --- SECCIÓN DE GESTIÓN DE USUARIOS ---

const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;

const profileFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  positions: z.array(z.object({
    fullName: z.string().min(2, 'El nombre completo del cargo es requerido.'),
    shortName: z.string().min(1, 'La abreviatura es requerida.').max(15, 'Máximo 15 caracteres.'),
  })).min(1, 'Se requiere al menos un cargo.').max(3, 'Se permiten hasta 3 cargos.'),
  email: z.string().email(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Debe ser un color hexadecimal válido'),
  frequentTasks: z.string().optional(),
  workHours: z.record(
    z.object({
      active: z.boolean(),
      virtual: z.boolean(),
      start: z.string().optional(),
      end: z.string().optional(),
    })
  ).refine(data => {
      for (const day in data) {
          const { active, start, end } = data[day];
          if (active) {
            if ((start && !end) || (!start && end)) return false;
            if (start && end) {
              if(!timeRegex.test(start) || !timeRegex.test(end)) return false;
              if (start >= end) return false;
            }
          }
      }
      return true;
  }, {
      message: "Si un día está activo, la hora de inicio debe ser anterior a la hora de finalización. Ambas deben ser horas válidas o estar en blanco."
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function UserProfileForm({ user, onUpdate, canEdit }: { user: User, onUpdate: (values: User) => void, canEdit: boolean }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      ...user,
      email: `${user.name.split(' ')[0].toLowerCase()}@taskcanvas.com`,
      frequentTasks: user.frequentTasks.join('\n'),
      workHours: {
        Monday: { active: user.workHours.Monday?.active || false, virtual: user.workHours.Monday?.virtual || false, start: user.workHours.Monday?.start || '', end: user.workHours.Monday?.end || '' },
        Tuesday: { active: user.workHours.Tuesday?.active || false, virtual: user.workHours.Tuesday?.virtual || false, start: user.workHours.Tuesday?.start || '', end: user.workHours.Tuesday?.end || '' },
        Wednesday: { active: user.workHours.Wednesday?.active || false, virtual: user.workHours.Wednesday?.virtual || false, start: user.workHours.Wednesday?.start || '', end: user.workHours.Wednesday?.end || '' },
        Thursday: { active: user.workHours.Thursday?.active || false, virtual: user.workHours.Thursday?.virtual || false, start: user.workHours.Thursday?.start || '', end: user.workHours.Thursday?.end || '' },
        Friday: { active: user.workHours.Friday?.active || false, virtual: user.workHours.Friday?.virtual || false, start: user.workHours.Friday?.start || '', end: user.workHours.Friday?.end || '' },
        Saturday: { active: user.workHours.Saturday?.active || false, virtual: user.workHours.Saturday?.virtual || false, start: user.workHours.Saturday?.start || '', end: user.workHours.Saturday?.end || '' },
        Sunday: { active: user.workHours.Sunday?.active || false, virtual: user.workHours.Sunday?.virtual || false, start: user.workHours.Sunday?.start || '', end: user.workHours.Sunday?.end || '' },
      }
    },
    disabled: !canEdit,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "positions",
  });

  const watchedWorkHours = form.watch('workHours');

  function onSubmit(values: ProfileFormValues) {
    const updatedUser: User = {
        ...user,
        ...values,
        frequentTasks: values.frequentTasks?.split('\n').filter(task => task.trim() !== '') || [],
        workHours: (Object.fromEntries(
          Object.entries(values.workHours).map(([day, hours]) => [
            day,
            { 
              active: hours.active,
              virtual: hours.virtual,
              start: hours.active ? hours.start : undefined,
              end: hours.active ? hours.end : undefined,
            },
          ])
        ) as { [key: string]: any }),
    };
    onUpdate(updatedUser);
    alert('¡Perfil actualizado exitosamente!');
  }

  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayTranslations: { [key: string]: string } = {
      Monday: 'Lunes',
      Tuesday: 'Martes',
      Wednesday: 'Miércoles',
      Thursday: 'Jueves',
      Friday: 'Viernes',
  }

  const formatTime = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <div>
          <FormLabel>Cargos</FormLabel>
          <FormDescription className="mb-2">
            El cargo principal del usuario. Puede agregar hasta 3.
          </FormDescription>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name={`positions.${index}.fullName`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`positions.${index}.shortName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Abreviatura</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {canEdit && fields.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {canEdit && fields.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ fullName: '', shortName: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Cargo
            </Button>
          )}
           {form.formState.errors.positions && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.positions.message}
              </p>
            )}
        </div>

        <FormField
          control={form.control}
          name="frequentTasks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tareas Frecuentes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Liste las tareas que realiza con frecuencia, una por línea."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Estas pueden ser usadas para poblar rápidamente su agenda semanal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-medium mb-4">Horario laboral</h3>
          <div className="space-y-4">
            {workDays.map((day) => (
              <div key={day} className={cn("p-4 rounded-md border transition-colors", watchedWorkHours[day]?.active ? 'bg-muted/50' : '')}>
                <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name={`workHours.${day}.active`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canEdit}
                            />
                          </FormControl>
                          <FormLabel className="text-base font-semibold">
                            {dayTranslations[day]}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name={`workHours.${day}.virtual`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!watchedWorkHours[day]?.active || !canEdit}
                              />
                            </FormControl>
                            <FormLabel>Virtual</FormLabel>
                          </FormItem>
                        )}
                      />
                </div>
                {watchedWorkHours[day]?.active && (
                    <div className="flex items-center gap-4 pt-4">
                       <FormField
                        control={form.control}
                        name={`workHours.${day}.start`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inicio</FormLabel>
                            <FormControl>
                              <Input 
                                  {...field} 
                                  placeholder="HH:mm"
                                  onChange={e => field.onChange(formatTime(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`workHours.${day}.end`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fin</FormLabel>
                            <FormControl>
                              <Input 
                                  {...field} 
                                  placeholder="HH:mm"
                                  onChange={e => field.onChange(formatTime(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                )}
              </div>
            ))}
          </div>
          <FormDescription className="mt-2">
            Active un día para habilitar la configuración de su horario. Los días marcados como virtuales se destacarán en la agenda.
          </FormDescription>
           {form.formState.errors.workHours && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.workHours.message}
              </p>
            )}
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Asociado</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="color" className="w-12 h-10 p-1" {...field} />
                  <Input className="w-32" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                Este color se usará para identificarlo en algunas partes de la aplicación.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {canEdit && <Button type="submit">Actualizar Perfil</Button>}
      </form>
    </Form>
  );
}

function UsersManager({ canManageUsers }: { canManageUsers: boolean }) {
  const { users, setUsers } = useContext(UserContext);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleAddUser = () => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: `Nuevo Usuario`,
        positions: [{ fullName: 'Sin Asignar', shortName: 'N/A' }],
        role: 'user',
        workHours: {
            Monday: { active: false, virtual: false },
            Tuesday: { active: false, virtual: false },
            Wednesday: { active: false, virtual: false },
            Thursday: { active: false, virtual: false },
            Friday: { active: false, virtual: false },
            Saturday: { active: false, virtual: false },
            Sunday: { active: false, virtual: false },
        },
        frequentTasks: [],
        color: '#888888',
      };
      setUsers(currentUsers => [...currentUsers, newUser]);
      alert("Nuevo usuario agregado. Edite su perfil para configurarlo.");
  }


  if (!isClient) {
    return <Card><CardHeader><CardTitle>Cargando Usuarios...</CardTitle></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Perfiles de Usuario</CardTitle>
                <CardDescription>
                    {canManageUsers 
                        ? "Vea y administre la información y configuración de los usuarios."
                        : "Vea la información de los usuarios."
                    }
                </CardDescription>
            </div>
            {canManageUsers && (
                <Button onClick={handleAddUser}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Usuario
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
            {users.map((user) => (
            <AccordionItem value={user.id} key={user.id}>
                <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <UserIcon className="h-6 w-6" style={{color: user.color, fill: `${user.color}33`}}/>
                        </div>
                        <div className="flex-1 text-left">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {user.positions.map(p => p.fullName).join(' / ')}
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                    <UserProfileForm user={user} onUpdate={handleUpdateUser} canEdit={canManageUsers} />
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// --- SECCIÓN DE GESTIÓN DE NOVEDADES ---

const noveltyFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().optional(),
  date: z.object({
    from: z.date({ required_error: 'Se requiere una fecha de inicio.' }),
    to: z.date({ required_error: 'Se requiere una fecha de fin.' }),
  }, { required_error: 'Debe seleccionar un rango de fechas.' }),
}).refine(data => data.date.to >= data.date.from, {
  message: 'La fecha de fin no puede ser anterior a la de inicio.',
  path: ['date'],
});

type NoveltyFormValues = z.infer<typeof noveltyFormSchema>;

function EditNoveltyForm({ novelty, onUpdate, closeDialog }: { novelty: Novelty, onUpdate: (values: Novelty) => void, closeDialog: () => void }) {
    const form = useForm<NoveltyFormValues>({
        resolver: zodResolver(noveltyFormSchema),
        defaultValues: {
            id: novelty.id,
            title: novelty.title,
            description: novelty.description,
            date: {
                from: new Date(novelty.start),
                to: new Date(novelty.end),
            }
        },
    });

    function onSubmit(values: NoveltyFormValues) {
        onUpdate({
            id: values.id!,
            title: values.title,
            description: values.description || '',
            start: values.date.from.toISOString(),
            end: values.date.to.toISOString(),
            updatedAt: new Date().toISOString(),
        });
        closeDialog();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Semana de Vigencia</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id="date"
                                variant={'outline'}
                                className={cn(
                                  'justify-start text-left font-normal',
                                  !field.value?.from && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.from ? (
                                  field.value.to ? (
                                    <>
                                      {format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}
                                    </>
                                  ) : (
                                    format(field.value.from, 'LLL dd, y')
                                  )
                                ) : (
                                  <span>Seleccionar rango</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={field.value?.from}
                              selected={field.value}
                              onSelect={field.onChange}
                              numberOfMonths={1}
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={closeDialog}>Cancelar</Button>
                    <Button type="submit">Guardar Cambios</Button>
                  </div>
            </form>
        </Form>
    )
}

function NoveltiesManager({ canManageNovelties }: { canManageNovelties: boolean }) {
  const { novelties, addNovelty, updateNovelty } = useContext(DataContext);
  const [editingNovelty, setEditingNovelty] = useState<Novelty | null>(null);

  const form = useForm<z.infer<typeof noveltyFormSchema>>({
    resolver: zodResolver(noveltyFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof noveltyFormSchema>) {
    const newNovelty: Novelty = {
      id: `novelty-${Date.now()}`,
      title: values.title,
      description: values.description,
      start: values.date.from.toISOString(),
      end: values.date.to.toISOString(),
    };
    addNovelty(newNovelty);
    alert('¡Novedad creada exitosamente!');
    form.reset();
  }

  const handleUpdateNovelty = (updatedNovelty: Novelty) => {
    updateNovelty(updatedNovelty);
    setEditingNovelty(null);
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {canManageNovelties && (
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Crear Nuevo Aviso</CardTitle>
            <CardDescription>Complete el formulario para publicar una nueva novedad.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Rango de Vigencia</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              id="date"
                              variant={'outline'}
                              className={cn(
                                'justify-start text-left font-normal',
                                !field.value?.from && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value?.from ? (
                                field.value.to ? (
                                  <>
                                    {format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}
                                  </>
                                ) : (
                                  format(field.value.from, 'LLL dd, y')
                                )
                              ) : (
                                <span>Seleccionar rango</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={field.value?.from}
                            selected={field.value}
                            onSelect={field.onChange}
                            numberOfMonths={1}
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        La novedad aparecerá durante las fechas seleccionadas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Publicar Novedad</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      <div className={cn("space-y-4", canManageNovelties ? "md:col-span-2" : "md:col-span-3")}>
        <Card>
          <CardHeader>
            <CardTitle>Historial de Novedades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-auto pr-4">
              {novelties.length > 0 ? (
                [...novelties].sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime()).map(novelty => (
                  <Alert key={novelty.id} className="bg-blue-50 border-blue-200 relative pr-10">
                      <Megaphone className="h-4 w-4 !text-blue-600" />
                      <AlertTitle className="text-blue-800">{novelty.title}</AlertTitle>
                      <AlertDescription className="text-blue-700">
                         <p>{novelty.description}</p>
                         <p className="text-xs mt-2 text-blue-600 font-medium">
                          Vigente del {format(new Date(novelty.start), 'dd/MM/yyyy')} al {format(new Date(novelty.end), 'dd/MM/yyyy')}
                         </p>
                      </AlertDescription>
                      {canManageNovelties && (
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setEditingNovelty(novelty)}>
                              <Edit className="h-4 w-4" />
                          </Button>
                      )}
                  </Alert>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay novedades publicadas.</p>
              )}
            </CardContent>
          </Card>
      </div>
       <Dialog open={!!editingNovelty} onOpenChange={(isOpen) => !isOpen && setEditingNovelty(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Novedad</DialogTitle>
          </DialogHeader>
          <div className="py-4">
              {editingNovelty && (
                <EditNoveltyForm
                  novelty={editingNovelty}
                  onUpdate={handleUpdateNovelty}
                  closeDialog={() => setEditingNovelty(null)}
                />
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ADMIN ---

export default function AdminPage() {
    const { currentUser } = useContext(UserContext);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const canAccessAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    if (!isClient) {
        return (
            <div className="container mx-auto py-10">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!canAccessAdmin) {
        return (
            <div className="container mx-auto py-10 flex flex-col items-center justify-center text-center">
                <Lock className="h-16 w-16 text-destructive mb-4"/>
                <h1 className="text-3xl font-bold font-headline">Acceso Denegado</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    No tienes los permisos necesarios para acceder a esta sección.
                </p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10">
             <h1 className="text-3xl font-bold font-headline mb-6">Panel de Administración</h1>
             <Tabs defaultValue="tasks">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="tasks">Gestionar Tareas</TabsTrigger>
                    <TabsTrigger value="users">Gestionar Usuarios</TabsTrigger>
                    <TabsTrigger value="novelties">Gestionar Novedades</TabsTrigger>
                </TabsList>
                 <TabsContent value="tasks">
                    <TasksManager />
                </TabsContent>
                <TabsContent value="users">
                    <UsersManager canManageUsers={canAccessAdmin} />
                </TabsContent>
                <TabsContent value="novelties">
                    <NoveltiesManager canManageNovelties={canAccessAdmin} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
