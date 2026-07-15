import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getDb, saveDb, addAuditLog } from './server/db';
import { 
  ParkingSession, CashSession, FinancialTransaction, 
  Subscriber, Expense, PricingPlan 
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT || 3000);

if (!process.env.VERCEL) {
  dotenv.config({ path: '.env.local', quiet: true });
}

app.use(express.json());

// Helper: Get active user from request header (to simulate authenticating user)
async function getReqUser(req: express.Request) {
  const userId = req.headers['x-user-id'] as string || 'user-3'; // Default to Lucas Lima (Operador)
  const db = await getDb();
  return db.users.find(u => u.id === userId) || db.users[0];
}

// 1. CALCULATOR UTILITY
function calculateParkingAmount(entryAtStr: string, exitAtStr: string, plan: PricingPlan): number {
  const entryAt = new Date(entryAtStr);
  const exitAt = new Date(exitAtStr);
  
  const diffMs = exitAt.getTime() - entryAt.getTime();
  if (diffMs <= 0) return 0;
  
  const diffMinutes = Math.ceil(diffMs / (60 * 1000));
  
  // If inside tolerance, free
  if (diffMinutes <= plan.toleranceMinutes) {
    return 0;
  }
  
  let amount = 0;
  if (plan.pricingType === 'hourly') {
    const hours = Math.ceil(diffMinutes / 60);
    amount = hours * plan.hourlyRate;
  } else if (plan.pricingType === 'fractional') {
    const fraction = plan.fractionMinutes || 15;
    const rate = plan.fractionRate || 2.00;
    const fractions = Math.ceil(diffMinutes / fraction);
    amount = fractions * rate;
  } else {
    amount = plan.hourlyRate; // fixed
  }
  
  if (plan.dailyMax && amount > plan.dailyMax) {
    const days = Math.ceil(diffMinutes / (24 * 60));
    amount = Math.min(amount, plan.dailyMax * days);
  }
  
  return parseFloat(amount.toFixed(2));
}

// 2. HEALTH & CONFIG ENDPOINTS
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', async (req, res) => {
  const db = await getDb();
  res.json({
    parkingLotConfig: db.parkingLotConfig,
    users: db.users,
    vehicleTypes: db.vehicleTypes,
    pricingPlans: db.pricingPlans,
    subscriberPlans: db.subscriberPlans
  });
});

app.put('/api/config', async (req, res) => {
  const user = await getReqUser(req);
  if (user.role !== 'admin' && user.role !== 'manager') {
    return res.status(403).json({ error: 'Apenas Administradores e Gestores podem alterar configurações.' });
  }
  
  const db = await getDb();
  const oldConfig = { ...db.parkingLotConfig };
  db.parkingLotConfig = { ...db.parkingLotConfig, ...req.body };
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, 'Atualizou Configurações do Estacionamento', 'Estacionamento', 'config', oldConfig, db.parkingLotConfig);
  res.json(db.parkingLotConfig);
});

app.put('/api/pricing-plans', async (req, res) => {
  const user = await getReqUser(req);
  if (user.role !== 'admin' && user.role !== 'manager') {
    return res.status(403).json({ error: 'Apenas Administradores e Gestores podem alterar tarifas.' });
  }
  
  const db = await getDb();
  const { id, hourlyRate, toleranceMinutes, dailyMax, active } = req.body;
  const planIndex = db.pricingPlans.findIndex(p => p.id === id);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plano tarifário não encontrado.' });
  }
  
  const oldPlan = { ...db.pricingPlans[planIndex] };
  db.pricingPlans[planIndex] = {
    ...db.pricingPlans[planIndex],
    hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : db.pricingPlans[planIndex].hourlyRate,
    toleranceMinutes: toleranceMinutes !== undefined ? parseInt(toleranceMinutes, 10) : db.pricingPlans[planIndex].toleranceMinutes,
    dailyMax: dailyMax !== undefined ? parseFloat(dailyMax) : db.pricingPlans[planIndex].dailyMax,
    active: active !== undefined ? !!active : db.pricingPlans[planIndex].active
  };
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Atualizou Tarifas - ${db.pricingPlans[planIndex].name}`, 'Tarifas', id, oldPlan, db.pricingPlans[planIndex]);
  res.json(db.pricingPlans[planIndex]);
});

app.put('/api/subscriber-plans', async (req, res) => {
  const user = await getReqUser(req);
  if (user.role !== 'admin' && user.role !== 'manager') {
    return res.status(403).json({ error: 'Apenas Administradores e Gestores podem alterar planos de mensalistas.' });
  }
  
  const db = await getDb();
  const { id, amount, durationMonths, simultaneousLimit, active } = req.body;
  const planIndex = db.subscriberPlans.findIndex(p => p.id === id);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plano de mensalista não encontrado.' });
  }
  
  const oldPlan = { ...db.subscriberPlans[planIndex] };
  db.subscriberPlans[planIndex] = {
    ...db.subscriberPlans[planIndex],
    amount: amount !== undefined ? parseFloat(amount) : db.subscriberPlans[planIndex].amount,
    durationMonths: durationMonths !== undefined ? parseInt(durationMonths, 10) : db.subscriberPlans[planIndex].durationMonths,
    simultaneousLimit: simultaneousLimit !== undefined ? parseInt(simultaneousLimit, 10) : db.subscriberPlans[planIndex].simultaneousLimit,
    active: active !== undefined ? !!active : db.subscriberPlans[planIndex].active
  };
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Atualizou Plano Mensalista - ${db.subscriberPlans[planIndex].name}`, 'Planos', id, oldPlan, db.subscriberPlans[planIndex]);
  res.json(db.subscriberPlans[planIndex]);
});

