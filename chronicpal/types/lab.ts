export interface ILabResult {
  id: string;
  userId: string;
  date: Date;
  uricAcidLevel: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLabDto {
  date: string;
  uricAcidLevel: number;
  notes?: string;
}

export interface IUpdateLabDto {
  date?: string;
  uricAcidLevel?: number;
  notes?: string;
}

export interface ILabQuery {
  from?: string;
  to?: string;
}
