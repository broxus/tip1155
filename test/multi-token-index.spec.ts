import { toNano, zeroAddress } from 'locklift';
import BigNumber from 'bignumber.js';
import { expect } from 'chai';

import { Actors, Collections } from './helpers';

describe('Test indexes', () => {
  it('Index contracts of initial wallet', async () => {
    const { account: owner, signer } = await Actors.deploy();
    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );

    await Collections.mintToken(collection, owner, 100);
  });

  it('Index contracts of secondary wallet', async () => {
    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet } = await Collections.mintToken(collection, owner, 100);

    await locklift.tracing.trace(
      wallet.methods
        .transfer({
          amount: 50,
          recipient: receiver.address,
          deployWalletValue: toNano(0.1),
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );
  });

  it.skip('Search by code hash', async () => {
    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet, id } = await Collections.mintToken(collection, owner, 100);
    const { wallet: otherWallet, id: otherId } = await Collections.mintToken(
      collection,
      owner,
      100,
    );

    await locklift.tracing.trace(
      wallet.methods
        .transfer({
          amount: 50,
          recipient: receiver.address,
          deployWalletValue: toNano(1),
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );
    const receiverWalletAddress = await Collections.multiTokenWalletAddress(
      collection,
      id,
      receiver.address,
    );

    const codeHash = await collection.methods
      .multiTokenCodeHash({ answerId: 0, _id: id, _isEmpty: false })
      .call()
      .then((r) => r.value0);
    const { accounts } = await locklift.provider.getAccountsByCodeHash({
      codeHash: new BigNumber(codeHash).toString(16),
    });

    const codeHashEmpty = await collection.methods
      .multiTokenCodeHash({ answerId: 0, _id: id, _isEmpty: true })
      .call()
      .then((r) => r.value0);
    const { accounts: accountsEmpty } =
      await locklift.provider.getAccountsByCodeHash({
        codeHash: new BigNumber(codeHashEmpty).toString(16),
      });

    const codeHashOther = await collection.methods
      .multiTokenCodeHash({ answerId: 0, _id: otherId, _isEmpty: false })
      .call()
      .then((r) => r.value0);
    const { accounts: accountsOther } =
      await locklift.provider.getAccountsByCodeHash({
        codeHash: new BigNumber(codeHashOther).toString(16),
      });

    expect(accounts.length + accountsEmpty.length).to.be.eq(2);
    expect(
      accounts.length + accountsEmpty.length + accountsOther.length,
    ).to.be.eq(3);

    const foundAddresses = [accounts, accountsEmpty, accountsOther]
      .flat(1)
      .map((item) => item.toString());
    expect(foundAddresses.indexOf(wallet.address.toString()) >= 0).to.be.true;
    expect(foundAddresses.indexOf(receiverWalletAddress.toString()) >= 0).to.be
      .true;
    return expect(foundAddresses.indexOf(otherWallet.address.toString()) >= 0)
      .to.be.true;
  });

  it('on burn to zero, destroy index ', async () => {
    const { account: owner, signer } = await Actors.deploy();
    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );

    const TOTAL = 100;

    const { wallet } = await Collections.mintToken(collection, owner, 100);

    await locklift.tracing.trace(
      wallet.methods
        .burn({
          amount: TOTAL,
          remainingGasTo: owner.address,
          callbackTo: zeroAddress,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );
  });

  it('on transfer to zero, destroy index', async () => {
    const TOTAL = 100;

    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet } = await Collections.mintToken(collection, owner, TOTAL);

    await locklift.tracing.trace(
      wallet.methods
        .transfer({
          amount: TOTAL,
          recipient: receiver.address,
          deployWalletValue: toNano(1),
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );
  });

  it('on bounced transfer to collection, restore index', async () => {
    const TOTAL = 100;

    const { account: owner, signer } = await Actors.deploy();

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet } = await Collections.mintToken(collection, owner, TOTAL);

    await locklift.tracing.trace(
      wallet.methods
        .transferToWallet({
          amount: TOTAL,
          recipientTokenWallet: collection.address,
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
      { allowedCodes: { compute: [60] } },
    );
  });
});
