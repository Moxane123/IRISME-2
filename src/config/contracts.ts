// Token contract configurations layer for IRISME

export interface ContractConfig {
  address: string;
  chainId: number;
}

export const VERSE_TOKEN_CONTRACTS: Record<number, string> = {
  137: '0xc708d6f2153933daa50b2d0758955be0a93a8fec', // Polygon Mainnet
  1: '0x249ca82617ec3dfb2589c4c17ab7ec9765350a18',   // Ethereum Mainnet
};

export const getVerseTokenContractAddress = (chainId: number = 137): string => {
  if (chainId === 137) {
    return (
      import.meta.env.VITE_VERSE_TOKEN_CONTRACT ||
      import.meta.env.VITE_VERSE_TOKEN_POLYGON ||
      VERSE_TOKEN_CONTRACTS[137]
    );
  }
  return (
    import.meta.env.VITE_VERSE_TOKEN_ETHEREUM ||
    VERSE_TOKEN_CONTRACTS[1]
  );
};