app.post('/api/lgpd/anonymize', async (req, res) => {
  const user = await getReqUser(req);
  if (user.role !== 'admin' && user.role !== 'manager') {
    return res.status(403).json({ error: 'Apenas Administradores e Gestores podem executar exclusões/anonimizações de dados.' });
  }
  
  const db = await getDb();
  const { plate } = req.body;
  if (!plate) {
    return res.status(400).json({ error: 'É necessário fornecer a placa para exclusão de dados.' });
  }
  
  const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  let count = 0;
  db.parkingSessions = db.parkingSessions.map(session => {
    const match = session.normalizedPlate === cleanPlate || session.displayPlate.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate;
    if (match) {
      if (session.status === 'active') {
        return session;
      }
      count++;
      return {
        ...session,
        displayPlate: 'ANON***',
        normalizedPlate: 'ANON***',
        color: 'N/A',
        model: 'N/A',
        notes: 'Dados sensíveis expurgados conforme solicitação LGPD do proprietário.',
        justification: session.justification ? `${session.justification} | [LGPD Anonimizado]` : '[Dados removidos sob direito de esquecimento LGPD]'
      };
    }
    return session;
  });
  
  if (count > 0) {
    await saveDb(db);
    await addAuditLog(user.id, user.name, `Expurgou/Anonimizou Dados da Placa [${plate.toUpperCase()}]`, 'LGPD', 'anonymization', null, { plateAnonymized: plate.toUpperCase(), count }, `Solicitação de exclusão sob Art. 16 da LGPD.`);
  }
  
  res.json({ 
    success: true, 
    count, 
    message: `${count} registro(s) históricos de permanência da placa ${plate.toUpperCase()} foram devidamente anonimizados em conformidade com o Art. 16 da LGPD.` 
  });
});

// 3. USER MANAGEMENT (SWITCHING/SIMULATION)
app.get('/api/users', async (req, res) => {
  const db = await getDb();
  res.json(db.users);
});

app.post('/api/users', async (req, res) => {
  const actor = await getReqUser(req);
  if (actor.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas Administradores podem criar usuários.' });
  }
  
  const db = await getDb();
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }
  
  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    role,
    active: true,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  await saveDb(db);
  
  await addAuditLog(actor.id, actor.name, `Criou Usuário: ${name}`, 'Usuário', newUser.id, null, newUser);
  res.json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const actor = await getReqUser(req);
  if (actor.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas Administradores podem editar usuários.' });
  }
  
  const db = await getDb();
  const userToEdit = db.users.find(u => u.id === req.params.id);
  if (!userToEdit) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  
  const oldUser = { ...userToEdit };
  Object.assign(userToEdit, req.body);
  await saveDb(db);
  
  await addAuditLog(actor.id, actor.name, `Editou Usuário: ${userToEdit.name}`, 'Usuário', userToEdit.id, oldUser, userToEdit);
  res.json(userToEdit);
});

// 4. PARKING SESSIONS API
app.get('/api/parking/sessions', async (req, res) => {
  const db = await getDb();
  res.json(db.parkingSessions);
});

