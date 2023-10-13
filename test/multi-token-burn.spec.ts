import { Address, Contract, toNano, zeroAddress } from 'locklift';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';

import {
  MultiTokenCollectionAbi,
  MultiTokenWalletAbi,
} from '../build/factorySource';
import { Project } from '../assets/project';
import { Contracts } from './helpers';

const TOTAL = '100';

describe('Test multi token burning', () => {
  let owner: Address;
  let collection: Contract<MultiTokenCollectionAbi>;
  let wallet: Contract<MultiTokenWalletAbi>;

  const burn = async (count: number | string): Promise<void> => {
    const walletBalanceBefore = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => new BigNumber(r.value0));

    await locklift.transactions.waitFinalized(
      wallet.methods
        .burn({
          amount: count,
          remainingGasTo: owner,
          callbackTo: zeroAddress,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const walletBalanceAfter = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    expect(
      walletBalanceBefore.minus(walletBalanceAfter).toString(),
    ).to.be.equal(count.toString());
  };

  before('deploy contracts', async () => {
    await locklift.deployments.fixture();

    owner = locklift.deployments.getAccount('Owner').account.address;
    collection =
      locklift.deployments.getContract<MultiTokenCollectionAbi>('Collection');

    const { traceTree } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner,
          _json: JSON.stringify(Project),
        })
        .send({ from: owner, amount: toNano(2) }),
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
          _amount: TOTAL,
          _notify: false,
          _payload: '',
          _deployWalletValue: toNano(0.1),
          _remainingGasTo: owner,
          _recipient: owner,
        })
        .send({ from: owner, amount: toNano(3) }),
    );

    wallet = await collection.methods
      .multiTokenWalletAddress({ answerId: 0, _id: event.id, _owner: owner })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('MultiTokenWallet', r.value0),
      );
  });

  it('Burn more than balance', async () => {
    await locklift.tracing.trace(
      wallet.methods
        .burn({
          amount: +TOTAL + 1,
          remainingGasTo: owner,
          callbackTo: zeroAddress,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
      { allowedCodes: { compute: [1060] } },
    );

    const balance = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    return expect(balance).to.be.equal(TOTAL);
  });

  it('Burn twice', async () => {
    const BURN_FIRST = '10';
    const BURN_SECOND = +TOTAL - +BURN_FIRST;

    await burn(BURN_FIRST);

    const firstBalance = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    await burn(BURN_SECOND);

    const secondBalance = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    const totalSupply = await wallet.methods
      .getInfo({ answerId: 0 })
      .call()
      .then((r) =>
        collection.methods.nftAddress({ answerId: 0, id: r.id }).call(),
      )
      .then((r) => locklift.factory.getDeployedContract('MultiTokenNft', r.nft))
      .then((nft) => nft.methods.totalSupply({ answerId: 0 }).call())
      .then((r) => r.value0);

    expect(totalSupply).to.be.equal('0');
    expect(+firstBalance).to.be.equal(+TOTAL - +BURN_FIRST);
    return expect(+secondBalance).to.be.equal(
      +TOTAL - +BURN_FIRST - +BURN_SECOND,
    );
  });
});
