import React from 'react';
import { PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: PaymentStatus | 'active' | 'scheduled' | 'ended' | 'claimable' | 'claimed' | string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  pulse = false,
}) => {
  const norm = (status || '').toLowerCase().replace(/[\s_-]+/g, '_');

  const getStyle = () => {
    switch (norm) {
      case 'calculated':
      case 'reward_calculated':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold',
          dot: 'bg-cyan-500',
          label: 'Reward Calculated',
        };
      case 'distributed':
      case 'reward_distributed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
          dot: 'bg-emerald-500',
          label: 'Distributed On-Chain',
        };
      case 'claimable':
      case 'reward_claimable':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300 font-semibold',
          dot: 'bg-purple-500',
          label: 'Claimable',
        };
      case 'pending_distribution':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Pending Distribution',
        };
      case 'confirmed':
      case 'completed':
      case 'paid':
      case 'claimed':
      case 'active':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
          dot: 'bg-emerald-500',
          label: norm === 'paid' ? 'PAID' : norm === 'confirmed' || norm === 'completed' ? 'Confirmed' : norm === 'claimed' ? 'Claimed' : 'Active',
        };
      case 'created':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold',
          dot: 'bg-cyan-500',
          label: 'CREATED',
        };
      case 'processing':
      case 'confirming':
      case 'submitted':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold',
          dot: 'bg-indigo-500 animate-pulse',
          label: norm === 'processing' ? 'PROCESSING' : norm === 'confirming' ? 'Confirming' : 'Submitted',
        };
      case 'awaiting_payment':
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
          dot: 'bg-amber-500',
          label: norm === 'awaiting_payment' ? 'AWAITING PAYMENT' : 'Pending',
        };
      case 'scheduled':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold',
          dot: 'bg-cyan-500',
          label: 'Scheduled',
        };
      case 'expired':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-300 font-medium',
          dot: 'bg-slate-400',
          label: 'Expired',
        };
      case 'refunded':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
          dot: 'bg-slate-500',
          label: 'Refunded (On-Chain)',
        };
      case 'refund_requested':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Refund Requested',
        };
      case 'refund_processing':
        return {
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-300 font-semibold',
          dot: 'bg-indigo-500 animate-pulse',
          label: 'Refund Processing',
        };
      case 'refund_rejected':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
          dot: 'bg-rose-500',
          label: 'Refund Rejected',
        };
      case 'failed':
      case 'reverted':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
          dot: 'bg-rose-500',
          label: 'Failed',
        };
      case 'ended':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-300 font-medium',
          dot: 'bg-slate-400',
          label: 'Ended',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
          dot: 'bg-slate-400',
          label: status,
        };
    }
  };

  const style = getStyle();
  const sizeStyles =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1.5'
      : size === 'lg'
      ? 'text-sm px-3.5 py-1.5 gap-2.5 font-bold'
      : 'text-xs px-2.5 py-1 gap-2';

  const isPulsing =
    pulse &&
    (norm === 'awaiting_payment' ||
      norm === 'pending' ||
      norm === 'submitted' ||
      norm === 'confirming' ||
      norm === 'active');

  return (
    <span
      className={`inline-flex items-center rounded-full border ${style.bg} ${sizeStyles} select-none whitespace-nowrap shadow-xs`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isPulsing && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${style.dot.split(' ')[0]}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot.split(' ')[0]}`} />
      </span>
      <span>{style.label}</span>
    </span>
  );
};
