import {
  Address,
  Contract,
  getRandomNonce,
  toNano,
  zeroAddress,
} from 'locklift';
import { Account } from 'everscale-standalone-client/nodejs';
import { Contracts } from './contracts';
import { MultiTokenWalletContract, MultiTokens } from './multiTokens';
import { NftContract, Nfts } from './nfts';
import { FactorySource } from 'build/factorySource';
import { expect } from 'chai';

export declare type MultiTokenCollectionContract = Contract<
  FactorySource['MultiTokenCollection']
>;

const COLLECTION_METADATA = JSON.stringify({
  title: 'Test Collection',
});
const TOKEN_METADATA = JSON.stringify({
  type: 'Basic NFT',
  name: 'Charging Bull',
  description: 'Charging Bull from New York',
  preview: {
    source:
      'https://upload.wikimedia.org/wikipedia/en/c/c9/Charging_Bull_statue.jpg',
    mimetype: 'image/jpeg',
  },
  files: [
    {
      source:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Bowling_Green_NYC_Feb_2020_13.jpg/1920px-Bowling_Green_NYC_Feb_2020_13.jpg',
      mimetype: 'image/jpeg',
    },
  ],
  external_url: 'https://en.wikipedia.org/wiki/Charging_Bull',
});

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
        codeNft: Nft.code,
        codeWallet: MultiTokenWallet.code,
        codeIndex: Index.code,
        codeIndexBasis: IndexBasis.code,
        ownerAddress,
        json: COLLECTION_METADATA,
        remainingGasTo: ownerAddress,
      },
      initParams: {
        _deployer: zeroAddress,
        nonce_: getRandomNonce(),
        _platformCode: MultiTokenWalletPlatform.code,
      },
      publicKey: publicKey,
      value: toNano(4),
    });

    await Collections.checkJson(collection, COLLECTION_METADATA);
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
    return (await contract.methods.getJson({ answerId: 0 }).call()).json;
  }

  static async getTotalSupply(
    contract: MultiTokenCollectionContract,
  ): Promise<number> {
    return Number(
      (await contract.methods.totalSupply({ answerId: 0 }).call()).count,
    );
  }

  static async getTotalMultiTokenSupply(
    contract: MultiTokenCollectionContract,
    id: string,
  ): Promise<number> {
    const nftAddr = await Collections.nftAddress(contract, id);
    const nft = Nfts.attachDeployed(nftAddr);

    return Number(
      (await nft.methods.multiTokenSupply({ answerId: 0 }).call()).count,
    );
  }

  static async getOwner(
    contract: MultiTokenCollectionContract,
  ): Promise<Address> {
    return (await contract.methods.owner().call()).value0;
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
    return (
      await contract.methods
        .nftAddress({
          answerId: 0,
          id,
        })
        .call()
    ).nft;
  }

  static async multiTokenWalletAddress(
    contract: MultiTokenCollectionContract,
    id: string,
    owner: Address,
  ): Promise<Address> {
    return (
      await contract.methods
        .multiTokenWalletAddress({
          answerId: 0,
          id,
          owner,
        })
        .call()
    ).value0;
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
          _json: TOKEN_METADATA,
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    const { id } = Contracts.getFirstEvent(traceTree, collection, 'NftCreated');
    const nftAddress = await Collections.nftAddress(collection, id);

    const nft = Nfts.attachDeployed(nftAddress);

    await Nfts.checkInfo(nft, {
      collection: collection.address,
      id,
      owner: owner.address,
      manager: owner.address,
    });
    await Nfts.checkJson(nft, TOKEN_METADATA);

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
        .mintToken({
          answerId: 0,
          tokenOwner: owner.address,
          json: TOKEN_METADATA,
          count,
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    const { id } = Contracts.getFirstEvent(
      traceTree,
      collection,
      'MultiTokenCreated',
    );
    const walletAddress = await Collections.multiTokenWalletAddress(
      collection,
      id,
      owner.address,
    );

    const wallet = MultiTokens.attachDeployed(walletAddress);
    await MultiTokens.checkInfo(wallet, {
      collection: collection.address,
      id,
      owner: owner.address,
    });
    await MultiTokens.checkBalance(wallet, count);

    const nftAddress = await Collections.nftAddress(collection, id);
    const nft = Nfts.attachDeployed(nftAddress);

    await Nfts.checkInfo(nft, {
      collection: collection.address,
      id,
      owner: collection.address,
      manager: collection.address,
    });
    await Nfts.checkJson(nft, TOKEN_METADATA);

    return { wallet, nft, id };
  }
}
