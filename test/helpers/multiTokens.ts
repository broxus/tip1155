import { Address, Contract } from 'locklift';
import { FactorySource } from 'build/factorySource';
import { expect } from 'chai';

export declare type MultiTokenWalletContract = Contract<
  FactorySource['MultiTokenWallet']
>;

export class MultiTokens {
  static attachDeployed(address: Address): MultiTokenWalletContract {
    return locklift.factory.getDeployedContract('MultiTokenWallet', address);
  }

  static async getInfo(contract: MultiTokenWalletContract): Promise<{
    collection?: Address;
    id?: string;
    owner?: Address;
  }> {
    return contract.methods.getInfo({ answerId: 0 }).call();
  }

  static async getBalance(contract: MultiTokenWalletContract): Promise<number> {
    return Number(
      (await contract.methods.balance({ answerId: 0 }).call()).value0,
    );
  }

  static async getIndex(contract: MultiTokenWalletContract): Promise<Address> {
    const { collection, owner } = await MultiTokens.getInfo(contract);
    const { index } = await contract.methods
      .resolveIndex({ answerId: 0, collection, owner })
      .call();
    return index;
  }

  static async checkInfo(
    contract: MultiTokenWalletContract,
    expected: {
      collection?: Address;
      id?: string;
      owner?: Address;
    },
  ) {
    const actual = await MultiTokens.getInfo(contract);
    if (expected.collection !== undefined) {
      expect(actual.collection.toString()).to.be.eq(
        expected.collection.toString(),
        'Wrong token collection',
      );
    }
    if (expected.id !== undefined) {
      expect(actual.id).to.be.eq(expected.id, 'Wrong token id');
    }
    if (expected.owner !== undefined) {
      expect(actual.owner.toString()).to.be.eq(
        expected.owner.toString(),
        'Wrong token owner',
      );
    }
  }

  static async checkBalance(
    contract: MultiTokenWalletContract,
    expected: number,
  ) {
    const actual = await MultiTokens.getBalance(contract);
    expect(actual).to.be.eq(expected, 'Wrong token balance');
  }
}
