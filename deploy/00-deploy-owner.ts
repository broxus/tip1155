import { WalletTypes } from 'locklift';

export default async (): Promise<void> => {
  await locklift.deployments.deployAccounts(
    [
      {
        deploymentName: 'Owner',
        signerId: '0',
        accountSettings: {
          type: WalletTypes.EverWallet,
          value: locklift.utils.toNano(5),
        },
      },
    ],
    true,
  );
};

export const tag = 'owner';
