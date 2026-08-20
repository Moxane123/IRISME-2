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
  'function pay(address merchant, uint256 amount, bytes32 paymentId) external',
  'function payMerchant(address merchant, address token, uint256 amount, string invoiceId) external payable',
  'function payMerchantWithReward(address merchant, address paymentToken, uint256 paymentAmount, uint256 verseCashback, string invoiceId) external payable',
  'event Payment(address indexed payer, address indexed merchant, uint256 amount, bytes32 indexed paymentId)',
  'event PaymentProcessed(address indexed customer, address indexed merchant, address token, uint256 amount, string invoiceId, uint256 timestamp)',
];

// Reward Distributor ABI for claiming merchant cashback & loyalty VERSE rewards
export const REWARD_DISTRIBUTOR_ABI = [
  'function claimRewards(bytes32[] proof, uint256 amount) external',
  'function merchantDepositRewardPool(uint256 amount) external',
  'function getClaimableRewards(address account) external view returns (uint256)',
  'event RewardsClaimed(address indexed customer, uint256 amount, uint256 timestamp)',
];

export const getPaymentRouterAddress = (chainId: number = 137): string | undefined => {
  if (chainId === 137 && import.meta.env.VITE_PAYMENT_ROUTER_CONTRACT) {
    return import.meta.env.VITE_PAYMENT_ROUTER_CONTRACT;
  }
  return PAYMENT_ROUTER_CONTRACTS[chainId] || undefined;
};

export const getVerseTokenContractAddress = (chainId: number = 137): string => {
  if (chainId === 137) {
    return (
      import.meta.env.VITE_VERSE_TOKEN_CONTRACT ||
      import.meta.env.VITE_VERSE_TOKEN_POLYGON ||
      '0xc708d6f2153933daa50b2d0758955be0a93a8fec'
    );
  }
  return (
    import.meta.env.VITE_VERSE_TOKEN_ETHEREUM ||
    '0x249ca82617ec3dfb2589c4c17ab7ec9765350a18'
  );
};

export const getRewardDistributorAddress = (chainId: number = 137): string | undefined => {
  return REWARD_DISTRIBUTOR_CONTRACTS[chainId] || undefined;
};
