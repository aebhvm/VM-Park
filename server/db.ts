import { neon } from '@neondatabase/serverless';
import type {
  User, VehicleType, PricingPlan, ParkingSession, 
  SubscriberPlan, Subscriber, CashSession, 
  FinancialTransaction, Expense, AuditLog 
} from '../src/types.js';

const STATE_ID = 'primary';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada. Defina a conexão do Neon antes de iniciar a API.');
  }
  return neon(connectionString);
}

export interface DatabaseSchema {
  users: User[];
  vehicleTypes: VehicleType[];
  pricingPlans: PricingPlan[];
  parkingSessions: ParkingSession[];
  subscriberPlans: SubscriberPlan[];
  subscribers: Subscriber[];
  cashSessions: CashSession[];
  transactions: FinancialTransaction[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  parkingLotConfig: {
    name: string;
    document: string;
    phone: string;
    address: string;
    timezone: string;
    totalSpaces: number;
    toleranceMinutes: number;
    allowMidnightOver: boolean;
    logoUrl?: string;
    lgpdTerm?: string;
    lgpdDpoName?: string;
    lgpdDpoEmail?: string;
    lgpdDpoPhone?: string;
    lgpdMaskPlatesOld?: boolean;
    lgpdMaskDays?: number;
    lgpdConsentRequired?: boolean;
  };
}

const defaultData: DatabaseSchema = {
  users: [
    {
      id: 'user-1',
      name: 'Carlos Alberto (Admin)',
      email: 'admin@parkgestor.com.br',
      username: 'admin',
      password: '123456',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Renata Souza (Gerente)',
      email: 'gerente@parkgestor.com.br',
      username: 'gerente',
      password: '123456',
      role: 'manager',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-3',
      name: 'Lucas Lima (Operador)',
      email: 'operador@parkgestor.com.br',
      username: 'operador',
      password: '123456',
      role: 'operator',
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  vehicleTypes: [
    { id: 'type-1', name: 'Carro', icon: 'car', totalSpaces: 50, active: true },
    { id: 'type-2', name: 'Moto', icon: 'bike', totalSpaces: 30, active: true },
    { id: 'type-3', name: 'Caminhonete/Van', icon: 'truck', totalSpaces: 10, active: true }
  ],
  pricingPlans: [
    {
      id: 'plan-car',
      name: 'Tabela Padrão - Carro',
      vehicleTypeId: 'type-1',
      pricingType: 'hourly',
      toleranceMinutes: 15,
      hourlyRate: 8.00,
      dailyMax: 45.00,
      active: true
    },
    {
      id: 'plan-moto',
      name: 'Tabela Padrão - Moto',
      vehicleTypeId: 'type-2',
      pricingType: 'hourly',
      toleranceMinutes: 15,
      hourlyRate: 4.00,
      dailyMax: 25.00,
      active: true
    },
    {
      id: 'plan-truck',
      name: 'Tabela Padrão - Grande',
      vehicleTypeId: 'type-3',
      pricingType: 'hourly',
      toleranceMinutes: 15,
      hourlyRate: 12.00,
      dailyMax: 60.00,
      active: true
    }
  ],
  parkingSessions: [
    {
      id: 'session-completed-1',
      ticketNumber: 'TKT-00101',
      publicToken: '9b1deb4d',
      normalizedPlate: 'BRA2E19',
      displayPlate: 'BRA-2E19',
      vehicleTypeId: 'type-1',
      color: 'Preto',
      model: 'Hyundai HB20',
      entryType: 'avulso',
      entryAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4h ago
      exitAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h ago
      status: 'completed',
      calculatedAmount: 16.00, // 2 hours
      discountAmount: 0.00,
      finalAmount: 16.00,
      paymentMethod: 'dinheiro',
      entryUserId: 'user-3',
      exitUserId: 'user-3',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'session-completed-2',
      ticketNumber: 'TKT-00102',
      publicToken: '7f3a8b2c',
      normalizedPlate: 'KAP5G81',
      displayPlate: 'KAP-5G81',
      vehicleTypeId: 'type-2',
      color: 'Vermelho',
      model: 'Honda Biz',
      entryType: 'avulso',
      entryAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3h ago
      exitAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(), // 2.5h ago
      status: 'completed',
      calculatedAmount: 4.00, // < 1 hour
      discountAmount: 0.00,
      finalAmount: 4.00,
      paymentMethod: 'pix',
      entryUserId: 'user-3',
      exitUserId: 'user-3',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
    },
    {
      id: 'session-active-1',
      ticketNumber: 'TKT-00103',
      publicToken: '5c8a9d1e',
      normalizedPlate: 'BRA3S20',
      displayPlate: 'BRA-3S20',
      vehicleTypeId: 'type-1',
      color: 'Prata',
      model: 'Toyota Corolla',
      vaga: 'A-12',
      entryType: 'avulso',
      entryAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(), // 2.5h ago
      status: 'active',
      calculatedAmount: 0.00,
      discountAmount: 0.00,
      finalAmount: 0.00,
      entryUserId: 'user-3',
      createdAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
    },
    {
      id: 'session-active-2',
      ticketNumber: 'TKT-00104',
      publicToken: '3f2e5a7b',
      normalizedPlate: 'KXP9943',
      displayPlate: 'KXP-9943',
      vehicleTypeId: 'type-2',
      color: 'Azul',
      model: 'Yamaha Fazer',
      vaga: 'M-05',
      entryType: 'avulso',
      entryAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago
      status: 'active',
      calculatedAmount: 0.00,
      discountAmount: 0.00,
      finalAmount: 0.00,
      entryUserId: 'user-3',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      id: 'session-active-3',
      ticketNumber: 'TKT-00105',
      publicToken: '1d4b6c9e',
      normalizedPlate: 'ABC1D23',
      displayPlate: 'ABC-1D23',
      vehicleTypeId: 'type-1',
      color: 'Branco',
      model: 'Jeep Compass',
      vaga: 'A-01',
      entryType: 'mensalista',
      entryAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
      status: 'active',
      calculatedAmount: 0.00,
      discountAmount: 0.00,
      finalAmount: 0.00,
      entryUserId: 'user-3',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ],
  subscriberPlans: [
    { id: 'sub-plan-car', name: 'Mensal Carro 24h', amount: 180.00, durationMonths: 1, vehicleLimit: 1, simultaneousLimit: 1, active: true },
    { id: 'sub-plan-moto', name: 'Mensal Moto 24h', amount: 90.00, durationMonths: 1, vehicleLimit: 1, simultaneousLimit: 1, active: true }
  ],
  subscribers: [
    {
      id: 'sub-1',
      name: 'Julio Cesar de Oliveira',
      document: '123.456.789-00',
      phone: '(85) 99876-5432',
      email: 'julio@gmail.com',
      planId: 'sub-plan-car',
      startsAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), // 15 days ago
      expiresAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(), // 15 days left
      dueDay: 10,
      status: 'active',
      amount: 180.00,
      plates: ['ABC1D23'],
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'sub-2',
      name: 'Mariana Costa Pinheiro',
      document: '987.654.321-11',
      phone: '(85) 98822-1100',
      email: 'mariana.costa@hotmail.com',
      planId: 'sub-plan-car',
      startsAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(), // 28 days ago
      expiresAt: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), // 2 days left
      dueDay: 15,
      status: 'active',
      amount: 180.00,
      plates: ['XYZ9W87'],
      createdAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'sub-3',
      name: 'Fernando Reis Montenegro',
      document: '444.555.666-22',
      phone: '(85) 99111-2233',
      email: 'fernando.reis@outlook.com',
      planId: 'sub-plan-moto',
      startsAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(), // 35 days ago
      expiresAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // expired 5 days ago
      dueDay: 5,
      status: 'expired',
      amount: 90.00,
      plates: ['MNO4B56'],
      createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString()
    }
  ],
  cashSessions: [
    {
      id: 'cash-yesterday',
      userId: 'user-3',
      userName: 'Lucas Lima (Operador)',
      openedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
      closedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      openingBalance: 100.00,
      expectedClosingBalance: 120.00,
      informedClosingBalance: 120.00,
      differenceAmount: 0.00,
      closingNotes: 'Tudo de acordo.',
      status: 'closed'
    }
  ],
  transactions: [
    {
      id: 'txn-yesterday-1',
      cashSessionId: 'cash-yesterday',
      type: 'recebimento_estacionamento',
      category: 'Estacionamento Avulso',
      amount: 20.00,
      paymentMethod: 'dinheiro',
      description: 'Pagamento Ticket TKT-00099',
      userId: 'user-3',
      userName: 'Lucas Lima (Operador)',
      createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString()
    }
  ],
  expenses: [
    {
      id: 'expense-1',
      category: 'Limpeza',
      description: 'Compra de produtos para limpeza do box',
      amount: 45.90,
      expenseDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
      createdById: 'user-2',
      createdByName: 'Renata Souza (Gerente)',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'expense-2',
      category: 'Energia',
      description: 'Conta de luz Enel - Referente a Junho',
      amount: 340.00,
      expenseDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
      createdById: 'user-1',
      createdByName: 'Carlos Alberto (Admin)',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'audit-1',
      userId: 'user-1',
      userName: 'Carlos Alberto (Admin)',
      action: 'Inicialização do Sistema',
      entityType: 'Sistema',
      createdAt: new Date().toISOString()
    }
  ],
  parkingLotConfig: {
    name: 'VM Park',
    document: '12.345.678/0001-90',
    phone: '(85) 3224-8899',
    address: 'Rua Senador Pompeu, 1200 - Centro, Fortaleza - CE',
    timezone: 'America/Fortaleza',
    totalSpaces: 90,
    toleranceMinutes: 15,
    allowMidnightOver: true,
    logoUrl: '',
    lgpdTerm: 'Os dados de placa e veículo são coletados estritamente para controle operacional e faturamento de permanência, sob amparo legal de execução de contrato e legítimo interesse (Art. 7º, V e IX da Lei 13.709/18). Os registros históricos são retidos temporariamente e anonimizados após o prazo regulatório de faturamento.',
    lgpdDpoName: 'Renata Souza (Gerente)',
    lgpdDpoEmail: 'dpo@parkgestor.com.br',
    lgpdDpoPhone: '(85) 3224-8899',
    lgpdMaskPlatesOld: true,
    lgpdMaskDays: 30,
    lgpdConsentRequired: true
  }
};

export async function getDb(): Promise<DatabaseSchema> {
  const sql = getSql();
  const rows = await sql`SELECT data FROM app_state WHERE id = ${STATE_ID}`;
  if (rows.length > 0) {
    return rows[0].data as DatabaseSchema;
  }

  await sql`
    INSERT INTO app_state (id, data)
    VALUES (${STATE_ID}, ${JSON.stringify(defaultData)}::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;

  const seededRows = await sql`SELECT data FROM app_state WHERE id = ${STATE_ID}`;
  return seededRows[0].data as DatabaseSchema;
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO app_state (id, data, updated_at)
    VALUES (${STATE_ID}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
  `;
}

// Helper to log audit actions
export async function addAuditLog(userId: string, userName: string, action: string, entityType: string, entityId?: string, previousData?: any, newData?: any, reason?: string) {
  const db = await getDb();
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userName,
    action,
    entityType,
    entityId,
    previousData: previousData ? JSON.stringify(previousData) : undefined,
    newData: newData ? JSON.stringify(newData) : undefined,
    reason,
    createdAt: new Date().toISOString()
  };
  db.auditLogs.unshift(log); // Keep newest logs first
  // Keep audit logs capped at 200 items to avoid bloating
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  await saveDb(db);
}
