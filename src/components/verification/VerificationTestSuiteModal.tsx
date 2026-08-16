import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  Copy,
  Layers,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { ApiService } from '../../services/apiService';
import { BlockchainVerificationReport, VerificationTestScenario, VerificationAuditLog } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPaymentId?: string;
}

const TEST_SCENARIOS: {
  id: VerificationTestScenario;
  title: string;
  expectedOutcome: 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  description: string;
  tag: string;
  color: string;
}[] = [
  {
    id: 'SUCCESSFUL_PAYMENT',
    title: '1. Standard Valid Payment',
    expectedOutcome: 'CONFIRMED',
    description: 'Valid chain (Polygon), merchant address, exact token & amount, successful receipt.',
    tag: 'Expected: PASS (CONFIRMED)',
    color: 'emerald',
  },
  {
    id: 'FAILED_REVERTED_TX',
    title: '2. Failed / Reverted On-Chain Tx',
    expectedOutcome: 'FAILED',
    description: 'Transaction submitted but reverted during EVM execution (receipt.status == 0).',
    tag: 'Expected: REJECT (FAILED)',
    color: 'rose',
  },
  {
    id: 'DUPLICATE_TX_REPLAY',
    title: '3. Duplicate Tx Replay (Idempotency)',
    expectedOutcome: 'FAILED',
    description: 'Customer attempts to submit a transaction hash already credited to another invoice.',
    tag: 'Expected: REJECT (REPLAY PREVENTED)',
    color: 'amber',
  },
  {
    id: 'INCORRECT_AMOUNT_UNDERPAYMENT',
    title: '4. Incorrect Amount (Underpayment)',
    expectedOutcome: 'FAILED',
    description: 'Customer paid 5.0 USDT for a 25.0 USDT invoice. Strict sufficiency check triggered.',
    tag: 'Expected: REJECT (UNDERPAID)',
    color: 'rose',
  },
  {
    id: 'INCORRECT_NETWORK_MISMATCH',
    title: '5. Incorrect Network / Chain Mismatch',
    expectedOutcome: 'FAILED',
    description: 'Invoice expects Polygon (137) but transaction was submitted on Ethereum (1).',
    tag: 'Expected: REJECT (WRONG NETWORK)',
    color: 'purple',
  },
  {
    id: 'INCORRECT_TOKEN_MISMATCH',
    title: '6. Incorrect Token / Asset Mismatch',
    expectedOutcome: 'FAILED',
    description: 'Invoice requests USDT stablecoin but payer transferred ETH asset.',
    tag: 'Expected: REJECT (TOKEN MISMATCH)',
    color: 'indigo',
  },
  {
    id: 'INCORRECT_RECIPIENT_ADDRESS',
    title: '7. Incorrect Merchant Recipient Address',
    expectedOutcome: 'FAILED',
    description: 'Funds sent to an untrusted address rather than merchant settlement wallet.',
    tag: 'Expected: REJECT (WRONG RECIPIENT)',
    color: 'red',
  },
  {
    id: 'EXPIRED_PAYMENT_ATTEMPT',
    title: '8. Expired Payment Window Attempt',
    expectedOutcome: 'EXPIRED',
    description: 'Customer attempts payment after invoice validity countdown has lapsed.',
    tag: 'Expected: REJECT (EXPIRED)',
    color: 'slate',
  },
];

