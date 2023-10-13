import { Address, Contract } from 'locklift';
import { expect } from 'chai';

import { FactorySource } from '../../build/factorySource';

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
    return contract.methods
      .getJson({ answerId: 0 })
      .call()
      .then((r) => r.json);
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

    if (expected.collection) {
      expect(actual.collection.toString()).to.be.eq(
        expected.collection.toString(),
        'Wrong NFT collection',
      );
    }

    if (expected.id) {
      expect(actual.id).to.be.eq(expected.id, 'Wrong NFT id');
    }

    if (expected.owner) {
      expect(actual.owner.toString()).to.be.eq(
        expected.owner.toString(),
        'Wrong NFT owner',
      );
    }

    if (expected.manager) {
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
      .totalSupply({ answerId: 0 })
      .call()
      .then((k) => k.value0);
  }

  static async checkMultiTokenSupply(contract: NftContract, expected: number) {
    const supply = await Nfts.getMultiTokenSupply(contract);
    expect(supply).to.be.eq(expected);
  }
}
