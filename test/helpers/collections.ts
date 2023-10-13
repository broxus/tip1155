import { Address, Contract, getRandomNonce, toNano } from 'locklift';
import { Account } from 'everscale-standalone-client/nodejs';
import { expect } from 'chai';

import { FactorySource } from '../../build/factorySource';
import { Contracts } from './contracts';
import { MultiTokenWalletContract, MultiTokens } from './multiTokens';
import { NftContract, Nfts } from './nfts';

import { Collection } from '../../assets/collection';
import { Project } from '../../assets/project';

export declare type MultiTokenCollectionContract = Contract<
  FactorySource['MultiTokenCollection']
>;

export class Collections {
  static async deploy(
    ownerAddress: Address,
    publicKey: string,
  ): Promise<MultiTokenCollectionContract> {
    const Nft = locklift.factory.getContractArtifacts('MultiTokenNft');
    const MultiTokenWallet =
      locklift.factory.getContractArtifacts('MultiTokenWallet');
    const Index = locklift.factory.getContractArtifacts('Index');
    const IndexBasis = locklift.factory.getContractArtifacts('IndexBasis');
    const MultiTokenWalletPlatform = locklift.factory.getContractArtifacts(
      'MultiTokenWalletPlatform',
    );

    const { contract: collection } = await locklift.factory.deployContract({
      contract: 'MultiTokenCollection',
      constructorParams: {
        _initialPlatformCode: MultiTokenWalletPlatform.code,
        _initialNftCode: Nft.code,
        _initialWalletCode: MultiTokenWallet.code,
        _initialIndexCode: Index.code,
        _initialIndexBasisCode: IndexBasis.code,
        _initialOwner: ownerAddress,
        _initialJson: JSON.stringify(Collection),
        _remainingGasTo: ownerAddress,
      },
      initParams: { nonce_: getRandomNonce() },
      publicKey: publicKey,
      value: toNano(4),
    });

    await Collections.checkJson(collection, JSON.stringify(Collection));
    await Collections.checkTotalSupply(collection, 0);
    await Collections.checkOwner(collection, ownerAddress);
    await Contracts.checkContractBalance(collection.address, 1_000_000_000);

    return collection;
  }

  static attachDeployed(address: Address): MultiTokenCollectionContract {
    return locklift.factory.getDeployedContract(
      'MultiTokenCollection',
      address,
    );
  }

  static async getJson(
    contract: MultiTokenCollectionContract,
  ): Promise<string> {
    return contract.methods
      .getJson({ answerId: 0 })
      .call()
      .then((r) => r.json);
  }

  static async getTotalSupply(
    contract: MultiTokenCollectionContract,
  ): Promise<number> {
    return contract.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => +r.count);
  }

  static async getTotalMultiTokenSupply(
    contract: MultiTokenCollectionContract,
    id: string,
  ): Promise<number> {
    const nftAddr = await Collections.nftAddress(contract, id);
    const nft = Nfts.attachDeployed(nftAddr);

    return nft.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => +r.value0);
  }

  static async getOwner(
    contract: MultiTokenCollectionContract,
  ): Promise<Address> {
    return contract.methods
      .owner()
      .call()
      .then((r) => r.value0);
  }

  static async checkJson(
    contract: MultiTokenCollectionContract,
    expected: string,
  ) {
    const actual = await Collections.getJson(contract);
    expect(actual).to.be.eq(expected, 'Wrong collection JSON');
  }

  static async checkTotalSupply(
    contract: MultiTokenCollectionContract,
    expected: number,
  ) {
    const actual = await Collections.getTotalSupply(contract);
    expect(actual).to.be.eq(expected, 'Wrong collection total supply');
  }

  static async checkTotalMultiTokenSupply(
    contract: MultiTokenCollectionContract,
    id: string,
    expected: number,
  ) {
    const actual = await Collections.getTotalMultiTokenSupply(contract, id);
    expect(actual).to.be.eq(
      expected,
      'Wrong collection multi token total supply',
    );
  }

  static async checkOwner(
    contract: MultiTokenCollectionContract,
    expected: Address,
  ) {
    const actual = await Collections.getOwner(contract);
    expect(actual.toString()).to.be.eq(
      expected.toString(),
      'Wrong collection owner',
    );
  }

  static async nftAddress(
    contract: MultiTokenCollectionContract,
    id: string,
  ): Promise<Address> {
    return contract.methods
      .nftAddress({
        answerId: 0,
        id,
      })
      .call()
      .then((r) => r.nft);
  }

  static async multiTokenWalletAddress(
    contract: MultiTokenCollectionContract,
    id: string,
    owner: Address,
  ): Promise<Address> {
    return contract.methods
      .multiTokenWalletAddress({
        answerId: 0,
        _id: id,
        _owner: owner,
      })
      .call()
      .then((r) => r.value0);
  }

  static async mintNFT(
    collection: MultiTokenCollectionContract,
    owner: Account,
  ): Promise<{
    nft: NftContract;
    id: string;
  }> {
    const { traceTree } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner.address,
          _json: JSON.stringify(Project),
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    const { id } = Contracts.getFirstEvent(
      traceTree!,
      collection,
      'NftCreated' as const,
    );

    const nftAddress = await Collections.nftAddress(collection, id);
    const nft = Nfts.attachDeployed(nftAddress);

    await Nfts.checkInfo(nft, {
      collection: collection.address,
      id,
      owner: owner.address,
      manager: collection.address,
    });
    await Nfts.checkJson(nft, JSON.stringify(Project));

    return { nft, id };
  }

  static async mintToken(
    collection: MultiTokenCollectionContract,
    owner: Account,
    count = 5,
  ): Promise<{
    wallet: MultiTokenWalletContract;
    nft: NftContract;
    id: string;
  }> {
    const { traceTree } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner.address,
          _json: JSON.stringify(Project),
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    const event = Contracts.getFirstEvent(
      traceTree!,
      collection,
      'NftCreated' as const,
    );

    await locklift.transactions.waitFinalized(
      collection.methods
        .mint({
          _nft: event.nft,
          _amount: count,
          _remainingGasTo: owner.address,
          _notify: false,
          _payload: '',
          _recipient: owner.address,
          _deployWalletValue: toNano(0.1),
        })
        .send({ from: owner.address, amount: toNano(3) }),
    );

    const walletAddress = await Collections.multiTokenWalletAddress(
      collection,
      event.id,
      owner.address,
    );

    const wallet = MultiTokens.attachDeployed(walletAddress);
    await MultiTokens.checkInfo(wallet, {
      collection: collection.address,
      id: event.id,
    });
    await MultiTokens.checkBalance(wallet, count);

    const nftAddress = await Collections.nftAddress(collection, event.id);
    const nft = Nfts.attachDeployed(nftAddress);

    await Nfts.checkInfo(nft, {
      collection: collection.address,
      id: event.id,
      owner: owner.address,
      manager: collection.address,
    });
    await Nfts.checkJson(nft, JSON.stringify(Project));

    return { wallet, nft, id: event.id };
  }
}
