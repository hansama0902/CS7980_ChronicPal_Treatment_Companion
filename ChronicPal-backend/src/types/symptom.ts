export interface ISymptomEntry {
  id: string;
  userId: string;
  date: Date;
  symptomType: string;
  severity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSymptomDto {
  date: string;
  symptomType: string;
  severity: number;
  notes?: string;
}

export interface IUpdateSymptomDto {
  date?: string;
  symptomType?: string;
  severity?: number;
  notes?: string;
}
