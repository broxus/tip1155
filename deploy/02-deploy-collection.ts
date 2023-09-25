import { getRandomNonce, toNano, zeroAddress } from 'locklift';

import collection from '../collection.json';

export default async (): Promise<void> => {
  const signer = await locklift.keystore.getSigner('0');
  const owner = locklift.deployments.getAccount('Owner').account;

  const platformArtifacts = locklift.factory.getContractArtifacts(
    'MultiTokenWalletPlatform',
  );
  const nftArtifacts = locklift.factory.getContractArtifacts('MultiTokenNft');
  const walletArtifacts =
    locklift.factory.getContractArtifacts('MultiTokenWallet');
  const indexArtifacts = locklift.factory.getContractArtifacts('Index');
  const indexBasisArtifacts =
    locklift.factory.getContractArtifacts('IndexBasis');

  await locklift.deployments.deploy({
    deploymentName: 'Collection',
    deployConfig: {
      contract: 'MultiTokenCollection',
      constructorParams: {
        codeNft: nftArtifacts.code,
        codeWallet: walletArtifacts.code,
        codeIndex: indexArtifacts.code,
        codeIndexBasis: indexBasisArtifacts.code,
        ownerAddress: owner.address,
        json: JSON.stringify(collection.collectionJson),
        remainingGasTo: owner.address,
      },
      initParams: {
        _deployer: zeroAddress,
        nonce_: getRandomNonce(),
        _platformCode: platformArtifacts.code,
      },
      publicKey: signer.publicKey,
      value: toNano(10),
    },
    enableLogs: true,
  });
};

export const tag = 'collection';

export const dependencies = ['owner'];
