import { 
  ParkingSession, CashSession, FinancialTransaction, 
  Subscriber, Expense, AuditLog, User
} from '../types';

// Simple simulated auth header
export function getActiveUserId(): string {
  return localStorage.getItem('activeUserId') || 'user-3'; // Default to Lucas Lima (Operador)
}

export function setActiveUserId(id: string) {
  localStorage.setItem('activeUserId', id);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-User-Id', getActiveUserId());
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  
  return response.json();
}

export const api = {
  login: (identifier: string, password: string) => request<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  }),
  resetPassword: (email: string, password: string) => request<void>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getConfig: () => request<any>('/api/config'),
  updateConfig: (config: any) => request<any>('/api/config', { method: 'PUT', body: JSON.stringify(config) }),
  updatePricingPlan: (data: any) => request<any>('/api/pricing-plans', { method: 'PUT', body: JSON.stringify(data) }),
  updateSubscriberPlan: (data: any) => request<any>('/api/subscriber-plans', { method: 'PUT', body: JSON.stringify(data) }),
  anonymizePlate: (plate: string) => request<any>('/api/lgpd/anonymize', { method: 'POST', body: JSON.stringify({ plate }) }),
  
  getUsers: () => request<any[]>('/api/users'),
  createUser: (user: any) => request<any>('/api/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id: string, user: any) => request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  deleteUser: (id: string) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),
  
  getSessions: () => request<ParkingSession[]>('/api/parking/sessions'),
  findVehicleByPlate: (plate: string) => request<Pick<ParkingSession, 'vehicleTypeId' | 'brand' | 'model' | 'color' | 'customerPhone'> | null>(`/api/parking/vehicle/${plate}`),
  registerEntry: (data: {
    plate: string;
    vehicleTypeId: string;
    brand?: string;
    customerPhone?: string;
    color?: string;
    model?: string;
    notes?: string;
    vaga?: string;
    entryType: 'avulso' | 'mensalista' | 'convenio' | 'cortesia';
  }) => request<{ session: ParkingSession; subscriber?: Subscriber }>('/api/parking/entry', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  calculateCost: (sessionId: string, exitAt?: string) => request<{
    calculatedAmount: number;
    elapsedMinutes: number;
    pricingPlan: any;
  }>('/api/parking/calculate', {
    method: 'POST',
    body: JSON.stringify({ sessionId, exitAt })
  }),
  
  checkout: (data: {
    sessionId: string;
    paymentMethod: string;
    discountAmount?: number;
    customAmount?: number;
    justification?: string;
  }) => request<{ session: ParkingSession; transaction: FinancialTransaction }>('/api/parking/checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  cancelEntry: (sessionId: string, justification: string) => request<ParkingSession>('/api/parking/cancel', {
    method: 'POST',
    body: JSON.stringify({ sessionId, justification })
  }),
  
  getCashStatus: () => request<CashSession | null>('/api/cash/status'),
  getCashSessions: () => request<CashSession[]>('/api/cash/sessions'),
  openCash: (openingBalance: number) => request<CashSession>('/api/cash/open', {
    method: 'POST',
    body: JSON.stringify({ openingBalance })
  }),
  addCashTransaction: (data: {
    type: 'sangria' | 'suprimento';
    amount: number;
    description: string;
    paymentMethod?: string;
  }) => request<{ transaction: FinancialTransaction; cashSession: CashSession }>('/api/cash/transaction', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  closeCash: (informedClosingBalance: number, closingNotes: string) => request<CashSession>('/api/cash/close', {
    method: 'POST',
    body: JSON.stringify({ informedClosingBalance, closingNotes })
  }),
  
  getSubscribers: () => request<Subscriber[]>('/api/subscribers'),
  createSubscriber: (sub: any) => request<Subscriber>('/api/subscribers', {
    method: 'POST',
    body: JSON.stringify(sub)
  }),
  updateSubscriber: (id: string, sub: any) => request<Subscriber>(`/api/subscribers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sub)
  }),
  paySubscription: (id: string, paymentMethod: string) => request<{ subscriber: Subscriber; transaction: FinancialTransaction }>(`/api/subscribers/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod })
  }),
  
  getExpenses: () => request<Expense[]>('/api/expenses'),
  createExpense: (data: {
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    supplier?: string;
    payFromCash?: boolean;
  }) => request<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  getAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),
  getDashboardStats: () => request<any>('/api/dashboard/stats')
};
