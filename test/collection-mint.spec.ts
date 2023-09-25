import { expect } from 'chai';
import { Address, Contract, toNano } from 'locklift';

import nft from '../nft.json';
import { MultiTokenCollectionAbi } from '../build/factorySource';

describe('Test minting', () => {
  let owner: Address;
  let collection: Contract<MultiTokenCollectionAbi>;

  before('deploy contracts', async () => {
    await locklift.deployments.fixture();

    owner = locklift.deployments.getAccount('Owner').account.address;
    collection =
      locklift.deployments.getContract<MultiTokenCollectionAbi>('Collection');
  });

  it('Deploy collection and mint NFT', async () => {
    const { traceTree: tt1 } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner,
          _json: JSON.stringify(nft),
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const firstId = tt1.findEventsForContract({
      contract: collection,
      name: 'NftCreated' as const,
    })[0].id;

    const { traceTree: tt2 } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner,
          _json: JSON.stringify(nft),
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const secondId = tt2.findEventsForContract({
      contract: collection,
      name: 'NftCreated' as const,
    })[0].id;

    const totalSupply = await collection.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => r.count);

    expect(totalSupply).to.be.equal('2');
    return expect(firstId).to.be.not.equal(secondId);
  });

  it('Deploy collection and mint token', async () => {
    const { traceTree: tt1 } = await locklift.tracing.trace(
      collection.methods
        .mintToken({
          answerId: 0,
          tokenOwner: owner,
          json: JSON.stringify(nft),
          count: '100',
          remainingGasTo: owner,
          notify: false,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const firstId = tt1.findEventsForContract({
      contract: collection,
      name: 'MultiTokenCreated' as const,
    })[0].id;

    const firstNft = await collection.methods
      .nftAddress({ answerId: 0, id: firstId })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('MultiTokenNft', r.nft),
      );

    const firstSupply = await firstNft.methods
      .multiTokenSupply({ answerId: 0 })
      .call()
      .then((r) => r.count);

    const { traceTree: tt2 } = await locklift.tracing.trace(
      collection.methods
        .mintToken({
          answerId: 0,
          tokenOwner: owner,
          json: JSON.stringify(nft),
          count: '200',
          remainingGasTo: owner,
          notify: false,
          payload: '',
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const secondId = tt2.findEventsForContract({
      contract: collection,
      name: 'MultiTokenCreated' as const,
    })[0].id;

    const secondNft = await collection.methods
      .nftAddress({ answerId: 0, id: secondId })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('MultiTokenNft', r.nft),
      );

    const secondSupply = await secondNft.methods
      .multiTokenSupply({ answerId: 0 })
      .call()
      .then((r) => r.count);

    const totalSupply = await collection.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => r.count);

    expect(totalSupply).to.be.equal('4');
    expect(firstSupply).to.be.equal('100');
    expect(secondSupply).to.be.equal('200');
    expect(firstId).to.be.not.eq(secondId);
  });
});
