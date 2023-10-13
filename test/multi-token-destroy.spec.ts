import { Address, Contract, toNano, zeroAddress } from 'locklift';
import { expect } from 'chai';

import {
  MultiTokenCollectionAbi,
  MultiTokenWalletAbi,
} from '../build/factorySource';
import { Project } from '../assets/project';
import { Contracts } from './helpers';

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

  it('Destroy with non zero balance', async () => {
    await locklift.tracing.trace(
      wallet.methods
        .destroy({ remainingGasTo: owner })
        .send({ from: owner, amount: toNano(2) }),
      { allowedCodes: { compute: [1070] } },
    );

    const balance = await wallet.methods
      .balance({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    const isDeployed = await wallet
      .getFullState()
      .then((r) => r.state?.isDeployed);

    expect(isDeployed).to.be.true;
    return expect(balance).to.be.equal(TOTAL);
  });

  it('Destroy with zero balance', async () => {
    await locklift.transactions.waitFinalized(
      wallet.methods
        .burn({
          amount: TOTAL,
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
      .then((r) => !!r.state?.isDeployed);

    return expect(isDeployed).to.be.false;
  });
});
