import { toNano } from 'locklift';

import { Actors, Collections, Contracts, MultiTokens } from './helpers';

describe('Test multi token transferring', () => {
  it('transfer twice', async () => {
    const TOTAL = 100;
    const TRANSFER_FIRST = 70;
    const TRANSFER_SECOND = 29;

    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet, id } = await Collections.mintToken(
      collection,
      owner,
      TOTAL,
    );

    await locklift.transactions.waitFinalized(
      wallet.methods
        .transfer({
          amount: TRANSFER_FIRST,
          recipient: receiver.address,
          deployWalletValue: toNano(0.1),
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(0.5),
        }),
    );

    const receiverWalletAddress = await Collections.multiTokenWalletAddress(
      collection,
      id,
      receiver.address,
    );
    const receiverWallet = MultiTokens.attachDeployed(receiverWalletAddress);

    await MultiTokens.checkBalance(wallet, TOTAL - TRANSFER_FIRST);
    await MultiTokens.checkBalance(receiverWallet, TRANSFER_FIRST);
    await MultiTokens.checkInfo(receiverWallet, {
      collection: collection.address,
      id,
    });

    await locklift.transactions.waitFinalized(
      wallet.methods
        .transfer({
          amount: TRANSFER_SECOND,
          recipient: receiver.address,
          deployWalletValue: 0,
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    await MultiTokens.checkBalance(
      wallet,
      TOTAL - TRANSFER_FIRST - TRANSFER_SECOND,
    );
    await MultiTokens.checkBalance(
      receiverWallet,
      TRANSFER_FIRST + TRANSFER_SECOND,
    );
  });

  it('transfer + transferToWallet', async () => {
    const TOTAL = 100;
    const TRANSFER_FIRST = 70;
    const TRANSFER_SECOND = 29;

    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet, id } = await Collections.mintToken(
      collection,
      owner,
      TOTAL,
    );

    await locklift.transactions.waitFinalized(
      wallet.methods
        .transfer({
          amount: TRANSFER_FIRST,
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

    const receiverWalletAddress = await Collections.multiTokenWalletAddress(
      collection,
      id,
      receiver.address,
    );
    const receiverWallet = MultiTokens.attachDeployed(receiverWalletAddress);

    await MultiTokens.checkBalance(wallet, TOTAL - TRANSFER_FIRST);
    await MultiTokens.checkBalance(receiverWallet, TRANSFER_FIRST);

    await locklift.transactions.waitFinalized(
      wallet.methods
        .transferToWallet({
          amount: TRANSFER_SECOND,
          recipientTokenWallet: receiverWallet.address,
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    await MultiTokens.checkBalance(
      wallet,
      TOTAL - TRANSFER_FIRST - TRANSFER_SECOND,
    );
    await MultiTokens.checkBalance(
      receiverWallet,
      TRANSFER_FIRST + TRANSFER_SECOND,
    );
  });

  it('transferToWallet to not a wallet', async () => {
    const TOTAL = 100;
    const TRANSFER = 70;

    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet } = await Collections.mintToken(collection, owner, TOTAL);

    await locklift.transactions.waitFinalized(
      wallet.methods
        .transferToWallet({
          amount: TRANSFER,
          recipientTokenWallet: receiver.address,
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    await MultiTokens.checkBalance(wallet, TOTAL);
  });

  it('transferToWallet to absent wallet', async () => {
    const TOTAL = 100;
    const TRANSFER = 70;

    const { account: owner, signer } = await Actors.deploy();
    const { account: receiver } = await Actors.deploy('1');

    const collection = await Collections.deploy(
      owner.address,
      signer.publicKey,
    );
    const { wallet, id } = await Collections.mintToken(
      collection,
      owner,
      TOTAL,
    );

    const receiverWalletAddress = await Collections.multiTokenWalletAddress(
      collection,
      id,
      receiver.address,
    );

    await locklift.transactions.waitFinalized(
      wallet.methods
        .transferToWallet({
          amount: TRANSFER,
          recipientTokenWallet: receiverWalletAddress,
          remainingGasTo: owner.address,
          notify: false,
          payload: '',
        })
        .send({
          from: owner.address,
          amount: toNano(2),
        }),
    );

    await MultiTokens.checkBalance(wallet, TOTAL);
    await Contracts.checkExists(receiverWalletAddress, false);
  });
});
