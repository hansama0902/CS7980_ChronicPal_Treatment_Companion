export interface IDietResult {
  id: string;
  userId: string;
  meal: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  purineLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number | null;
  aiAnalysis: string | null;
  date: Date;
  createdAt: Date;
}

export interface ICreateDietDto {
  meal: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: string;
}

export interface IDietQuery {
  from?: string;
  to?: string;
}

export interface IUpdateDietDto {
  meal: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: string;
}

export interface IDietFoodItem {
  name: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  purine: number;
}

export interface IDietAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  purineEstimate: number;
  foods: IDietFoodItem[];
  suggestion: string;
}
