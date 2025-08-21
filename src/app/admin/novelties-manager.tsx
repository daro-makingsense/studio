"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Calendar as CalendarIcon, Megaphone, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { DataContext } from '@/context/DataContext';
import type { Novelty } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
                      className={cn('justify-start text-left font-normal', !field.value?.from && 'text-muted-foreground')}
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
  );
}

export default function NoveltiesManager({ canManageNovelties }: { canManageNovelties: boolean }) {
  const { novelties, addNovelty, updateNovelty, deleteNovelty } = React.useContext(DataContext);
  const [editingNovelty, setEditingNovelty] = React.useState<Novelty | null>(null);
  const [deletingNovelty, setDeletingNovelty] = React.useState<Novelty | null>(null);

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
  };

  const handleDeleteNovelty = async () => {
    if (deletingNovelty) {
      try {
        await deleteNovelty(deletingNovelty.id);
        setDeletingNovelty(null);
        alert('¡Novedad eliminada exitosamente!');
      } catch (error) {
        console.error('Error deleting novelty:', error);
        alert('Error al eliminar la novedad. Por favor, intenta de nuevo.');
      }
    }
  };

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
                              className={cn('justify-start text-left font-normal', !field.value?.from && 'text-muted-foreground')}
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
              [...novelties]
                .sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                .map(novelty => (
                  <Alert key={novelty.id} className="bg-blue-50 border-blue-200 relative pr-12">
                    <Megaphone className="h-4 w-4 !text-blue-600" />
                    <AlertTitle className="text-blue-800">{novelty.title}</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      <p>{novelty.description}</p>
                      <p className="text-xs mt-2 font-medium text-muted-foreground">
                        Vigente del {format(new Date(novelty.start), 'dd/MM/yyyy')} al {format(new Date(novelty.end), 'dd/MM/yyyy')}
                      </p>
                    </AlertDescription>
                    {canManageNovelties && (
                      <div className="absolute top-2 right-2 z-10 flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-blue-100 hover:text-blue-800" 
                          onClick={() => setEditingNovelty(novelty)}
                        >
                          <Edit className="h-4 w-4 text-blue-700" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-red-100 hover:text-red-800" 
                          onClick={() => setDeletingNovelty(novelty)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
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

      <AlertDialog open={!!deletingNovelty} onOpenChange={(isOpen) => !isOpen && setDeletingNovelty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La novedad "{deletingNovelty?.title}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingNovelty(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNovelty}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

