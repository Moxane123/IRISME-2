/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLYGON_RPC_URL?: string;
  readonly VITE_POLYGON_AMOY_RPC_URL?: string;
  readonly VITE_ETHEREUM_RPC_URL?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
  readonly VITE_DEFAULT_CHAIN_ID?: string;
  readonly VITE_VERSE_TOKEN_POLYGON?: string;
  readonly VITE_VERSE_TOKEN_ETHEREUM?: string;
  readonly VITE_REWARD_DISTRIBUTOR_POLYGON?: string;
  readonly VITE_LOYALTY_PASS_NFT_POLYGON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
