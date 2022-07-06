// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Delegated } from "./Delegated.sol";

/** @dev uncomment for prod */
import { mockGenesis } from "./mockGenesis.sol";
import { mockC1 } from "./mockC1.sol";
import { mockPsilocybin } from "./mockPsilocybin.sol";
import { PSYToken } from "./PSYToken.sol";
import "hardhat/console.sol";

contract PAStaker is ERC721Holder, Delegated { 
    using EnumerableSet for EnumerableSet.UintSet;

    /** @dev remove below for prod. Will deploy all separating when rinkeby testing */
    mockGenesis    public immutable GENESIS;
    mockC1         public immutable COMPONENT_1;
    mockPsilocybin public immutable PSILOCYBIN;
    // PSYToken       public immutable PSYTOKEN    = new PSYToken(address(this)); // if this is never used, why declair it? 
    IERC721[3] public TOKEN_CONTRACTS;
    constructor(address genesis, address c1, address psilocybin) {
        GENESIS = mockGenesis(genesis);
        COMPONENT_1 = mockC1(c1);
        PSILOCYBIN = mockPsilocybin(psilocybin);
        TOKEN_CONTRACTS = [
            IERC721((genesis)), 
            IERC721((c1)), 
            IERC721((psilocybin))
        ];
    }
    /** @dev remove above for prod */

    /** @dev uncomment for prod */
    // IERC721 public constant GENESIS = IERC721(0x75E95ba5997Eb235F40eCF8347cDb11F18ff640B);
    // IERC721 public constant COMPONENT_1 = IERC721(0x5501024dDb740266Fa0d69d19809EC86dB5E3f8b);
    // IERC721 public constant PSILOCYBIN = IERC721(0x11ca9693156929EE2e7E1470C5E1A55b413e9007);
    // IERC721[3] constant tokenContracts = [ GENESIS, COMPONENT_1, PSILOCYBIN ];
    ///////////// this array is redundant. remove it

    enum TokenTypes { Genesis, Component1, Psilocybin }
    struct TokenInfo { address owner; uint256 timeStaked; }
    mapping(TokenTypes => mapping(uint256 => TokenInfo)) public tokenInfo;
    mapping(address => mapping(TokenTypes => EnumerableSet.UintSet)) stakedTokens; // just use balanceOf(addr) and ownerOf to calculate it. saving it in storage is redundant and expensive

    /**
     * VIEW FUNCTIONS
     */
    function timeSinceStaked(TokenTypes _tokenType, uint256 _id) external view returns (uint256) { // would make it so this getter returns all the struct info
        return block.timestamp - tokenInfo[_tokenType][_id].timeStaked; // Error: time since staked returns block.timestamp for unstaked tokens instead of 0
    }
    // this shouldn't be a problem once they stake that token again... it is a very minor issue that can be ignored
    // what I would recommend to do is to just return the token info instead of calculating it there. and just do the time calculation offchain

    function isStaked(address _owner, TokenTypes _tokenType, uint256 _id) external view returns (bool) {
        return stakedTokens[_owner][_tokenType].contains(_id);
    }

    function stakedBalance(address _owner, TokenTypes _tokenType) external view returns (uint256) {
        return stakedTokens[_owner][_tokenType].length();
    }

    function getStakedTokens(address _owner, TokenTypes _tokenType) external view returns (uint256[] memory) {
        return stakedTokens[_owner][_tokenType].values();
    }

    // why use the complexity of openzeppelin enumerable sets if you can do it much more simplified with an external
    // function with a loop? this function is only going to be called externally anyways...
    // it only makes gas more expensive using openzeppelins sets
    // besides.. to know if a token is staked you only need it's type and ID
    // it might be simpler to read using openzeppelin but the tradeoff is gas. in my opinion gas > readablity.
    // don't get me wrong though.. make sure everything is readable but simplify it as much as you can

    /**
     * USER FUNCTIONS
     */
     /** @dev batchStake requires setApprovalForAll before using */
    function batchStake(uint256[] calldata _ids, TokenTypes _tokenType) external {
        for(uint i = 0; i < _ids.length; i++) {
            tokenInfo[_tokenType][_ids[i]] = TokenInfo(msg.sender, block.timestamp); // you should set them one by one to avoid creating a memory instance
            stakedTokens[msg.sender][_tokenType].add(_ids[i]);
            _contractTransfer(msg.sender, address(this), _ids[i], uint256(_tokenType));
        }
        // unoptimized loop
    }

    function unstake(uint256 _id, TokenTypes _tokenType) public {
        address _owner = tokenInfo[_tokenType][_id].owner;
        require(msg.sender == _owner, "not owner");

        tokenInfo[_tokenType][_id] = TokenInfo(address(0), 0);  // you should set them one by one to avoid creating a memory instance
        stakedTokens[msg.sender][_tokenType].remove(_id); 
        _contractTransfer(address(this), _owner, _id, uint(_tokenType));
    }

    function batchUnstake(uint256[] calldata _ids, TokenTypes _tokenType) external {
        for(uint i = 0; i < _ids.length; i++) {
            unstake(_ids[i], _tokenType);
        }
    }

    // unstaking through here will not give the person any tokens.. there are simpler ways to do so.

    /**
     * ONLY DELEGATES
     */
     /** @dev this function can only be used by specific addresses to unstake tokens and return them back to their owner */
    function delegatedUnstake(uint256 _id, TokenTypes _tokenType) public onlyDelegates {
        address _owner = tokenInfo[_tokenType][_id].owner;
        tokenInfo[_tokenType][_id] = TokenInfo(address(0), 0); // more gas efficiant to set them one by one, or just use delete
        stakedTokens[_owner][_tokenType].remove(_id); 
        _contractTransfer(address(this), _owner, _id, uint(_tokenType));
    }

    function delegatedBatchUnstake(uint256[] calldata _ids, TokenTypes _tokenType) external onlyDelegates { // no need to put onlyDelegates twice if you are calling the first function
        for(uint i = 0; i < _ids.length; i++) {
            delegatedUnstake(_ids[i], _tokenType);
        }
    }

    /**
     * PRIVATE FUNCTIONS
     */
     function _contractTransfer(address _from, address _to, uint256 _id, uint256 _contractIndex) private {
        require(_contractIndex < 3, "invalid contract type");
        TOKEN_CONTRACTS[_contractIndex].transferFrom(_from, _to, _id);
        // don't use the array. it is redundant and consumes more gas. if you want to use the array so ok.. but don't save the other addresses on storage as well..
    }

    function _getContractType(address _contract) private view returns (TokenTypes) {
        if (_contract == address(GENESIS)) return TokenTypes.Genesis;
        if (_contract == address(COMPONENT_1)) return TokenTypes.Component1;
        if (_contract == address(PSILOCYBIN)) return TokenTypes.Psilocybin;
        revert("wrong token received");
    }

    /**
     * OVERRIDES
     */
    function onERC721Received(
        address, // unused
        address _from,
        uint256 _id,
        bytes memory // unused
    ) public override returns (bytes4) {
        TokenTypes _contractType = _getContractType(msg.sender);
        tokenInfo[_contractType][_id] = TokenInfo(_from, block.timestamp);

        stakedTokens[_from][_contractType].add(_id);

        return this.onERC721Received.selector;
    }

    // if someone uses `transferFrom` so this method will never be called. 
}

/***************************************
 * @author: 🍖                         *
 * @team:   Asteria   -                  *
 ****************************************/