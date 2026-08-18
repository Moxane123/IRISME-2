import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from '../../context/RouterContext';
import { EssentialPaymentEventType, InAppPaymentNotification } from '../../types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Trash2,
  ExternalLink,
  Mail,
  ShieldCheck,
  X,
  Radio,
} from 'lucide-react';
import { TokenLogo } from './TokenLogo';

interface NotificationCenterProps {
  onSelectPayment?: (paymentId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectPayment }) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useApp();
  const { navigate } = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.eventType === filterType;
  });

  const getEventIcon = (eventType: EssentialPaymentEventType) => {
    switch (eventType) {
      case 'payment_received':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
        );
      case 'payment_confirmed':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'payment_failed':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'payment_expired':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'settlement_completed':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const getEventBadge = (eventType: EssentialPaymentEventType) => {
    switch (eventType) {
      case 'payment_received':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Received
          </span>
        );
      case 'payment_confirmed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Confirmed
          </span>
        );
      case 'payment_failed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        );
      case 'payment_expired':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Expired
          </span>
        );
      case 'settlement_completed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Settled
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (n: InAppPaymentNotification) => {
    if (!n.isRead) {
      markNotificationAsRead(n.id);
    }
    if (n.paymentId) {
      if (onSelectPayment) {
        onSelectPayment(n.paymentId);
      } else {
        navigate('/merchant/payments');
      }
      setIsOpen(false);
    } else if (n.settlementId) {
      navigate('/merchant/settlements');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-purple-50 border-purple-300 text-purple-700'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
        aria-label="In-App Payment Notifications"
        title="In-App Essential Payment Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FF0080] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Notifications Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/10 text-[#00D2FE]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Payment Notifications</h4>
                <p className="text-[10px] text-slate-300">Essential MVP event updates</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadNotificationCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Clear notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Event Filter Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('payment_confirmed')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'payment_confirmed'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilterType('payment_received')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'payment_received'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Received
            </button>
            <button
              onClick={() => setFilterType('settlement_completed')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'settlement_completed'
                  ? 'bg-purple-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Settled
            </button>
            <button
              onClick={() => setFilterType('payment_failed')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'payment_failed'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Failed
            </button>
            <button
              onClick={() => setFilterType('payment_expired')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'payment_expired'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Expired
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No notifications found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Essential status updates will appear here when transactions occur.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 relative ${
                    !item.isRead ? 'bg-purple-50/30' : 'bg-white'
                  }`}
                >
                  {!item.isRead && (
                    <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-[#FF0080]" />
                  )}
                  {getEventIcon(item.eventType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        {getEventBadge(item.eventType)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      {item.amountUSD !== undefined ? (
                        <div className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                          {item.tokenSymbol && (
                            <TokenLogo symbol={item.tokenSymbol} size="xs" />
                          )}
                          <span>${item.amountUSD.toFixed(2)} USD</span>
                        </div>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2">
                        {item.secondaryEmailSent && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100"
                            title="Secondary email notification dispatched"
                          >
                            <Mail className="w-2.5 h-2.5" />
                            <span>Email sent</span>
                          </span>
                        )}
                        <span className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-0.5">
                          <span>Details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Deduplicated on-chain event stream</span>
            </div>
            <button
              onClick={() => {
                navigate('/merchant/payments');
                setIsOpen(false);
              }}
              className="font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
