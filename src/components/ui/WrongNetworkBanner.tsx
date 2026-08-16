import React from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { getChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '../../config';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const WrongNetworkBanner: React.FC = () => {
  const { isConnected, isWrongNetwork, chainId, targetChainId, switchTargetNetwork, error } = useWeb3();

  if (!isConnected || !isWrongNetwork) return null;

  const currentChain = getChainConfig(chainId);
  const targetChain = getChainConfig(targetChainId) || SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900 text-xs z-30 transition-all animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-bounce" />
          <span>
            <strong>Wrong Network Detected:</strong> Connected to{' '}
            <span className="font-bold text-slate-950 font-mono">
              {currentChain ? currentChain.name : `Unsupported Chain (ID: ${chainId})`}
            </span>
            . IRISME requires <span className="font-bold text-[#7C3AED]">{targetChain.name}</span> for Verse ecosystem settlement.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="iris"
            size="sm"
            className="text-xs py-1 px-3 bg-gradient-to-r from-amber-500 to-pink-500 text-white border-0 shadow-sm"
            onClick={() => switchTargetNetwork(targetChainId)}
          >
            Switch to {targetChain.shortName}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
