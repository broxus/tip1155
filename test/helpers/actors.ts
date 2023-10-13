import { WalletTypes, toNano } from 'locklift';
import { Account, Signer } from 'everscale-standalone-client/nodejs';
import { expect } from 'chai';

import { Contracts } from './contracts';

export class Actors {
  static async deploy(
    idx = '0',
    initial_balance = 10,
  ): Promise<{
    account: Account;
    signer: Signer;
  }> {
    const signer = await locklift.keystore.getSigner(idx);

    if (!signer) {
      throw 'Error: Signer is undefined';
    }

    const account = await locklift.factory.accounts
      .addNewAccount({
        type: WalletTypes.EverWallet,
        value: toNano(initial_balance),
        publicKey: signer.publicKey,
      })
      .then((r) => r.account);

    const balance = await Contracts.getContractBalance(account.address);

    expect(balance).to.be.above(0);

    return { account, signer };
  }
}
