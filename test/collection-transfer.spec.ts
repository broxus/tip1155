import { Address, Contract, toNano } from 'locklift';
import { expect } from 'chai';

import { MultiTokenCollectionAbi } from '../build/factorySource';
import { Contracts } from './helpers';

describe('Test collection transferring', () => {
  let owner: Address;
  let user: Address;
  let collection: Contract<MultiTokenCollectionAbi>;

  before('deploy contracts', async () => {
    await locklift.deployments.fixture();

    owner = locklift.deployments.getAccount('Owner').account.address;
    user = locklift.deployments.getAccount('User').account.address;
    collection =
      locklift.deployments.getContract<MultiTokenCollectionAbi>('Collection');
  });

  it('transferOwnership', async () => {
    const { traceTree } = await locklift.tracing.trace(
      collection.methods
        .transferOwnership({
          newOwner: user,
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const event = Contracts.getFirstEvent(
      traceTree!,
      collection,
      'OwnershipTransferred' as const,
    );

    const newOwner = await collection.methods
      .owner()
      .call()
      .then((r) => r.value0);

    expect(event.oldOwner.toString()).to.be.equal(owner.toString());
    expect(event.newOwner.toString()).to.be.equal(user.toString());
    return expect(newOwner.toString()).to.be.equal(user.toString());
  });
});
