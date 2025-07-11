import { z } from 'zod';

export const socioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido'], {
    required_error: 'Estado es requerido',
  }),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  montoCuota: z.number().min(0, 'La cuota debe ser mayor o igual a 0').optional(),
  numeroSocio: z.string().optional(),
  fechaVencimiento: z.date().optional(),
});

export const socioUpdateSchema = socioSchema.partial().extend({
  id: z.string().min(1, 'ID es requerido'),
});

export const socioFilterSchema = z.object({
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']).optional(),
  estadoMembresia: z.enum(['al_dia', 'vencido', 'pendiente']).optional(),
  search: z.string().optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
});

export type SocioFormData = z.infer<typeof socioSchema>;
export type SocioUpdateData = z.infer<typeof socioUpdateSchema>;
export type SocioFilterData = z.infer<typeof socioFilterSchema>;