import { Address, Contract } from 'locklift';
import { expect } from 'chai';

import { FactorySource } from '../../build/factorySource';

export declare type MultiTokenWalletContract = Contract<
  FactorySource['MultiTokenWallet']
>;

export class MultiTokens {
  static attachDeployed(address: Address): MultiTokenWalletContract {
    return locklift.factory.getDeployedContract('MultiTokenWallet', address);
  }

  static async getInfo(contract: MultiTokenWalletContract): Promise<{
    collection: Address;
    id: string;
  }> {
    return contract.methods.getInfo({ answerId: 0 }).call();
  }

  static async getBalance(contract: MultiTokenWalletContract): Promise<number> {
    return contract.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => +r.value0);
  }

  static async checkInfo(
    contract: MultiTokenWalletContract,
    expected: {
      collection?: Address;
      id?: string;
    },
  ) {
    const actual = await MultiTokens.getInfo(contract);

    if (expected.collection) {
      expect(actual.collection.toString()).to.be.eq(
        expected.collection.toString(),
        'Wrong token collection',
      );
    }

    if (expected.id) {
      expect(actual.id).to.be.eq(expected.id, 'Wrong token id');
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
