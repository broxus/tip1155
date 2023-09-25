import { Address, Contract, toNano, zeroAddress } from 'locklift';
import { expect } from 'chai';

import {
  MultiTokenCollectionAbi,
  MultiTokenWalletAbi,
} from '../build/factorySource';
import nft from '../nft.json';

const TOTAL = '100';

describe('Test multi token destroying', () => {
  let owner: Address;
  let collection: Contract<MultiTokenCollectionAbi>;
  let wallet: Contract<MultiTokenWalletAbi>;

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

  it('Destroy with non zero balance', async () => {
    await locklift.tracing.trace(
      wallet.methods
        .destroy({ remainingGasTo: owner })
        .send({ from: owner, amount: toNano(2) }),
      { allowedCodes: { compute: [2309] } },
    );

    const balance = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    const isDeployed = await wallet
      .getFullState()
      .then((r) => r.state.isDeployed);

    expect(isDeployed).to.be.true;
    return expect(balance).to.be.equal(TOTAL);
  });

  it('Destroy with zero balance', async () => {
    await locklift.tracing.trace(
      wallet.methods
        .burn({
          count: TOTAL,
          remainingGasTo: owner,
          callbackTo: zeroAddress,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    await locklift.transactions.waitFinalized(
      wallet.methods
        .destroy({ remainingGasTo: owner })
        .send({ from: owner, amount: toNano(2) }),
    );

    const isDeployed = await wallet
      .getFullState()
      .then((r) => r.state.isDeployed);

    return expect(isDeployed).to.be.false;
  });
});
