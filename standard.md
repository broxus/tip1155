# TIP-1155 MultiToken standard

**Abstract**
The following standard describes the basic idea about distributed Multi-Token architecture. This standard provides basic functionality to create, track and transfer both fungible and non-fungible tokens in a collection.


**Architecture**
General information about tokens collection is stored in the collection contract. Each non-fungible token (NFT) deployed in separate smart contracts. Each nft contract is TIP3.2 TokenRoot and TIP4.1 NFT compliant, and is therefore a token root. Each MultiToken holder has their own instance of a specific contract.

**Motivation**
The reason why this standard was developed when VEP-1155 already exists is that VEP-1155 uses custom callbacks, which in turn complicates the integration of MultiToken with other with existed contracts (dex, lending, staking, dao,farming,e.t.c) and development solutions like ever-wallet-api in a VENOM\Everscale network out of the box. By using the TIP-3.2 and TIP-4.1 standards, the TIP-1155 standard solves this problem.


**In general Smart contract architecture based on:**

Consider an asynchronous type of Venom blockchain. Use callbacks and asynchronous getters.
Standardizes one NFT - one smart contract.
Gas fee management practicals.
Use TIP-3.2 architecture for MultiTokens.
Use TIP-4.1 architecture and interfaces for non-fungible tokens.
Use TIP-6.1

**Specification**
The keywords “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

**Contracts**
Collection - contract that mints tokens.
NFT - TIP-4.1 and TIP3.2 contract that stores token information and tokenSupply.
MultiTokenWallet - TIP-3.2 like compliant constract stores the balance. Each MultiToken holder has its own instance of MultiToken wallet contract.
All user tokens in current collection using owner address and collection address.
All user tokens in all collections using the owner address.
All multiTokenWallets must have a root address that matches the nft address. Where nftId == tokenId

**Collection**
The contract represents shared information about tokens collection and logic for creation of tokens and burn of NFTs.

**Interfaces**
Every TIP-1155 compliant collection contract must implement IMultiTokenCollection interface in addtion to TIP4.1Collection, TIP3.2TokenRoot and TIP-6.1.


```
interface IMultiTokenCollection {

    /// @notice Returns the MultiToken wallet code
    /// @return code Returns the MultiToken wallet code as TvmCell
    function multiTokenWalletCode(
        uint256 id, 
        bool isEmpty
    ) external view responsible returns (TvmCell code);

    /// @notice Returns the MultiToken wallet code hash
    /// @return codeHash Returns the MultiToken wallet code hash
    function multiTokenCodeHash(
        uint256 id, 
        bool isEmpty
    ) external view responsible returns (uint256 codeHash);

    /// @notice Computes MultiToken wallet address by unique MultiToken id and its owner
    /// @dev Return unique address for all Ids and owners. You find nothing by address for not a valid MultiToken wallet
    /// @param id Unique MultiToken id
    /// @param owner Address of MultiToken owner
    /// @return token Returns the address of MultiToken wallet contract
    function multiTokenWalletAddress(
        uint256 id, 
        address owner
    ) external view responsible returns (address token);
}
```



NOTE The TIP-6.1 identifier for this interface is 0x057c489e.

```
IMultiTokenCollection.multiTokenWalletCode()

function multiTokenWalletCode(
    uint256 id, 
    bool isEmpty
) external view responsible returns (TvmCell code);
```


* id (uint256) - Unique Nft id
* isEmpty (bool) - Balance empty flag
* code (TvmCell) - MultiToken contract code

MultiToken wallet is a smart contract deployed from collection smart contract using tokenCode, id and owner address. MultiToken wallet code must be salted by collection address, the nft id, and isEmpty flag that marks if the wallet has a balance of zero.

```
IMultiTokenCollection.multiTokenCodeHash()

function multiTokenCodeHash(
    uint256 id, 
    bool isEmpty
) public view responsible returns (uint256 codeHash);
```


* id (uint256) - Unique Nft id
* isEmpty (bool) - Balance empty flag
* codeHash (uint256) - MultiToken wallet contract code hash

The codeHash allows search of all empty or non-empty MultiToken wallet contracts of this collection for the corresponding nft using base dApp functionality.


```
IMultiTokenCollection.tokenAddress()

function multiTokenWalletAddress(
    uint256 id, 
    address owner
) external view responsible returns (address token);
```


* id (uint256) - Unique Nft id
* owner (address) - Address of MultiToken wallet owner

Computes MultiToken wallet contract address by unique Nft id and its owner. You can check number of owned MultiTokens using base dApp functionality.


**Mint and burn NFT and MultiTokens**
A function's signature is not included in the specification. It's recommended to return the id of the minted MultiToken in the mint function in order to find minted MultiToken wallet contracts.


**NFT**
The MultiTokenNFT is essentially a non-fungible token (NFT) and a root contract for fungible tokens. And as is standard for TIP-4.1 and TIP-3.2. Since 1155 collection supports TIP4_1Collection interface, it's compatible and there is no any difference with TIP-4.1 standard when dealing with NFT. In order to be consistent NFT contract must support TIP-4.1.
In order to be consistent token root contract, the MultiTokenNFT contract must support the TIP-3.2 standard, and and it has no differences from standard TIP-3.2 token root contracts.

NOTE The TIP-6.1 identifier for this interface is 0x14b19005

**MultiToken wallet must:**

* implement IMultiTokenWallet interface and TIP-6.1 interfaces.
* implement IDestroyable interface, the owner must decide whether to destroy the MultiToken wallet contract or not if the balance is zero.
* MultiTokenWallet must be deployed from the MultiToken NFT smart contract.
* Every 1155 compliant token contract must implement the IMultiTokenWallet interface and TIP-6.1 interfaces.
* have correct codesalt with (in order):
  the collection address: address collection
  the token id: uint128 id
  the balance empty flag bool isEmpty
  On a zero balance, isEmpty must be set to true
  On a non-zero balance, isEmpty must be set to false

```
    pragma ton-solidity >= 0.58.0;

    interface IMultiTokenWallet {

        /// @notice MultiToken info
        /// @return id Unique MultiToken id
        /// @return collection Сollection smart contract address
        function getInfo() 
            external 
            view 
            responsible 
            returns(uint256 id, address collection);

    }
```


* id (uint256) - Unique MultiToken id
* collection (address) - The MultiToken collection address

NOTE The TIP-6.1 identifier for this interface is 0x3aa17cd9

**Mint MultiTokenWallet**
A function and constructor signature is not included in the specification.



**Callbacks**
Since the 1155 standard fully supports the TIP-3.2 and TIP-4.1 standard, all callbacks are inherited from the fungible and non-fungible token standard, and are fully compatible with them.


**Rationale**

**Ownership**
MultiTokenNFT has a manager and an owner, and as for TIP-3.2 token root has an owner.
According to the standard, it is not necessary for it to be 1 address, everything is implemented according to your requirements. 