app.post('/api/parking/entry', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  
  const { plate, vehicleTypeId, color, model, notes, vaga, entryType } = req.body;
  if (!plate || !vehicleTypeId) {
    return res.status(400).json({ error: 'Placa e Tipo de Veículo são obrigatórios.' });
  }
  
  const normalizedPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const displayPlate = normalizedPlate.length === 7 
    ? `${normalizedPlate.substring(0, 3)}-${normalizedPlate.substring(3)}` 
    : normalizedPlate;
    
  // RN-01: One active session per plate in same lot
  const hasActive = db.parkingSessions.some(s => s.normalizedPlate === normalizedPlate && s.status === 'active');
  if (hasActive) {
    return res.status(400).json({ error: `O veículo com placa ${displayPlate} já está estacionado.` });
  }
  
  // Verify mensalista relationship
  let finalEntryType: 'avulso' | 'mensalista' | 'convenio' | 'cortesia' = entryType || 'avulso';
  let matchedSubscriber: Subscriber | undefined;
  
  // Look up plate in subscribers
  matchedSubscriber = db.subscribers.find(sub => 
    sub.plates.some(p => p.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === normalizedPlate)
  );
  
  if (matchedSubscriber) {
    if (matchedSubscriber.status === 'active') {
      finalEntryType = 'mensalista';
    } else {
      // Prompt warning about expired subscription, but allow if operator decides
      if (finalEntryType === 'mensalista') {
        return res.status(400).json({ 
          error: `O plano do mensalista ${matchedSubscriber.name} está ${matchedSubscriber.status}. Por favor, regularize ou altere para Avulso.` 
        });
      }
    }
  }
  
  // Find applicable pricing plan
  const pricingPlan = db.pricingPlans.find(p => p.vehicleTypeId === vehicleTypeId && p.active);
  
  const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
  const publicToken = Math.random().toString(36).substr(2, 8);
  
  const newSession: ParkingSession = {
    id: `session-${Date.now()}`,
    ticketNumber,
    publicToken,
    normalizedPlate,
    displayPlate,
    vehicleTypeId,
    color,
    model,
    notes,
    vaga,
    entryType: finalEntryType,
    entryAt: new Date().toISOString(),
    status: 'active',
    calculatedAmount: 0.00,
    discountAmount: 0.00,
    finalAmount: 0.00,
    entryUserId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.parkingSessions.unshift(newSession);
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Registrou Entrada: ${displayPlate}`, 'Estacionamento', newSession.id, null, newSession);
  res.json({ session: newSession, subscriber: matchedSubscriber });
});

// Calculate current cost dynamically (Dry run)
app.post('/api/parking/calculate', async (req, res) => {
  const { sessionId, exitAt } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'ID da sessão obrigatório.' });
  
  const db = await getDb();
  const session = db.parkingSessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' });
  
  if (session.entryType === 'mensalista' || session.entryType === 'cortesia') {
    return res.json({ calculatedAmount: 0.00, elapsedMinutes: 0 });
  }
  
  const exitTime = exitAt ? new Date(exitAt).toISOString() : new Date().toISOString();
  
  // Find pricing plan
  const plan = db.pricingPlans.find(p => p.vehicleTypeId === session.vehicleTypeId && p.active);
  if (!plan) {
    return res.status(404).json({ error: 'Tabela de preços ativa não encontrada para este veículo.' });
  }
  
  const amount = calculateParkingAmount(session.entryAt, exitTime, plan);
  const diffMs = new Date(exitTime).getTime() - new Date(session.entryAt).getTime();
  const diffMinutes = Math.max(0, Math.ceil(diffMs / (60 * 1000)));
  
  res.json({
    calculatedAmount: amount,
    elapsedMinutes: diffMinutes,
    pricingPlan: plan
  });
});

// Checkout (Process Output & Payment)
app.post('/api/parking/checkout', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const { sessionId, paymentMethod, discountAmount, customAmount, justification } = req.body;
  
  if (!sessionId || !paymentMethod) {
    return res.status(400).json({ error: 'Sessão e Método de Pagamento são obrigatórios.' });
  }
  
  // RN-05: Presential payments must be bound to an active cash session
  const activeCash = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
  if (!activeCash) {
    return res.status(400).json({ error: 'Você precisa abrir o caixa para receber pagamentos e concluir a saída.' });
  }
  
  const session = db.parkingSessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' });
  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Esta permanência já foi encerrada.' });
  }
  
  const plan = db.pricingPlans.find(p => p.vehicleTypeId === session.vehicleTypeId && p.active);
  const exitAt = new Date().toISOString();
  
  let calculatedAmount = 0;
  if (session.entryType !== 'mensalista' && session.entryType !== 'cortesia') {
    calculatedAmount = plan ? calculateParkingAmount(session.entryAt, exitAt, plan) : 0;
  }
  
  // Calculate discount or override custom amount
  let discount = parseFloat(discountAmount || 0);
  let finalAmount = Math.max(0, calculatedAmount - discount);
  
  if (customAmount !== undefined) {
    finalAmount = parseFloat(customAmount);
    discount = Math.max(0, calculatedAmount - finalAmount);
  }
  
  if (discount > 0 && !justification) {
    return res.status(400).json({ error: 'Operações com desconto ou cortesia exigem justificativa.' });
  }
  
  // Update session
  session.exitAt = exitAt;
  session.status = 'completed';
  session.calculatedAmount = calculatedAmount;
  session.discountAmount = discount;
  session.finalAmount = finalAmount;
  session.paymentMethod = paymentMethod;
  session.exitUserId = user.id;
  session.justification = justification;
  session.updatedAt = new Date().toISOString();
  
  // Record Transaction inside current Cash Register Session
  const transactionId = `txn-${Date.now()}`;
  const transaction: FinancialTransaction = {
    id: transactionId,
    cashSessionId: activeCash.id,
    parkingSessionId: session.id,
    type: 'recebimento_estacionamento',
    category: 'Estacionamento Avulso',
    amount: finalAmount,
    paymentMethod,
    description: `Pagamento de Estacionamento - Placa ${session.displayPlate} (Ticket: ${session.ticketNumber})`,
    userId: user.id,
    userName: user.name,
    createdAt: new Date().toISOString()
  };
  
  db.transactions.push(transaction);
  
  // Update cash session expected closing balance
  activeCash.expectedClosingBalance += finalAmount;
  
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Registrou Saída e Pagamento: ${session.displayPlate} (R$ ${finalAmount})`, 'Estacionamento', session.id, null, session);
  res.json({ session, transaction });
});

