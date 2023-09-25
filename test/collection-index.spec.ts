import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import { Contract } from 'locklift';

import { MultiTokenCollectionAbi } from '../build/factorySource';

describe('Test indexes', () => {
  let collection: Contract<MultiTokenCollectionAbi>;

  before('deploy contracts', async () => {
    await locklift.deployments.fixture();

    collection =
      locklift.deployments.getContract<MultiTokenCollectionAbi>('Collection');
  });

  it('IndexBasis contract', async () => {
    const index = await collection.methods
      .resolveIndexBasis({ answerId: 0 })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('IndexBasis', r.indexBasis),
      );

    const indexCodeHash = await index
      .getFullState()
      .then((r) => r.state.codeHash);

    const expectedCodeHash = await collection.methods
      .indexBasisCodeHash({ answerId: 0 })
      .call()
      .then((r) => new BigNumber(r.hash).toString(16));

    const indexCollectionAddress = await index.methods
      .getInfo({ answerId: 0 })
      .call()
      .then((r) => r.collection);

    expect(indexCodeHash).to.be.equal(expectedCodeHash);
    return expect(collection.address.toString()).to.be.equal(
      indexCollectionAddress.toString(),
    );
  });
});
