import { getRandomNonce, toNano } from 'locklift';

import { Collection } from '../assets/collection';

export default async (): Promise<void> => {
  const owner = locklift.deployments.getAccount('Owner');

  const PlatformCode = locklift.factory.getContractArtifacts(
    'MultiTokenWalletPlatform',
  ).code;
  const NftCode = locklift.factory.getContractArtifacts('MultiTokenNft').code;
  const WalletCode =
    locklift.factory.getContractArtifacts('MultiTokenWallet').code;
  const IndexCode = locklift.factory.getContractArtifacts('Index').code;
  const IndexBasisCode =
    locklift.factory.getContractArtifacts('IndexBasis').code;

  await locklift.deployments.deploy({
    deploymentName: 'Collection',
    deployConfig: {
      contract: 'MultiTokenCollection',
      constructorParams: {
        _initialPlatformCode: PlatformCode,
        _initialNftCode: NftCode,
        _initialWalletCode: WalletCode,
        _initialIndexCode: IndexCode,
        _initialIndexBasisCode: IndexBasisCode,
        _initialOwner: owner.account.address,
        _initialJson: JSON.stringify(Collection),
        _remainingGasTo: owner.account.address,
      },
      initParams: { nonce_: getRandomNonce() },
      publicKey: owner.signer.publicKey,
      value: toNano(10),
    },
    enableLogs: true,
  });
};

export const tag = 'collection';

export const dependencies = ['owner'];
