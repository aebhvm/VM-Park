export type UserRole = 'admin' | 'manager' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface VehicleType {
  id: string;
  name: string;
  icon: string; // 'car' | 'bike' | 'truck' | 'van'
  totalSpaces: number;
  active: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  vehicleTypeId: string;
  pricingType: 'hourly' | 'fixed' | 'fractional';
  toleranceMinutes: number;
  hourlyRate: number; // rate per hour or fraction
  fractionMinutes?: number; // e.g., 15-minute fractions
  fractionRate?: number; // rate per fraction
  dailyMax?: number; // maximum amount charged per day
  active: boolean;
}

export interface ParkingSession {
  id: string;
  ticketNumber: string;
  publicToken: string;
  normalizedPlate: string;
  displayPlate: string;
  vehicleTypeId: string;
  color?: string;
  model?: string;
  notes?: string;
  vaga?: string;
  entryType: 'avulso' | 'mensalista' | 'convenio' | 'cortesia';
  entryAt: string;
  exitAt?: string;
  status: 'active' | 'completed' | 'cancelled';
  calculatedAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: string;
  entryUserId: string;
  exitUserId?: string;
  justification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberPlan {
  id: string;
  name: string;
  amount: number;
  durationMonths: number;
  vehicleLimit: number;
  simultaneousLimit: number;
  active: boolean;
}

export interface Subscriber {
  id: string;
  name: string;
  document?: string;
  phone: string;
  email: string;
  planId: string;
  startsAt: string;
  expiresAt: string;
  dueDay: number;
  status: 'active' | 'pending' | 'expired' | 'suspended';
  amount: number;
  plates: string[]; // Plates allowed
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashSession {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  expectedClosingBalance: number;
  informedClosingBalance?: number;
  differenceAmount?: number;
  closingNotes?: string;
  status: 'open' | 'closed';
}

export interface FinancialTransaction {
  id: string;
  cashSessionId: string;
  parkingSessionId?: string;
  subscriberId?: string;
  type: 'recebimento_estacionamento' | 'recebimento_mensalidade' | 'receita_avulsa' | 'suprimento' | 'sangria' | 'despesa' | 'estorno' | 'ajuste';
  category: string;
  amount: number;
  paymentMethod: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro';
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplier?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousData?: string;
  newData?: string;
  reason?: string;
  createdAt: string;
}
