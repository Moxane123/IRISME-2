// Contract addresses and ABIs configuration layer for IRISME

export interface ContractConfig {
  address: string;
  chainId: number;
}

// Payment Router / Merchant Settlement Contract Placeholders
export const PAYMENT_ROUTER_CONTRACTS: Record<number, string> = {
  137: import.meta.env.VITE_PAYMENT_ROUTER_CONTRACT || '', // Polygon Mainnet
  1: '', // Ethereum Mainnet
  80002: '', // Polygon Amoy
  11155111: '', // Sepolia
};

// Verse Rewards Distributor Contract Placeholders
export const REWARD_DISTRIBUTOR_CONTRACTS: Record<number, string> = {
  137: import.meta.env.VITE_REWARD_DISTRIBUTOR_CONTRACT || '',
  1: '',
  80002: '',
  11155111: '',
};

// Payment Router ABI for on-chain direct and routed merchant settlement
export const PAYMENT_ROUTER_ABI = [
  'function payMerchant(address merchant, address token, uint256 amount, string invoiceId) external payable',
  'function payMerchantWithReward(address merchant, address paymentToken, uint256 paymentAmount, uint256 verseCashback, string invoiceId) external payable',
  'event PaymentProcessed(address indexed customer, address indexed merchant, address token, uint256 amount, string invoiceId, uint256 timestamp)',
];

// Reward Distributor ABI for claiming merchant cashback & loyalty VERSE rewards
export const REWARD_DISTRIBUTOR_ABI = [
  'function claimRewards(bytes32[] proof, uint256 amount) external',
  'function merchantDepositRewardPool(uint256 amount) external',
  'function getClaimableRewards(address account) external view returns (uint256)',
  'event RewardsClaimed(address indexed customer, uint256 amount, uint256 timestamp)',
];

export const getPaymentRouterAddress = (chainId: number): string | undefined => {
  return PAYMENT_ROUTER_CONTRACTS[chainId] || undefined;
};

export const getRewardDistributorAddress = (chainId: number): string | undefined => {
  return REWARD_DISTRIBUTOR_CONTRACTS[chainId] || undefined;
};
