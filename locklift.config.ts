import '@broxus/locklift-verifier';
import '@broxus/locklift-deploy';

import { lockliftChai, LockliftConfig } from 'locklift';
import { Deployments } from '@broxus/locklift-deploy';
import * as dotenv from 'dotenv';
import chai from 'chai';

import { FactorySource } from './build/factorySource';

dotenv.config();
chai.use(lockliftChai);

declare global {
  const locklift: import('locklift').Locklift<FactorySource>;
}

declare module 'locklift' {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  export interface Locklift {
    deployments: Deployments<FactorySource>;
  }
}

const config: LockliftConfig = {
  compiler: {
    version: '0.62.0',
    externalContractsArtifacts: {
      'node_modules/@broxus/tip4/build': ['Index', 'IndexBasis'],
    },
  },
  linker: { version: '0.15.48' },
  verifier: {
    verifierVersion: 'latest',
    apiKey: process.env['EVERSCAN_API_KEY'],
    secretKey: process.env['EVERSCAN_SECRET_KEY'],
  },
  networks: {
    local: {
      connection: {
        id: 1337,
        group: 'localnet',
        type: 'graphql',
        data: {
          endpoints: [process.env['LOCAL_NETWORK_ENDPOINT']],
          latencyDetectionInterval: 1000,
          local: true,
        },
      },
      giver: {
        address:
          '0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415',
        key: '172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3',
      },
      keys: {
        amount: 20,
        phrase:
          'action inject penalty envelope rabbit element slim tornado dinner pizza off blood',
      },
    },
    testnet: {
      connection: {
        id: 1010,
        group: 'testnet',
        type: 'jrpc',
        data: {
          endpoint: process.env['VENOM_TESTNET_RPC_NETWORK_ENDPOINT'],
        },
      },
      giver: {
        address: process.env['VENOM_TESTNET_GIVER_ADDRESS'],
        phrase: process.env['VENOM_TESTNET_GIVER_PHRASE'],
        accountId: 0,
      },
      keys: {
        phrase: process.env['VENOM_TESTNET_PHRASE'],
        amount: 20,
      },
    },
    mainnet: {
      connection: 'mainnetJrpc',
      giver: {
        address: process.env['MAINNET_GIVER_ADDRESS'],
        key: process.env['MAINNET_GIVER_KEY'],
      },
      keys: {
        phrase: process.env['MAINNET_PHRASE'],
        amount: 20,
      },
    },
    locklift: {
      giver: {
        address: process.env['LOCAL_GIVER_ADDRESS'],
        key: process.env['LOCAL_GIVER_KEY'],
      },
      connection: {
        id: 1001,
        type: 'proxy',
        data: {} as never,
      },
      keys: {
        phrase: process.env['LOCAL_PHRASE'],
        amount: 20,
      },
    },
  },
  mocha: { timeout: 2000000, bail: true },
};

export default config;
