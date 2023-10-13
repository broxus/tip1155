import { WalletTypes, toNano } from 'locklift';

export default async (): Promise<void> => {
  await locklift.deployments.deployAccounts(
    [
      {
        deploymentName: 'User',
        signerId: '1',
        accountSettings: {
          type: WalletTypes.EverWallet,
          value: toNano(5),
        },
      },
    ],
    true,
  );
};

export const tag = 'user';