export const VerificationTestSuiteModal: React.FC<Props> = ({ isOpen, onClose, initialPaymentId }) => {
  const [selectedScenario, setSelectedScenario] = useState<VerificationTestScenario>('SUCCESSFUL_PAYMENT');
  const [isRunning, setIsRunning] = useState(false);
  const [activeReport, setActiveReport] = useState<BlockchainVerificationReport | null>(null);
  const [lastScenarioRun, setLastScenarioRun] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'harness' | 'audit_logs'>('harness');
  const [auditLogs, setAuditLogs] = useState<VerificationAuditLog[]>([]);
  const [processedTxCount, setProcessedTxCount] = useState(0);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAuditLogs();
    }
  }, [isOpen]);

  const loadAuditLogs = async () => {
    try {
      const data = await ApiService.getVerificationAuditLogs();
      setAuditLogs(data.logs || []);
      setProcessedTxCount(data.totalProcessedTransactions || 0);
    } catch (e) {
      console.warn('Failed to fetch audit logs:', e);
    }
  };

  const handleRunScenario = async (scenarioToRun: VerificationTestScenario = selectedScenario) => {
    setIsRunning(true);
    setActiveReport(null);
    setLastScenarioRun(scenarioToRun);

    try {
      const res = await ApiService.runVerificationScenario(scenarioToRun, initialPaymentId);
      setActiveReport(res.report);
      await loadAuditLogs();
    } catch (err: any) {
      console.error('Scenario run error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  const currentScenarioMeta = TEST_SCENARIOS.find((s) => s.id === selectedScenario);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-500/20 to-cyan-500/20 border border-iris-500/40 flex items-center justify-center text-iris-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Independent Blockchain Verification Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-iris-500/10 border border-iris-500/30 text-[10px] font-bold text-iris-300">
                  MVP Technical Core
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rule: Wallet transaction submission ≠ Payment received. Independent 8-point backend verification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('harness')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'harness'
                ? 'border-iris-400 text-white bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-iris-400" />
            <span>Verification Test Suite & Scenarios</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audit_logs');
              loadAuditLogs();
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'audit_logs'
                ? 'border-iris-400 text-white bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Immutable Verification Audit Log ({auditLogs.length})</span>
            {processedTxCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {processedTxCount} Idempotent Locks
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'harness' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Test Scenarios Picker */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Select Verification Scenario
                  </span>
                  <span className="text-[11px] text-slate-500">8 Test Cases</span>
                </div>

                <div className="space-y-2">
                  {TEST_SCENARIOS.map((sc) => {
                    const isSelected = selectedScenario === sc.id;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => setSelectedScenario(sc.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col space-y-1 ${
                          isSelected
                            ? 'bg-slate-800/90 border-iris-500/80 shadow-md ring-1 ring-iris-500/30'
                            : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {sc.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              sc.expectedOutcome === 'CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : sc.expectedOutcome === 'EXPIRED'
                                ? 'bg-slate-700/40 text-slate-300 border border-slate-600'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {sc.expectedOutcome}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{sc.description}</p>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="iris"
                  fullWidth
                  onClick={() => handleRunScenario(selectedScenario)}
                  disabled={isRunning}
                  className="mt-4 flex items-center justify-center space-x-2 py-3 shadow-lg shadow-iris-500/20"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Executing Independent Verification Engine...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white" />
                      <span>Run Test: {currentScenarioMeta?.title.split('.')[1] || 'Scenario'}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Right Column: Real-Time Verification Report & Checks Breakdown */}
              <div className="md:col-span-7 space-y-4">
                {activeReport ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Status Banner */}
                    <div
                      className={`p-4 rounded-xl border flex items-start justify-between ${
                        activeReport.verified
                          ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                          : activeReport.status === 'EXPIRED'
                          ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                          : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {activeReport.verified ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : activeReport.status === 'EXPIRED' ? (
                          <Clock className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold uppercase tracking-wider">
                              Status: {activeReport.status}
                            </span>
                            {activeReport.isIdempotentReplay && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                                Idempotent Replay
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 opacity-90">
                            {activeReport.verified
                              ? 'All 8 blockchain parameters verified independently. Payment credited.'
                              : activeReport.errorMessage || 'Verification rejected by backend rules.'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Scenario Tested</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{lastScenarioRun}</span>
                      </div>
                    </div>

                    {/* Metadata summary bar */}
                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Invoice / Pay ID</span>
                        <span className="font-mono font-bold text-slate-200 truncate block">
                          {activeReport.paymentId}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Target Network</span>
                        <span className="font-medium text-slate-200">{activeReport.network}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Required Asset</span>
                        <span className="font-medium text-slate-200">
                          {activeReport.amountExpected} {activeReport.tokenSymbol}
                        </span>
                      </div>
                    </div>

                    {/* 8-Point Independent Check List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span className="font-bold uppercase tracking-wider">Independent Backend Checks</span>
                        <span>
                          {Object.values(activeReport.checks || {}).filter((c: any) => c.status === 'PASSED').length}/
                          {Object.keys(activeReport.checks || {}).length} Passed
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {Object.entries(activeReport.checks || {}).map(([key, check]: [string, any]) => {
                          const isExpanded = expandedCheck === key;
                          const isPassed = check.status === 'PASSED';
                          const isFailed = check.status === 'FAILED';

                          return (
                            <div
                              key={key}
                              className={`rounded-lg border transition-all text-xs overflow-hidden ${
                                isPassed
                                  ? 'bg-slate-950/40 border-emerald-900/40 hover:border-emerald-800/60'
                                  : isFailed
                                  ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700'
                                  : 'bg-slate-950/20 border-slate-800 text-slate-400'
                              }`}
                            >
                              <button
                                onClick={() => setExpandedCheck(isExpanded ? null : key)}
                                className="w-full px-3 py-2 flex items-center justify-between text-left"
                              >
                                <div className="flex items-center space-x-2">
                                  {isPassed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  ) : isFailed ? (
                                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                  )}
                                  <span className={`font-semibold ${isFailed ? 'text-rose-300' : 'text-slate-200'}`}>
                                    {check.name}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                                      isPassed
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : isFailed
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {check.status}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="px-3 pb-2.5 pt-1 border-t border-slate-800/60 space-y-1.5 text-[11px] bg-slate-900/60">
                                  <p className="text-slate-400">{check.description}</p>
                                  {check.details && (
                                    <div className="text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                                      {check.details}
                                    </div>
                                  )}
                                  {check.error && (
                                    <div className="text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-900/60">
                                      <strong>Failure Reason:</strong> {check.error}
                                    </div>
                                  )}
                                  {(check.expected !== undefined || check.actual !== undefined) && (
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950/50 p-2 rounded border border-slate-800">
                                      <div>
                                        <span className="text-slate-500 block">Expected:</span>
                                        <span className="text-slate-300">{String(check.expected)}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Received:</span>
                                        <span
                                          className={
                                            check.status === 'FAILED' ? 'text-rose-400 font-bold' : 'text-slate-300'
                                          }
                                        >
                                          {String(check.actual)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Idempotency & Cryptographic Key Details */}
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-iris-400" />
                          <span className="font-bold text-slate-300">Idempotency Key & Proof</span>
                        </div>
                        <button
                          onClick={() => {
                            if (activeReport.txHash) {
                              navigator.clipboard.writeText(activeReport.txHash);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 1500);
                            }
                          }}
                          className="text-[10px] text-iris-400 hover:text-iris-300 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey ? 'Copied Tx!' : 'Copy Tx Hash'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-slate-400 break-all text-[10px] bg-slate-900 p-2 rounded border border-slate-800">
                        {activeReport.txHash || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/20">
                    <ShieldCheck className="w-12 h-12 text-slate-600" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-300">Ready to Test Verification Engine</h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Select any test scenario from the left panel and click &ldquo;Run Test&rdquo; to simulate
                        multi-point on-chain verification, replay protection, and error rejection.
                      </p>
                    </div>
                    <Button
                      variant="iris"
                      onClick={() => handleRunScenario('SUCCESSFUL_PAYMENT')}
                      className="text-xs"
                    >
                      Run 1st Test (Standard Payment)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audit Logs View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Immutable Verification Audit Trail</h4>
                  <p className="text-xs text-slate-400">
                    Every verification attempt is recorded with failure reasons, idempotency locks, and block receipts.
                  </p>
                </div>
                <Button variant="secondary" onClick={loadAuditLogs} className="text-xs flex items-center space-x-1">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Refresh Logs</span>
                </Button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No verification attempts recorded yet. Run a test scenario to generate audit entries.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {log.verified ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : log.status === 'EXPIRED' ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                            <Clock className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-200">{log.paymentId}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                log.verified
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : log.status === 'EXPIRED'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {log.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {log.tokenAmount} {log.tokenSymbol} ({log.network})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                            Tx: {log.txHash} {log.reason && `— [${log.reason}]`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-500">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="block font-medium text-slate-400">{log.checksSummary}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Independent Backend Verification: Active & Enforced</span>
          </div>

          <Button variant="secondary" onClick={onClose} className="text-xs">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
