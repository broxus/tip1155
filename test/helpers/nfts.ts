import { Address, Contract } from 'locklift';
import { FactorySource } from 'build/factorySource';
import { expect } from 'chai';

export declare type NftContract = Contract<FactorySource['MultiTokenNft']>;

export class Nfts {
  static attachDeployed(address: Address): NftContract {
    return locklift.factory.getDeployedContract('MultiTokenNft', address);
  }

  static async getInfo(contract: NftContract): Promise<{
    collection: Address;
    id: string;
    owner: Address;
    manager: Address;
  }> {
    return await contract.methods.getInfo({ answerId: 0 }).call();
  }

  static async getJson(contract: NftContract): Promise<string> {
    return (await contract.methods.getJson({ answerId: 0 }).call()).json;
  }

  static async checkInfo(
    contract: NftContract,
    expected: {
      collection?: Address;
      id?: string;
      owner?: Address;
      manager?: Address;
    },
  ) {
    const actual = await Nfts.getInfo(contract);
    if (expected.collection !== undefined) {
      expect(actual.collection.toString()).to.be.eq(
        expected.collection.toString(),
        'Wrong NFT collection',
      );
    }
    if (expected.id !== undefined) {
      expect(actual.id).to.be.eq(expected.id, 'Wrong NFT id');
    }
    if (expected.owner !== undefined) {
      expect(actual.owner.toString()).to.be.eq(
        expected.owner.toString(),
        'Wrong NFT owner',
      );
    }
    if (expected.manager !== undefined) {
      expect(actual.manager.toString()).to.be.eq(
        expected.manager.toString(),
        'Wrong NFT manager',
      );
    }
  }

  static async checkJson(contract: NftContract, expected: string) {
    const actual = await Nfts.getJson(contract);
    expect(actual).to.be.eq(expected, 'Wrong NFT JSON');
  }

  static async getMultiTokenSupply(contract: NftContract): Promise<string> {
    return contract.methods
      .multiTokenSupply({ answerId: 0 })
      .call()
      .then((k) => k.count);
  }

  static async checkMultiTokenSupply(contract: NftContract, expected: number) {
    const supply = await Nfts.getMultiTokenSupply(contract);
    expect(supply).to.be.eq(expected);
  }
}
