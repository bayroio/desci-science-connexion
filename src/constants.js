export const IPFS_GATEWAY_BASE_URL = 'https://2eff.lukso.dev/ipfs/'; // TODO: the gateway should be without /ipfs/
export const IPFS_GATEWAY_API_BASE_URL = 'https://api.2eff.lukso.dev:443';
export const BLOCKCHAIN_EXPLORER_BASE_URL = 'https://blockscout.com/lukso/l14';
export const URL_PROFILE_SEARCH = 'https://erc725cache.l14.lukso.network/front-page'
export const URL_ASSETS_SEARCH = 'https://erc725cache.l14.lukso.network/assets'
export const URL_PROFILE_ASSETS = 'https://universalprofile.cloud/'
export const URL_PROFILE_NO_IMAGE = 'https://s2.coinmarketcap.com/static/img/coins/200x200/5625.png'
export const URL_ASSETS_NO_IMAGE = 'https://s2.coinmarketcap.com/static/img/coins/200x200/5625.png'
export const URL_REFRESH_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2805/2805355.png'


export const PROFILE_COUNT = 4;
export const ASSETS_COUNT = 4;


// https://docs.lukso.tech/standards/smart-contracts/interface-ids
export const INTERFACE_IDS = {
  LSP7DigitalAsset: '0x01ffc9a7', //'0xe33f65c3',
  LSP8IdentifiableDigitalAsset: '0x49399145',
};

export const COMMON_ABIS = {
  supportsInterface: {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
};

export const CHAIN_IDS = {
  L14: 22,
  L14_HEX: '0x16',
  L16: 2828,
  L16_HEX: '0xb0c',
};

export const RPC_URLS = {
  L14: 'https://rpc.l14.lukso.network',
  L16: 'https://rpc.l16.lukso.network',
};

export const BLOCK_EXPLORER_URLS = {
  L14: 'https://blockscout.com/lukso/l14',
  L16: 'https://explorer.execution.l16.lukso.network',
};
