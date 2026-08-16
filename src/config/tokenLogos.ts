import React from 'react';

export interface TokenLogoMeta {
  symbol: string;
  name: string;
  category: 'crypto' | 'stablecoin' | 'native' | 'reward' | 'fiat';
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  gifBackground: string;
  badgeLabel: string;
  description: string;
  svgIcon: string;
}

export const TOKEN_LOGO_DATA: Record<string, TokenLogoMeta> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'native',
    primaryColor: '#F7931A',
    secondaryColor: '#FFAB40',
    glowColor: 'rgba(247, 147, 26, 0.4)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #FFE082, #F7931A 60%, #E65100 100%)',
    badgeLabel: 'Layer 1 Coin',
    description: 'The premier decentralized digital store of value & currency.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M22.5 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1.1-.3l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.7.8 1.1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.9 2 2.2.6c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.6.4.7-2.8c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.4zm-3.7 5.1c-.5 2-3.9.9-5 .6l.9-3.6c1.1.3 4.6.9 4.1 3zm.5-5.2c-.5 1.8-3.3.9-4.2.7l.8-3.3c.9.2 3.8.7 3.4 2.6z" fill="white"/>
    </svg>`,
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    category: 'crypto',
    primaryColor: '#F7931A',
    secondaryColor: '#302C3F',
    glowColor: 'rgba(247, 147, 26, 0.35)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #FFB74D, #F7931A 60%, #302C3F 100%)',
    badgeLabel: 'ERC20 Bitcoin',
    description: '1:1 Bitcoin backed ERC-20 token on EVM networks.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#302C3F"/>
      <circle cx="16" cy="16" r="13" stroke="#F7931A" stroke-width="2"/>
      <path d="M21 14c.2-1.5-.9-2.3-2.5-2.8l.5-2-1.2-.3-.5 2c-.3-.1-.7-.2-1-.2l.5-2-1.2-.3-.5 2c-.3-.1-.5-.1-.8-.2l-1.7-.4-.3 1.3s.9.2.9.2c.5.1.6.5.6.8l-.6 2.4l-.8 3.4c-.1.2-.2.4-.6.3 0 0-.9-.2-.9-.2l-.6 1.5 1.6.4c.3.1.6.2.9.2l-.5 2.1 1.2.3.5-2c.4.1.7.2 1 .2l-.5 2.1 1.2.3.5-2.1c2.1.4 3.7.2 4.4-1.7.5-1.5-.1-2.4-1.1-2.9.8-.2 1.4-.8 1.6-1.8zm-2.8 3.8c-.4 1.5-2.9.7-3.7.5l.7-2.7c.8.2 3.4.7 3 2.2zm.4-3.9c-.4 1.4-2.5.7-3.2.5l.6-2.5c.7.2 2.9.5 2.6 2z" fill="#F7931A"/>
    </svg>`,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'native',
    primaryColor: '#627EEA',
    secondaryColor: '#A4B4F5',
    glowColor: 'rgba(98, 126, 234, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #B8C7FF, #627EEA 60%, #2A3B8F 100%)',
    badgeLabel: 'Smart Contracts',
    description: 'Decentralized open-source blockchain with smart contract functionality.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16 4L9 16.5L16 20.7L23 16.5L16 4Z" fill="white" fill-opacity="0.6"/>
      <path d="M16 4L16 20.7L23 16.5L16 4Z" fill="white"/>
      <path d="M16 22.2L9 18L16 28L23 18L16 22.2Z" fill="white" fill-opacity="0.6"/>
      <path d="M16 22.2L16 28L23 18L16 22.2Z" fill="white"/>
      <path d="M16 19.3L9 15.1L16 12L23 15.1L16 19.3Z" fill="white" fill-opacity="0.2"/>
    </svg>`,
  },
  VERSE: {
    symbol: 'VERSE',
    name: 'Verse Token',
    category: 'reward',
    primaryColor: '#00D2FE',
    secondaryColor: '#7C3AED',
    glowColor: 'rgba(0, 210, 254, 0.55)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #00F5FF, #7C3AED 50%, #FF0080 100%)',
    badgeLabel: 'Verse Ecosystem',
    description: 'Official reward and utility engine powering the Bitcoin.com Verse ecosystem.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="verse_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00D2FE" />
          <stop offset="50%" stop-color="#7C3AED" />
          <stop offset="100%" stop-color="#FF0080" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#verse_grad)"/>
      <path d="M18.5 6L10 17H16L13.5 26L22 15H16L18.5 6Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/>
    </svg>`,
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    category: 'native',
    primaryColor: '#14F195',
    secondaryColor: '#9945FF',
    glowColor: 'rgba(20, 241, 149, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #14F195, #9945FF 85%, #03001C 100%)',
    badgeLabel: 'High Speed L1',
    description: 'Ultra-fast blockchain built for global decentralized commerce & payments.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0D0D12"/>
      <path d="M8.5 21.8C8.7 21.6 9 21.5 9.3 21.5H23.2C23.6 21.5 23.8 21.9 23.5 22.2L20.8 24.9C20.6 25.1 20.3 25.2 20 25.2H6.1C5.7 25.2 5.5 24.8 5.8 24.5L8.5 21.8Z" fill="url(#sol_g1)"/>
      <path d="M8.5 7.1C8.7 6.9 9 6.8 9.3 6.8H23.2C23.6 6.8 23.8 7.2 23.5 7.5L20.8 10.2C20.6 10.4 20.3 10.5 20 10.5H6.1C5.7 10.5 5.5 10.1 5.8 9.8L8.5 7.1Z" fill="url(#sol_g2)"/>
      <path d="M20.8 14.5C20.6 14.3 20.3 14.2 20 14.2H6.1C5.7 14.2 5.5 14.6 5.8 14.9L8.5 17.6C8.7 17.8 9 17.9 9.3 17.9H23.2C23.6 17.9 23.8 17.5 23.5 17.2L20.8 14.5Z" fill="url(#sol_g3)"/>
      <defs>
        <linearGradient id="sol_g1" x1="5.6" y1="23.4" x2="23.7" y2="23.4" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/>
        </linearGradient>
        <linearGradient id="sol_g2" x1="5.6" y1="8.7" x2="23.7" y2="8.7" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/>
        </linearGradient>
        <linearGradient id="sol_g3" x1="5.6" y1="16.1" x2="23.7" y2="16.1" gradientUnits="userSpaceOnUse">
          <stop stop-color="#DC1FFF"/><stop offset="1" stop-color="#00FFA3"/>
        </linearGradient>
      </defs>
    </svg>`,
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB Chain',
    category: 'native',
    primaryColor: '#F0B90B',
    secondaryColor: '#F8D33A',
    glowColor: 'rgba(240, 185, 11, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #FFE082, #F0B90B 65%, #C28B00 100%)',
    badgeLabel: 'BNB Smart Chain',
    description: 'Native gas and settlement token of the BNB Chain ecosystem.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F0B90B"/>
      <path d="M16 7L19.5 10.5L14 16L10.5 12.5L16 7Z" fill="white"/>
      <path d="M21.5 12.5L25 16L21.5 19.5L18 16L21.5 12.5Z" fill="white"/>
      <path d="M16 25L10.5 19.5L14 16L19.5 21.5L16 25Z" fill="white"/>
      <path d="M6.5 16L10 12.5L13.5 16L10 19.5L6.5 16Z" fill="white"/>
      <path d="M16 13.5L18.5 16L16 18.5L13.5 16L16 13.5Z" fill="white"/>
    </svg>`,
  },
  TRX: {
    symbol: 'TRX',
    name: 'TRON',
    category: 'native',
    primaryColor: '#FF060A',
    secondaryColor: '#FF4D4F',
    glowColor: 'rgba(255, 6, 10, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #FF8A80, #FF060A 60%, #B71C1C 100%)',
    badgeLabel: 'TRC20 Network',
    description: 'High-throughput public blockchain optimized for global stablecoin settlements.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#FF060A"/>
      <path d="M24 10.5L8.5 7L13.5 25L24 10.5ZM13.8 22.8L9.9 8.6L21.8 11.3L13.8 22.8Z" fill="white"/>
      <path d="M14.5 12L22 11L15.5 20.5L14.5 12Z" fill="white"/>
    </svg>`,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    category: 'stablecoin',
    primaryColor: '#26A17B',
    secondaryColor: '#53D3AC',
    glowColor: 'rgba(38, 161, 123, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #A7F3D0, #26A17B 60%, #064E3B 100%)',
    badgeLabel: 'USD Stablecoin',
    description: 'The world’s most widely traded 1:1 USD-pegged digital token.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path d="M17.9 15.7C17.8 15.7 17 15.8 16 15.8C15.1 15.8 14.3 15.7 14.1 15.7C10.7 15.5 8.1 14.7 8.1 13.8C8.1 12.8 10.7 12.1 14.1 11.9V9.5H11.5V7.5H20.5V9.5H17.9V11.9C21.3 12.1 23.9 12.8 23.9 13.8C23.9 14.7 21.3 15.5 17.9 15.7ZM17.9 16.5C21.4 16.3 24.1 15.5 24.1 14.5C24.1 13.5 21.4 12.8 17.9 12.6V15.2C17.3 15.3 16.7 15.3 16 15.3C15.3 15.3 14.7 15.3 14.1 15.2V12.6C10.6 12.8 7.9 13.5 7.9 14.5C7.9 15.5 10.6 16.3 14.1 16.5V24.5H17.9V16.5Z" fill="white"/>
    </svg>`,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    category: 'stablecoin',
    primaryColor: '#2775CA',
    secondaryColor: '#68A8F2',
    glowColor: 'rgba(39, 117, 202, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #90CAF9, #2775CA 60%, #0D47A1 100%)',
    badgeLabel: 'USD Stablecoin',
    description: 'Fully reserved, highly regulated US dollar digital currency.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path d="M16 4C9.4 4 4 9.4 4 16C4 22.6 9.4 28 16 28C22.6 28 28 22.6 28 16C28 9.4 22.6 4 16 4ZM16 26C10.5 26 6 21.5 6 16C6 10.5 10.5 6 16 6C21.5 6 26 10.5 26 16C26 21.5 21.5 26 16 26Z" fill="white" fill-opacity="0.3"/>
      <path d="M15.2 12.2C13.8 12.5 13 13.2 13 14.2C13 15.3 13.8 15.9 15.5 16.3L16.6 16.5C18.3 16.9 19 17.5 19 18.8C19 20.3 17.7 21.2 15.8 21.2C14.3 21.2 13 20.7 12 19.8L12.9 18.2C13.7 18.9 14.7 19.4 15.8 19.4C16.8 19.4 17.3 19 17.3 18.3C17.3 17.4 16.6 16.9 15 16.5L13.9 16.2C12.3 15.8 11.4 15 11.4 13.7C11.4 12.2 12.6 11.2 14.5 11.1V9.5H15.8V11.1C16.9 11.2 18 11.6 18.8 12.2L17.9 13.7C17.2 13.2 16.3 12.8 15.3 12.8L15.2 12.2ZM15.8 21.2V22.5H14.5V21.2C14.7 21.2 15 21.2 15.2 21.2H15.8Z" fill="white"/>
    </svg>`,
  },
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon (POL)',
    category: 'native',
    primaryColor: '#8247E5',
    secondaryColor: '#B088FF',
    glowColor: 'rgba(130, 71, 229, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #D1C4E9, #8247E5 60%, #4A148C 100%)',
    badgeLabel: 'Polygon PoS',
    description: 'Scalable Ethereum Layer-2 multi-chain architecture for low fees.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#8247E5"/>
      <path d="M21.2 12.8C20.6 12.4 19.8 12.4 19.2 12.8L15.9 14.7L13.8 15.9L10.5 17.8C9.9 18.2 9.1 18.2 8.5 17.8L6.4 16.6C5.8 16.2 5.4 15.6 5.4 14.9C5.4 14.2 5.8 13.6 6.4 13.2L8.5 12C9.1 11.6 9.9 11.6 10.5 12L12.6 13.2C13.2 13.6 13.6 14.2 13.6 14.9V17.1L15.9 18.4L18.2 17.1V14.9C18.2 14.2 17.8 13.6 17.2 13.2L15.1 12L17.4 10.7L19.5 11.9C20.1 12.3 20.9 12.3 21.5 11.9L23.6 10.7C24.2 10.3 24.6 9.7 24.6 9C24.6 8.3 24.2 7.7 23.6 7.3L21.5 6.1C20.9 5.7 20.1 5.7 19.5 6.1L17.4 7.3C16.8 7.7 16.4 8.3 16.4 9V11.2L14.1 12.5L11.8 11.2V9C11.8 8.3 12.2 7.7 12.8 7.3L14.9 6.1L12.6 4.8L10.5 6C9.9 6.4 9.1 6.4 8.5 6L6.4 4.8C5.8 4.4 5 4.4 4.4 4.8C3.8 5.2 3.4 5.8 3.4 6.5C3.4 7.2 3.8 7.8 4.4 8.2L6.5 9.4L4.4 10.6C3.8 11 3.4 11.6 3.4 12.3C3.4 13 3.8 13.6 4.4 14L6.5 15.2L4.4 16.4C3.8 16.8 3.4 17.4 3.4 18.1C3.4 18.8 3.8 19.4 4.4 19.8L8.5 22.2C9.1 22.6 9.9 22.6 10.5 22.2L13.8 20.3L15.9 19.1L19.2 17.2C19.8 16.8 20.6 16.8 21.2 17.2L23.3 18.4C23.9 18.8 24.3 19.4 24.3 20.1C24.3 20.8 23.9 21.4 23.3 21.8L21.2 23C20.6 23.4 19.8 23.4 19.2 23L17.1 21.8C16.5 21.4 16.1 20.8 16.1 20.1V17.9L13.8 16.6L11.5 17.9V20.1C11.5 20.8 11.9 21.4 12.5 21.8L14.6 23L12.3 24.3L10.2 23.1C9.6 22.7 8.8 22.7 8.2 23.1L6.1 24.3C5.5 24.7 5.1 25.3 5.1 26C5.1 26.7 5.5 27.3 6.1 27.7L8.2 28.9C8.8 29.3 9.6 29.3 10.2 28.9L12.3 27.7C12.9 27.3 13.3 26.7 13.3 26V23.8L15.6 22.5L17.9 23.8V26C17.9 26.7 17.5 27.3 16.9 27.7L14.8 28.9L17.1 30.2L19.2 29C19.8 28.6 20.6 28.6 21.2 29L23.3 30.2C23.9 30.6 24.7 30.6 25.3 30.2C25.9 29.8 26.3 29.2 26.3 28.5C26.3 27.8 25.9 27.2 25.3 26.8L23.2 25.6L25.3 24.4C25.9 24 26.3 23.4 26.3 22.7C26.3 22 25.9 21.4 25.3 21L23.2 19.8L25.3 18.6C25.9 18.2 26.3 17.6 26.3 16.9C26.3 16.2 25.9 15.6 25.3 15.2L21.2 12.8Z" fill="white"/>
    </svg>`,
  },
  POL: {
    symbol: 'POL',
    name: 'Polygon 2.0 (POL)',
    category: 'native',
    primaryColor: '#8247E5',
    secondaryColor: '#B088FF',
    glowColor: 'rgba(130, 71, 229, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #D1C4E9, #8247E5 60%, #4A148C 100%)',
    badgeLabel: 'Polygon 2.0',
    description: 'Upgraded native next-generation staking & gas token of Polygon.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#8247E5"/>
      <path d="M16 6L24.5 11V21L16 26L7.5 21V11L16 6Z" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M16 11L20.5 13.5V18.5L16 21L11.5 18.5V13.5L16 11Z" fill="white"/>
    </svg>`,
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    category: 'stablecoin',
    primaryColor: '#F5AC37',
    secondaryColor: '#FBD28B',
    glowColor: 'rgba(245, 172, 55, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #FFE082, #F5AC37 60%, #B26A00 100%)',
    badgeLabel: 'Decentralized USD',
    description: 'MakerDAO collateralized decentralized USD stablecoin.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F5AC37"/>
      <path d="M9.5 8H16C19.9 8 23 11.1 23 15C23 18.9 19.9 22 16 22H9.5V8ZM16 20C18.8 20 21 17.8 21 15C21 12.2 18.8 10 16 10H11.5V20H16Z" fill="white"/>
      <path d="M7 13H24V14.5H7V13Z" fill="white"/>
      <path d="M7 16.5H24V18H7V16.5Z" fill="white"/>
    </svg>`,
  },
  AVAX: {
    symbol: 'AVAX',
    name: 'Avalanche',
    category: 'native',
    primaryColor: '#E84142',
    secondaryColor: '#FF7B7C',
    glowColor: 'rgba(232, 65, 66, 0.45)',
    gifBackground: 'radial-gradient(circle at 30% 30%, #FFCDD2, #E84142 60%, #B71C1C 100%)',
    badgeLabel: 'Avalanche C-Chain',
    description: 'High-speed layer-one network built for decentralized finance applications.',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#E84142"/>
      <path d="M16.5 7L24.5 21H19.5L16.5 15.5L13.5 21H8.5L16.5 7Z" fill="white"/>
      <circle cx="16.5" cy="23.5" r="1.5" fill="white"/>
    </svg>`,
  },
};

export const FIAT_LOGO_DATA: Record<string, { symbol: string; name: string; flag: string; sign: string; color: string }> = {
  USD: { symbol: 'USD', name: 'US Dollar', flag: '🇺🇸', sign: '$', color: '#10B981' },
  EUR: { symbol: 'EUR', name: 'Euro', flag: '🇪🇺', sign: '€', color: '#3B82F6' },
  GBP: { symbol: 'GBP', name: 'British Pound', flag: '🇬🇧', sign: '£', color: '#8B5CF6' },
  CAD: { symbol: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', sign: 'CA$', color: '#EF4444' },
  AUD: { symbol: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', sign: 'AU$', color: '#F59E0B' },
  JPY: { symbol: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', sign: '¥', color: '#EC4899' },
};
