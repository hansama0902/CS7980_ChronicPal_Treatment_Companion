export enum TreatmentType {
  INFUSION = 'INFUSION',
  MEDICATION = 'MEDICATION',
  CLINIC_VISIT = 'CLINIC_VISIT',
}

export interface ITreatmentEntry {
  id: string;
  userId: string;
  date: Date;
  type: TreatmentType;
  uricAcidLevel?: number | null;
  painScore?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTreatmentDto {
  date: string;
  type: TreatmentType;
  uricAcidLevel?: number;
  painScore?: number;
  notes?: string;
}

export interface IUpdateTreatmentDto {
  date?: string;
  type?: TreatmentType;
  uricAcidLevel?: number;
  painScore?: number;
  notes?: string;
}

export interface ITreatmentQuery {
  from?: string;
  to?: string;
}
