import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, ClipboardCheck, ArrowRight, Printer, 
  Copy, CheckCircle2, AlertCircle, Info, RefreshCw 
} from 'lucide-react';
import { api } from '../lib/api';
import { VehicleType, Subscriber } from '../types';
import { motion } from 'motion/react';

interface NewEntryProps {
  vehicleTypes: VehicleType[];
  subscribers: Subscriber[];
  onSuccess: () => void;
  cashStatus: any;
  setCurrentTab: (tab: string) => void;
}

export default function NewEntry({
  vehicleTypes,
  subscribers,
  onSuccess,
  cashStatus,
  setCurrentTab
}: NewEntryProps) {
  const [plate, setPlate] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [color, setColor] = useState('');
  const [model, setModel] = useState('');
  const [vaga, setVaga] = useState('');
  const [notes, setNotes] = useState('');
  const [entryType, setEntryType] = useState<'avulso' | 'mensalista' | 'convenio' | 'cortesia'>('avulso');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Success ticket display state
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-detect subscribers based on typed plate
  const [matchedSub, setMatchedSub] = useState<Subscriber | null>(null);

  useEffect(() => {
    if (vehicleTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(vehicleTypes[0].id);
    }
  }, [vehicleTypes, selectedTypeId]);

  // Plate normalizer for real-time validation
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Simple cap for standard plates
    if (rawVal.length <= 8) {
      setPlate(rawVal);
      
      // Look up subscriber
      const matched = subscribers.find(sub => 
        sub.plates.some(p => p.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === rawVal)
      );
      
      if (matched) {
        setMatchedSub(matched);
        if (matched.status === 'active') {
          setEntryType('mensalista');
        }
      } else {
        setMatchedSub(null);
        if (entryType === 'mensalista') {
          setEntryType('avulso');
        }
      }
    }
  };

  const getDisplayPlate = (p: string) => {
    if (p.length === 7) {
      return `${p.substring(0, 3)}-${p.substring(3)}`;
    }
    return p;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) {
      setError('A placa do veículo é obrigatória.');
      return;
    }
    if (plate.length < 5) {
      setError('A placa informada está muito curta.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.registerEntry({
        plate,
        vehicleTypeId: selectedTypeId,
        color,
        model,
        vaga,
        notes,
        entryType
      });
      
      setCreatedTicket(response.session);
      onSuccess(); // Trigger statistics refresh in parent
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar entrada do veículo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = () => {
    if (!createdTicket) return;
    const ticketText = `
----------------------------
  PARKGESTOR - CENTRO
  COMPROVANTE DE ENTRADA
----------------------------
TICKET: ${createdTicket.ticketNumber}
PLACA: ${createdTicket.displayPlate}
MODELO: ${createdTicket.model || 'Não informado'}
ENTRADA: ${new Date(createdTicket.entryAt).toLocaleDateString('pt-BR')} ${new Date(createdTicket.entryAt).toLocaleTimeString('pt-BR')}
VAGA: ${createdTicket.vaga || 'Livre'}
TIPO: ${createdTicket.entryType.toUpperCase()}
----------------------------
Conserve este ticket para a saída.
    `.trim();
    
    navigator.clipboard.writeText(ticketText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setPlate('');
    setColor('');
    setModel('');
    setVaga('');
    setNotes('');
    setEntryType('avulso');
    setMatchedSub(null);
    setCreatedTicket(null);
    setError(null);
  };

  // Render printed success ticket view
  if (createdTicket) {
    return (
      <div className="max-w-xs mx-auto py-4 text-[10px]">
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="bg-app-card rounded border border-app-border shadow-2xl overflow-hidden text-app-text"
        >
          {/* Success banner */}
          <div className="bg-emerald-600 text-white p-4 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-100" />
            <h3 className="font-bold text-xs uppercase tracking-wider">ENTRADA HOMOLOGADA</h3>
            <p className="text-[9px] text-emerald-100 mt-0.5">O ticket foi registrado e a vaga alocada.</p>
          </div>

          {/* Printed Ticket layout */}
          <div className="p-4 bg-app-bg text-[10px] border-b border-dashed border-app-border relative">
            <div className="text-center pb-3 border-b border-dashed border-app-border">
              <h4 className="font-bold text-xs text-app-text uppercase tracking-widest">PARKGESTOR CENTRAL</h4>
              <p className="text-[8px] text-app-subtle mt-0.5">OPERADOR: SISTEMA DE PÁTIO</p>
            </div>

            <div className="py-3 space-y-1.5 text-app-muted">
              <div className="flex justify-between">
                <span>TICKET ID:</span>
                <span className="font-bold text-app-text">{createdTicket.ticketNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>PLACA:</span>
                <span className="font-bold text-app-text bg-app-border px-1 rounded">{createdTicket.displayPlate}</span>
              </div>
              <div className="flex justify-between">
                <span>CATEGORIA:</span>
                <span className="font-bold text-app-text uppercase">
                  {vehicleTypes.find(t => t.id === createdTicket.vehicleTypeId)?.name || 'CARRO'}
                </span>
              </div>
              {createdTicket.model && (
                <div className="flex justify-between">
                  <span>VEÍCULO:</span>
                  <span className="font-bold text-app-text uppercase">{createdTicket.model} {createdTicket.color && `(${createdTicket.color})`}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>DATA/HORA:</span>
                <span className="font-bold text-app-text">
                  {new Date(createdTicket.entryAt).toLocaleDateString('pt-BR')} {new Date(createdTicket.entryAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ALOCAÇÃO VAGA:</span>
                <span className="font-bold text-app-text uppercase">{createdTicket.vaga || 'LIVRE / ROTATIVO'}</span>
              </div>
              <div className="flex justify-between">
                <span>MODALIDADE:</span>
                <span className="font-bold text-app-text bg-app-border px-1 rounded uppercase tracking-wider text-[9px]">
                  {createdTicket.entryType}
                </span>
              </div>
            </div>

            {/* Simulating QR code */}
            <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-app-border gap-1.5">
              <div className="w-16 h-16 bg-app-card border border-app-border flex items-center justify-center p-1 rounded">
                <div className="w-full h-full bg-app-bg rounded flex flex-wrap p-0.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1/4 h-1/4 ${
                        (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 3 || i === 12 || i === 15 
                          ? 'bg-indigo-500' 
                          : 'bg-transparent'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-[8px] text-app-subtle font-mono uppercase">TOKEN: {createdTicket.publicToken}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-3 flex flex-col sm:flex-row gap-2 bg-app-card">
            <button
              onClick={handleCopyTicket}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-app-bg border border-app-border hover:bg-app-border-sub rounded text-app-text font-bold uppercase text-[9px] transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-app-muted" />
              <span>{copied ? 'COPIADO!' : 'COPIAR TEXTO'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-app-bg border border-app-border hover:bg-app-border-sub rounded text-app-text font-bold uppercase text-[9px] transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-app-muted" />
              <span>IMPRIMIR TICKET</span>
            </button>
          </div>
          <div className="p-3 border-t border-app-border bg-indigo-500/5 flex justify-end">
            <button
              onClick={resetForm}
              className="w-full py-2 bg-app-bg border border-app-border text-app-text hover:bg-app-border-sub font-bold text-[9px] uppercase tracking-wider transition cursor-pointer"
            >
              REGISTRAR NOVO VEÍCULO
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-16 text-sm">
      <div className="mb-6 border-b border-app-border pb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-app-text theme-font-title">Nova Entrada de Veículo</h2>
        <p className="text-xs text-app-muted mt-1">Registre a entrada rápida de rotativo avulso ou mensalista no pátio.</p>
      </div>

      {/* Caixa Fechado Warning */}
      {!cashStatus && (
        <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-350 text-xs flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-amber-750 dark:text-amber-200 uppercase tracking-wider">CAIXA OPERACIONAL FECHADO</h5>
            <p className="mt-1 leading-relaxed text-xs">
              As entradas de veículos serão salvas, mas os recebimentos e cobranças só serão liberados após realizar a <button onClick={() => setCurrentTab('cash')} className="font-bold underline text-amber-700 dark:text-amber-200 uppercase cursor-pointer">Abertura de Caixa</button>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="theme-card p-6 space-y-5 rounded-2xl shadow-xs">
        
        {/* Placa Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider block">Placa do Veículo</label>
          <div className="relative">
            <input
              type="text"
              value={plate}
              onChange={handlePlateChange}
              placeholder="ABC1D23 OU KLM-9920"
              className="w-full bg-app-bg text-center text-lg uppercase font-bold tracking-widest px-4 py-2 border border-app-border text-app-text focus:border-indigo-500 focus:outline-none rounded transition placeholder-app-muted/30"
              autoFocus
              required
            />
            {plate && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold px-1 py-0.5 rounded bg-app-border text-app-muted">
                {plate.length} / 7
              </span>
            )}
          </div>
          
          {/* Real-time subscriber matches */}
          {matchedSub && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2.5 rounded border text-[9px] flex items-start gap-2 mt-1.5 uppercase ${
                matchedSub.status === 'active' 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
              }`}
            >
              {matchedSub.status === 'active' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">MENSALISTA DETECTADO: {matchedSub.name.toUpperCase()}</span>
                    <p className="text-[8px] mt-0.5">
                      Contrato ativo. Modalidade alterada para <strong className="underline">Mensalista</strong> (isenção de tarifas rotativas).
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">CONTRATO INATIVO/EXPIRADO: {matchedSub.name.toUpperCase()}</span>
                    <p className="text-[8px] mt-0.5">
                      Plano do mensalista encontra-se <strong className="underline">{matchedSub.status.toUpperCase()}</strong>. Regularize ou registre como <strong className="underline">Avulso</strong>.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Tipo de Veiculo Grid selection */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Tipo de Veículo</label>
          <div className="grid grid-cols-3 gap-1.5">
            {vehicleTypes.map((t) => {
              const selected = selectedTypeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTypeId(t.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded border transition cursor-pointer uppercase ${
                    selected 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'border-app-border bg-app-bg text-app-muted hover:text-app-text'
                  }`}
                >
                  <Car className={`w-4 h-4 mb-1 ${selected ? 'text-indigo-500' : 'text-app-muted'}`} />
                  <span className="text-[9px] font-bold">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Fields model & color */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Modelo (Opcional)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="EX: COROLLA"
              className="w-full bg-app-bg border border-app-border text-app-text rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Cor (Opcional)</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="EX: PRATA"
              className="w-full bg-app-bg border border-app-border text-app-text rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
            />
          </div>
        </div>

        {/* Optional fields vaga & notes */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Vaga Alocada (Opcional)</label>
            <input
              type="text"
              value={vaga}
              onChange={(e) => setVaga(e.target.value)}
              placeholder="EX: A-12"
              className="w-full bg-app-bg border border-app-border text-app-text rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Tipo de Entrada</label>
            <select
              value={entryType}
              onChange={(e: any) => setEntryType(e.target.value)}
              className="w-full bg-app-bg border border-app-border text-app-text rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 uppercase"
            >
              <option value="avulso">Rotativo Avulso</option>
              <option value="mensalista" disabled={matchedSub?.status !== 'active'}>Mensalista</option>
              <option value="convenio">Convênio Desconto</option>
              <option value="cortesia">Cortesia Isento</option>
            </select>
          </div>
        </div>

        {/* Observations */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Observações / Condutor</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="EX: RISCOS NA LATERAL ESQUERDA"
            rows={2}
            className="w-full bg-app-bg border border-app-border text-app-text rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
          />
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-500 flex items-center gap-2 uppercase">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded text-[10px] font-bold uppercase shadow transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Registrando Entrada...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Gerar Ticket & Registrar Entrada</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