// Cancel Entry (Cancel instead of checkout)
app.post('/api/parking/cancel', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const { sessionId, justification } = req.body;
  
  if (!sessionId || !justification) {
    return res.status(400).json({ error: 'ID da sessão e Justificativa são obrigatórios para cancelamento.' });
  }
  
  const session = db.parkingSessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' });
  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Apenas permanências ativas podem ser canceladas.' });
  }
  
  const oldSession = { ...session };
  session.status = 'cancelled';
  session.justification = justification;
  session.exitUserId = user.id;
  session.exitAt = new Date().toISOString();
  session.updatedAt = new Date().toISOString();
  
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Cancelou Ticket de Entrada: ${session.displayPlate}`, 'Estacionamento', session.id, oldSession, session, justification);
  res.json(session);
});

// 5. CASH REGISTERS & SESSIONS API
app.get('/api/cash/status', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const activeSession = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
  res.json(activeSession || null);
});

app.get('/api/cash/sessions', async (req, res) => {
  const db = await getDb();
  // Sort by open first, then newer closing dates
  const sorted = [...db.cashSessions].sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (a.status !== 'open' && b.status === 'open') return 1;
    return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
  });
  res.json(sorted);
});

app.post('/api/cash/open', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  
  // Check if already open
  const existing = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
  if (existing) {
    return res.status(400).json({ error: 'Você já possui um caixa aberto.' });
  }
  
  const { openingBalance } = req.body;
  const initialBalance = parseFloat(openingBalance || 0);
  
  const newCash: CashSession = {
    id: `cash-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    openedAt: new Date().toISOString(),
    openingBalance: initialBalance,
    expectedClosingBalance: initialBalance,
    status: 'open'
  };
  
  db.cashSessions.unshift(newCash);
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Abriu o Caixa (Saldo Inicial: R$ ${initialBalance})`, 'Caixa', newCash.id, null, newCash);
  res.json(newCash);
});

// Post a direct transaction (sangria or suprimento)
app.post('/api/cash/transaction', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const { type, amount, description, paymentMethod } = req.body;
  
  if (!type || !amount || !description) {
    return res.status(400).json({ error: 'Tipo, Valor e Descrição são obrigatórios.' });
  }
  
  const activeCash = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
  if (!activeCash) {
    return res.status(400).json({ error: 'Você precisa de um caixa aberto para registrar movimentações.' });
  }
  
  const numericAmount = parseFloat(amount);
  if (numericAmount <= 0) {
    return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
  }
  
  // For Sangria, verify there is enough physical money
  if (type === 'sangria' && activeCash.expectedClosingBalance < numericAmount) {
    return res.status(400).json({ error: `Saldo insuficiente para sangria. Saldo atual esperado: R$ ${activeCash.expectedClosingBalance}` });
  }
  
  const newTxn: FinancialTransaction = {
    id: `txn-${Date.now()}`,
    cashSessionId: activeCash.id,
    type,
    category: type === 'sangria' ? 'Sangria de Caixa' : 'Suprimento de Troco',
    amount: numericAmount,
    paymentMethod: paymentMethod || 'dinheiro',
    description,
    userId: user.id,
    userName: user.name,
    createdAt: new Date().toISOString()
  };
  
  db.transactions.push(newTxn);
  
  if (type === 'sangria') {
    activeCash.expectedClosingBalance -= numericAmount;
  } else {
    activeCash.expectedClosingBalance += numericAmount;
  }
  
  await saveDb(db);
  await addAuditLog(user.id, user.name, `Registrou ${type === 'sangria' ? 'Sangria' : 'Suprimento'}: R$ ${numericAmount}`, 'Caixa', activeCash.id, null, newTxn);
  res.json({ transaction: newTxn, cashSession: activeCash });
});

// Close Cash Session
app.post('/api/cash/close', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const { informedClosingBalance, closingNotes } = req.body;
  
  if (informedClosingBalance === undefined) {
    return res.status(400).json({ error: 'O valor informado em caixa é obrigatório.' });
  }
  
  const activeCash = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
  if (!activeCash) {
    return res.status(400).json({ error: 'Nenhum caixa aberto encontrado para fechar.' });
  }
  
  const actualInformed = parseFloat(informedClosingBalance);
  const difference = actualInformed - activeCash.expectedClosingBalance;
  
  if (difference !== 0 && !closingNotes) {
    return res.status(400).json({ error: 'Para fechar o caixa com diferença, você deve fornecer uma justificativa nas observações.' });
  }
  
  const oldCash = { ...activeCash };
  activeCash.closedAt = new Date().toISOString();
  activeCash.informedClosingBalance = actualInformed;
  activeCash.differenceAmount = parseFloat(difference.toFixed(2));
  activeCash.closingNotes = closingNotes;
  activeCash.status = 'closed';
  
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Fechou o Caixa (Informado: R$ ${actualInformed}, Diferença: R$ ${activeCash.differenceAmount})`, 'Caixa', activeCash.id, oldCash, activeCash, closingNotes);
  res.json(activeCash);
});

