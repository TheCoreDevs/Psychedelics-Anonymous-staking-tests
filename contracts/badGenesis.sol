// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract badGenesis is ERC721("BAD Psychedelic Genesis", "bPAG") {
    uint256 public tokenSupply = 1;

    function mint(uint256 _amount) external {
        uint256 _tokenSupply = tokenSupply;
        for (uint256 i = 0; i < _amount; ) {
            unchecked {
                _mint(msg.sender, _tokenSupply++);
                ++i;
            }
        }
        tokenSupply = _tokenSupply;
    }

    function mintTo(address _address, uint256 _amount) external {
        uint256 _tokenSupply = tokenSupply;
        for (uint256 i = 0; i < _amount; ) {
            unchecked {
                _mint(_address, _tokenSupply++);
                ++i;
            }
        }
        tokenSupply = _tokenSupply;
    }
}
