// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

interface IStake {
    struct TokenInfo { address owner; uint256 timeStaked; }
    enum TokenTypes { Genesis, Component1, Psilocybin }
    function delegatedUnstake(uint256 _id, TokenTypes _tokenType) external;
    function delegatedBatchUnstake(uint256[] calldata _ids, TokenTypes _tokenType) external;
    function tokenInfo(TokenTypes, uint256) external returns (TokenInfo memory);
}

contract PSYToken is ERC20("Psychedelics Anonymous Token", "PSY") {
    IStake public immutable STAKING_CONTRACT;

    enum TokenTypes { Genesis, Component1, Psilocybin }

    constructor(address _staker) {
        STAKING_CONTRACT = IStake(_staker);
    }

    function tokenUnstake(uint256 _id, IStake.TokenTypes _tokenType) external {
        address _owner = STAKING_CONTRACT.tokenInfo(_tokenType, _id).owner;
        require(msg.sender == _owner, "TOKEN: not owner");
        STAKING_CONTRACT.delegatedUnstake(_id, _tokenType);
    }

    function tokenBatchUnstake(uint256[] calldata _ids, IStake.TokenTypes _tokenType) external {
        STAKING_CONTRACT.delegatedBatchUnstake(_ids, _tokenType);
    }
}