// 6. SUBSCRIBERS (MENSALISTAS) API
app.get('/api/subscribers', async (req, res) => {
  const db = await getDb();
  res.json(db.subscribers);
});

app.post('/api/subscribers', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const { name, document, phone, email, planId, plates, dueDay, notes } = req.body;
  
  if (!name || !phone || !planId || !plates || plates.length === 0) {
    return res.status(400).json({ error: 'Nome, Telefone, Plano e Placas são obrigatórios.' });
  }
  
  const plan = db.subscriberPlans.find(p => p.id === planId);
  if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });
  
  const startsAt = new Date().toISOString();
  // Expire in 'plan.durationMonths' months
  const expiresDate = new Date();
  expiresDate.setMonth(expiresDate.getMonth() + plan.durationMonths);
  const expiresAt = expiresDate.toISOString();
  
  const newSubscriber: Subscriber = {
    id: `sub-${Date.now()}`,
    name,
    document,
    phone,
    email: email || '',
    planId,
    startsAt,
    expiresAt,
    dueDay: parseInt(dueDay || 10),
    status: 'active',
    amount: plan.amount,
    plates: plates.map((p: string) => p.replace(/[^A-Za-z0-9]/g, '').toUpperCase()),
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.subscribers.push(newSubscriber);
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Cadastrou Mensalista: ${name}`, 'Mensalista', newSubscriber.id, null, newSubscriber);
  res.json(newSubscriber);
});

app.put('/api/subscribers/:id', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const sub = db.subscribers.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: 'Mensalista não encontrado.' });
  
  const oldSub = { ...sub };
  Object.assign(sub, req.body);
  
  // Standardize plates if changed
  if (req.body.plates) {
    sub.plates = req.body.plates.map((p: string) => p.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  }
  
  sub.updatedAt = new Date().toISOString();
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Editou Mensalista: ${sub.name}`, 'Mensalista', sub.id, oldSub, sub);
  res.json(sub);
});

