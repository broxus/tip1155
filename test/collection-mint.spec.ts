import { expect } from 'chai';
import { Address, Contract, toNano } from 'locklift';

import { MultiTokenCollectionAbi } from '../build/factorySource';
import { Project } from '../assets/project';
import { Contracts } from './helpers';

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
          _json: JSON.stringify(Project),
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const { id: firstId } = Contracts.getFirstEvent(
      tt1!,
      collection,
      'NftCreated' as const,
    );

    const { traceTree: tt2 } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner,
          _json: JSON.stringify(Project),
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const { id: secondId } = Contracts.getFirstEvent(
      tt2!,
      collection,
      'NftCreated' as const,
    );

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
        .mintNft({
          _owner: owner,
          _json: JSON.stringify(Project),
        })
        .send({ from: owner, amount: toNano(2) }),
    );

    const { id: firstId } = Contracts.getFirstEvent(
      tt1!,
      collection,
      'NftCreated' as const,
    );

    const firstNft = await collection.methods
      .nftAddress({ answerId: 0, id: firstId })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('MultiTokenNft', r.nft),
      );

    await locklift.tracing.trace(
      collection.methods
        .mint({
          _nft: firstNft.address,
          _amount: '100',
          _notify: false,
          _payload: '',
          _deployWalletValue: toNano(0.1),
          _remainingGasTo: owner,
          _recipient: owner,
        })
        .send({ from: owner, amount: toNano(3) }),
    );

    const firstSupply = await firstNft.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    const { traceTree: tt2 } = await locklift.tracing.trace(
      collection.methods
        .mintNft({
          _owner: owner,
          _json: JSON.stringify(Project),
        })
        .send({ from: owner, amount: toNano(5) }),
    );

    const { id: secondId } = Contracts.getFirstEvent(
      tt2!,
      collection,
      'NftCreated' as const,
    );

    const secondNft = await collection.methods
      .nftAddress({ answerId: 0, id: secondId })
      .call()
      .then((r) =>
        locklift.factory.getDeployedContract('MultiTokenNft', r.nft),
      );

    await locklift.transactions.waitFinalized(
      collection.methods
        .mint({
          _nft: secondNft.address,
          _amount: '200',
          _notify: false,
          _payload: '',
          _deployWalletValue: toNano(0.1),
          _remainingGasTo: owner,
          _recipient: owner,
        })
        .send({ from: owner, amount: toNano(3) }),
    );

    const secondSupply = await secondNft.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => r.value0);

    const totalSupply = await collection.methods
      .totalSupply({ answerId: 0 })
      .call()
      .then((r) => r.count);

    expect(totalSupply).to.be.equal('4');
    expect(firstSupply).to.be.equal('100');
    expect(secondSupply).to.be.equal('200');
    return expect(firstId).to.be.not.eq(secondId);
  });
});
