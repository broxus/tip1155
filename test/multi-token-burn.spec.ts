import { Address, Contract, toNano, zeroAddress } from 'locklift';
import { expect } from 'chai';

import nft from '../nft.json';
import {
  MultiTokenCollectionAbi,
  MultiTokenWalletAbi,
} from '../build/factorySource';

const TOTAL = '100';

describe('Test multi token burning', () => {
  let owner: Address;
  let collection: Contract<MultiTokenCollectionAbi>;
  let wallet: Contract<MultiTokenWalletAbi>;

  const burn = async (count: number | string): Promise<void> => {
    const { traceTree } = await locklift.tracing.trace(
      wallet.methods
        .burn({
          count,
          remainingGasTo: owner,
          callbackTo: zeroAddress,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const event = traceTree.findEventsForContract({
      contract: collection,
      name: 'MultiTokenBurned' as const,
    })[0];

    expect(event.count).to.be.equal(count.toString());
    expect(event.owner.toString()).to.be.equal(owner.toString());
  };

  before('deploy contracts', async () => {
    await locklift.deployments.fixture();

    owner = locklift.deployments.getAccount('Owner').account.address;
    collection =
      locklift.deployments.getContract<MultiTokenCollectionAbi>('Collection');

    const { traceTree } = await locklift.tracing.trace(
      collection.methods
        .mintToken({
          answerId: 0,
          tokenOwner: owner,
          json: JSON.stringify(nft),
          count: TOTAL,
          remainingGasTo: owner,
          notify: false,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const id = traceTree.findEventsForContract({
      contract: collection,
      name: 'MultiTokenCreated' as const,
    })[0].id;

    wallet = await collection.methods
      .multiTokenWalletAddress({ answerId: 0, id: id, owner: owner })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('MultiTokenWallet', r.value0),
      );
  });

  it('Burn more than balance', async () => {
    await locklift.tracing.trace(
      wallet.methods
        .burn({
          count: +TOTAL + 1,
          remainingGasTo: owner,
          callbackTo: zeroAddress,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
      { allowedCodes: { compute: [2306] } },
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
      .then((nft) => nft.methods.multiTokenSupply({ answerId: 0 }).call())
      .then((r) => r.count);

    expect(totalSupply).to.be.equal('0');
    expect(+firstBalance).to.be.equal(+TOTAL - +BURN_FIRST);
    return expect(+secondBalance).to.be.equal(
      +TOTAL - +BURN_FIRST - +BURN_SECOND,
    );
  });
});