// Pay monthly bill and renew
app.post('/api/subscribers/:id/pay', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const sub = db.subscribers.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: 'Mensalista não encontrado.' });
  
  const activeCash = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
  if (!activeCash) {
    return res.status(400).json({ error: 'Você precisa de um caixa aberto para registrar este recebimento.' });
  }
  
  const { paymentMethod } = req.body;
  if (!paymentMethod) {
    return res.status(400).json({ error: 'Método de pagamento é obrigatório.' });
  }
  
  const oldSub = { ...sub };
  
  // Calculate new expiration date (extend by plan duration, or from today if already expired)
  const baseDate = new Date(sub.expiresAt).getTime() > Date.now() 
    ? new Date(sub.expiresAt) 
    : new Date();
    
  const plan = db.subscriberPlans.find(p => p.id === sub.planId);
  const duration = plan ? plan.durationMonths : 1;
  baseDate.setMonth(baseDate.getMonth() + duration);
  
  sub.expiresAt = baseDate.toISOString();
  sub.status = 'active';
  sub.updatedAt = new Date().toISOString();
  
  // Record Transaction
  const transaction: FinancialTransaction = {
    id: `txn-${Date.now()}`,
    cashSessionId: activeCash.id,
    subscriberId: sub.id,
    type: 'recebimento_mensalidade',
    category: 'Mensalidade',
    amount: sub.amount,
    paymentMethod,
    description: `Recebimento Mensalidade de ${sub.name}`,
    userId: user.id,
    userName: user.name,
    createdAt: new Date().toISOString()
  };
  
  db.transactions.push(transaction);
  activeCash.expectedClosingBalance += sub.amount;
  
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Registrou Pagamento de Mensalidade: ${sub.name} (R$ ${sub.amount})`, 'Mensalista', sub.id, oldSub, sub);
  res.json({ subscriber: sub, transaction });
});

// 7. EXPENSES API
app.get('/api/expenses', async (req, res) => {
  const db = await getDb();
  res.json(db.expenses);
});

app.post('/api/expenses', async (req, res) => {
  const user = await getReqUser(req);
  const db = await getDb();
  const { category, description, amount, expenseDate, supplier, payFromCash } = req.body;
  
  if (!category || !description || !amount || !expenseDate) {
    return res.status(400).json({ error: 'Categoria, Descrição, Valor e Data são obrigatórios.' });
  }
  
  const numericAmount = parseFloat(amount);
  
  let activeCash: CashSession | undefined;
  if (payFromCash) {
    activeCash = db.cashSessions.find(c => c.userId === user.id && c.status === 'open');
    if (!activeCash) {
      return res.status(400).json({ error: 'Você precisa de um caixa aberto para pagar uma despesa usando o dinheiro do caixa.' });
    }
    if (activeCash.expectedClosingBalance < numericAmount) {
      return res.status(400).json({ error: `Saldo de caixa insuficiente para pagar a despesa. Saldo esperado: R$ ${activeCash.expectedClosingBalance}` });
    }
  }
  
  const newExpense: Expense = {
    id: `expense-${Date.now()}`,
    category,
    description,
    amount: numericAmount,
    expenseDate,
    supplier,
    createdById: user.id,
    createdByName: user.name,
    createdAt: new Date().toISOString()
  };
  
  db.expenses.unshift(newExpense);
  
  // If paid from cash, add a negative transaction to the active cash register
  if (payFromCash && activeCash) {
    const transaction: FinancialTransaction = {
      id: `txn-${Date.now()}`,
      cashSessionId: activeCash.id,
      type: 'despesa',
      category: `Despesa: ${category}`,
      amount: numericAmount,
      paymentMethod: 'dinheiro',
      description: `Pagamento de Despesa: ${description}`,
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString()
    };
    db.transactions.push(transaction);
    activeCash.expectedClosingBalance -= numericAmount;
  }
  
  await saveDb(db);
  
  await addAuditLog(user.id, user.name, `Registrou Despesa: ${description} (R$ ${numericAmount})`, 'Despesa', newExpense.id, null, newExpense);
  res.json(newExpense);
});

// 8. AUDIT LOGS
app.get('/api/audit-logs', async (req, res) => {
  const db = await getDb();
  res.json(db.auditLogs);
});

// 9. DASHBOARD STATS
app.get('/api/dashboard/stats', async (req, res) => {
  const db = await getDb();
  
  // Live occupancy
  const activeSessions = db.parkingSessions.filter(s => s.status === 'active');
  const vehicleCount = activeSessions.length;
  
  const occupancyByType = db.vehicleTypes.map(t => {
    const count = activeSessions.filter(s => s.vehicleTypeId === t.id).length;
    return {
      typeId: t.id,
      name: t.name,
      icon: t.icon,
      occupied: count,
      total: t.totalSpaces,
      percentage: Math.round((count / t.totalSpaces) * 100)
    };
  });
  
  // Daily revenue (today's payments)
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const todayTransactions = db.transactions.filter(t => 
    new Date(t.createdAt).getTime() >= todayStart.getTime()
  );
  
  const todayRevenue = todayTransactions
    .filter(t => ['recebimento_estacionamento', 'recebimento_mensalidade', 'receita_avulsa', 'suprimento'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const todayRevenuesByMethod = {
    dinheiro: todayTransactions.filter(t => t.paymentMethod === 'dinheiro' && t.type.startsWith('receb')).reduce((sum, t) => sum + t.amount, 0),
    pix: todayTransactions.filter(t => t.paymentMethod === 'pix' && t.type.startsWith('receb')).reduce((sum, t) => sum + t.amount, 0),
    debito: todayTransactions.filter(t => t.paymentMethod === 'debito' && t.type.startsWith('receb')).reduce((sum, t) => sum + t.amount, 0),
    credito: todayTransactions.filter(t => t.paymentMethod === 'credito' && t.type.startsWith('receb')).reduce((sum, t) => sum + t.amount, 0)
  };
  
  const todayEntriesCount = db.parkingSessions.filter(s => {
    const entryDate = new Date(s.entryAt);
    return entryDate.getTime() >= todayStart.getTime();
  }).length;
  
  const todayExitsCount = db.parkingSessions.filter(s => {
    return s.exitAt && new Date(s.exitAt).getTime() >= todayStart.getTime();
  }).length;
  
  const activeCaixasCount = db.cashSessions.filter(c => c.status === 'open').length;
  
  const activeMensalistasCount = db.subscribers.filter(s => s.status === 'active').length;
  const expiredMensalistasCount = db.subscribers.filter(s => s.status === 'expired' || s.status === 'pending').length;
  
  // Simple revenue progression chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    return d;
  }).reverse();
  
  const dailyRevenuesChart = last7Days.map(day => {
    const dayEnd = new Date(day);
    dayEnd.setHours(23,59,59,999);
    
    const dayTxns = db.transactions.filter(t => {
      const tTime = new Date(t.createdAt).getTime();
      return tTime >= day.getTime() && tTime <= dayEnd.getTime();
    });
    
    const parkingRev = dayTxns.filter(t => t.type === 'recebimento_estacionamento').reduce((sum, t) => sum + t.amount, 0);
    const subRev = dayTxns.filter(t => t.type === 'recebimento_mensalidade').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      estacionamento: parkingRev,
      mensalistas: subRev,
      total: parkingRev + subRev
    };
  });
  
  res.json({
    vehicleCount,
    totalCapacity: db.parkingLotConfig.totalSpaces,
    occupancyPercentage: Math.round((vehicleCount / db.parkingLotConfig.totalSpaces) * 100),
    occupancyByType,
    todayRevenue,
    todayRevenuesByMethod,
    todayEntriesCount,
    todayExitsCount,
    activeCaixasCount,
    activeMensalistasCount,
    expiredMensalistasCount,
    dailyRevenuesChart
  });
});

// Vercel imports this file as a serverless function. The local development
// process remains responsible for serving the Vite application.
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback for SPA routing in development
    app.get('*', (req, res, next) => {
      // Don't intercept API routes
      if (req.path.startsWith('/api')) return next();
      
      vite.transformIndexHtml(req.url, `
        <!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>ParkGestor - Sistema de Gestão para Estacionamento</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `).then((html) => {
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      }).catch(next);
    });
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development server running on http://localhost:${PORT}`);
    });
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on http://localhost:${PORT}`);
  });
}

export default app;
