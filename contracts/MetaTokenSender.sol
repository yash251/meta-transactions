// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract RandomToken is ERC20 {
    constructor() ERC20("", "") {}

    function freeMint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}

contract TokenSender {
    using ECDSA for bytes32;

    function transfer(
        address sender,
        uint256 amount,
        address recipient,
        address tokenContract,
        bytes memory signature
    ) public {
        // Calculate the hash of all the requisite values
        bytes32 messageHash = getHash(sender, amount, recipient, tokenContract);
        // Convert it to a signed message hash
        bytes32 signedMessageHash = messageHash.toEthSignedMessageHash();

        // Extract the original signer address
        address signer = signedMessageHash.recover(signature);

        // Make sure signer is the person on whose behalf we're executing the transaction
        require(signer == sender, "Signature does not come from sender");

        // Transfer tokens from sender(signer) to recipient
        bool sent = ERC20(tokenContract).transferFrom(
            sender,
            recipient,
            amount
        );
        require(sent, "Transfer failed");
    }

    // Helper function to calculate the keccak256 hash
    function getHash(
        address sender,
        uint256 amount,
        address recipient,
        address tokenContract
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(sender, amount, recipient, tokenContract)
            );
    }
}

// pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// contract RandomToken is ERC20 {
//     constructor() ERC20("", "") {}

//     function freeMint(uint amount) public {
//         _mint(msg.sender, amount);
//     }
// }

// contract TokenSender {

//     using ECDSA for bytes32;

//     // New mapping
//     mapping(bytes32 => bool) executed;

//     // Add the nonce parameter here
//     function transfer(address sender, uint amount, address recipient, address tokenContract, uint nonce, bytes memory signature) public {
//         // Pass ahead the nonce
//         bytes32 messageHash = getHash(sender, amount, recipient, tokenContract, nonce);
//         bytes32 signedMessageHash = messageHash.toEthSignedMessageHash();

//         // Require that this signature hasn't already been executed
//         require(!executed[signedMessageHash], "Already executed!");

//         address signer = signedMessageHash.recover(signature);

//         require(signer == sender, "Signature does not come from sender");

//         // Mark this signature as having been executed now
//         executed[signedMessageHash] = true;
//         bool sent = ERC20(tokenContract).transferFrom(sender, recipient, amount);
//         require(sent, "Transfer failed");
//     }

//     // Add the nonce parameter here
//     function getHash(address sender, uint amount, address recipient, address tokenContract, uint nonce) public pure returns (bytes32) {
//         return keccak256(abi.encodePacked(sender, amount, recipient, tokenContract, nonce));
//     }
// }