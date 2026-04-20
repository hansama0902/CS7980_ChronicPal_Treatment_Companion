import { z } from 'zod';
import { isoDatetimeField } from './shared';

export const GenerateSummarySchema = z
  .object({
    startDate: isoDatetimeField('startDate'),
    endDate: isoDatetimeField('endDate'),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'startDate must be before endDate',
    path: ['startDate'],
  });

export type GenerateSummaryInput = z.infer<typeof GenerateSummarySchema>;
