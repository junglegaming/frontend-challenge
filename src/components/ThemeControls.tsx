import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Toaster } from './ui/sonner';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './ui/form';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './ui/tooltip';

const colors = [
  'ink',
  'surface-card',
  'surface-raised',
  'surface-dark',
  'border',
  'border-soft',
  'foreground',
  'text-secondary',
  'text-accent',
  'primary',
  'primary-light',
  'primary-dark',
  'secondary',
  'amber',
  'coral',
  'success',
  'error',
  'elevated-light',
  'gray-light',
  'white',
  'black',
];

export function ThemeControls() {
  const form = useForm<{ name: string }>({
    resolver: zodResolver(
      z.object({ name: z.string().trim().min(1, 'Informe um nome.') })
    ),
    defaultValues: { name: '' },
  });
  return (
    <section className="space-y-6">
      <h2 className="text-h2">Conferência de tokens e componentes</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {colors.map((color) => (
          <div key={color} className="rounded-default min-w-0 border p-3">
            <div
              className="mb-2 h-12 rounded-sm border"
              style={{ background: `var(--color-${color})` }}
            />
            <code className="text-caption">{color}</code>
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-4">
          <Badge>Badge</Badge>
          <Skeleton className="h-8 w-full" />
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(() =>
                toast.success('Formulário validado')
              )}
            >
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Informe um nome.' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Campo obrigatório para demonstrar validação.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Validar</Button>
            </form>
          </Form>
          <Select defaultValue="art">
            <SelectTrigger aria-label="Categoria">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="art">Arte digital</SelectItem>
              <SelectItem value="collection">Colecionáveis</SelectItem>
            </SelectContent>
          </Select>
          <Input
            disabled
            aria-label="Campo desabilitado"
            placeholder="Desabilitado"
          />
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Diálogo</DialogTitle>
                  <DialogDescription>
                    Superfície, foco e fechamento por Escape.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Painel</SheetTitle>
                  <SheetDescription>Drawer adaptado ao tema.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost">Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>Texto de apoio</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={() => toast.error('Exemplo de erro com ícone e texto')}
            >
              Toast
            </Button>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </section>
  );
}
