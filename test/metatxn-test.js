const { expect } = require("chai");
const { getBytes, parseEther } = require("ethers");
const { ethers } = require("hardhat");

describe("MetaTokenTransfer", function () {
  it("Should let user transfer tokens through a relayer", async function () {
    // Deploy the contracts
    const RandomTokenFactory = await ethers.getContractFactory("RandomToken");
    const randomTokenContract = await RandomTokenFactory.deploy();
    await randomTokenContract.waitForDeployment();

    const MetaTokenSenderFactory = await ethers.getContractFactory(
      "TokenSender"
    );
    const tokenSenderContract = await MetaTokenSenderFactory.deploy();
    await tokenSenderContract.waitForDeployment();

    // Get three addresses, treat one as the user address
    // one as the relayer address, and one as a recipient address
    const [_, userAddress, relayerAddress, recipientAddress] =
      await ethers.getSigners();

    // Mint 10,000 tokens to user address (for testing)
    const tenThousandTokensWithDecimals = parseEther("10000");
    const userTokenContractInstance = randomTokenContract.connect(userAddress);
    const mintTxn = await userTokenContractInstance.freeMint(
      tenThousandTokensWithDecimals
    );
    await mintTxn.wait();

    // Have user infinite approve the token sender contract for transferring 'RandomToken'
    const approveTxn = await userTokenContractInstance.approve(
      tokenSenderContract.target,
      BigInt(
        // This is uint256's max value (2^256 - 1) in hex
        // Fun Fact: There are 64 f's in here.
        // In hexadecimal, each digit can represent 4 bits
        // f is the largest digit in hexadecimal (1111 in binary)
        // 4 + 4 = 8 i.e. two hex digits = 1 byte
        // 64 digits = 32 bytes
        // 32 bytes = 256 bits = uint256
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    );
    await approveTxn.wait();

    // Have user sign message to transfer 10 tokens to recipient
    const transferAmountOfTokens = parseEther("10");
    const messageHash = await tokenSenderContract.getHash(
      userAddress.address,
      transferAmountOfTokens,
      recipientAddress.address,
      randomTokenContract.target
    );
    const signature = await userAddress.signMessage(getBytes(messageHash));

    // Have the relayer execute the transaction on behalf of the user
    const relayerSenderContractInstance =
      tokenSenderContract.connect(relayerAddress);
    const metaTxn = await relayerSenderContractInstance.transfer(
      userAddress.address,
      transferAmountOfTokens,
      recipientAddress.address,
      randomTokenContract.target,
      signature
    );
    await metaTxn.wait();

    // Check the user's balance decreased, and recipient got 10 tokens
    const userBalance = await randomTokenContract.balanceOf(
      userAddress.address
    );
    const recipientBalance = await randomTokenContract.balanceOf(
      recipientAddress.address
    );

    expect(userBalance).to.be.lessThan(tenThousandTokensWithDecimals);
    expect(recipientBalance).to.be.greaterThan(BigInt(0));
  });
});

// describe("MetaTokenTransfer", function () {
//   it("Should let user transfer tokens through a relayer with different nonces", async function () {
//     // Deploy the contracts
//     const RandomTokenFactory = await ethers.getContractFactory("RandomToken");
//     const randomTokenContract = await RandomTokenFactory.deploy();
//     await randomTokenContract.waitForDeployment();

//     const MetaTokenSenderFactory = await ethers.getContractFactory(
//       "TokenSender"
//     );
//     const tokenSenderContract = await MetaTokenSenderFactory.deploy();
//     await tokenSenderContract.waitForDeployment();

//     // Get three addresses, treat one as the user address
//     // one as the relayer address, and one as a recipient address
//     const [_, userAddress, relayerAddress, recipientAddress] =
//       await ethers.getSigners();

//     // Mint 10,000 tokens to user address (for testing)
//     const tenThousandTokensWithDecimals = parseEther("10000");
//     const userTokenContractInstance = randomTokenContract.connect(userAddress);
//     const mintTxn = await userTokenContractInstance.freeMint(
//       tenThousandTokensWithDecimals
//     );
//     await mintTxn.wait();

//     // Have user infinite approve the token sender contract for transferring 'RandomToken'
//     const approveTxn = await userTokenContractInstance.approve(
//       tokenSenderContract.target,
//       BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
//     );
//     await approveTxn.wait();

//     // Have user sign message to transfer 10 tokens to recipient
//     let nonce = 1;

//     const transferAmountOfTokens = parseEther("10");
//     const messageHash = await tokenSenderContract.getHash(
//       userAddress.address,
//       transferAmountOfTokens,
//       recipientAddress.address,
//       randomTokenContract.target,
//       nonce
//     );
//     const signature = await userAddress.signMessage(getBytes(messageHash));

//     // Have the relayer execute the transaction on behalf of the user
//     const relayerSenderContractInstance =
//       tokenSenderContract.connect(relayerAddress);
//     const metaTxn = await relayerSenderContractInstance.transfer(
//       userAddress.address,
//       transferAmountOfTokens,
//       recipientAddress.address,
//       randomTokenContract.target,
//       nonce,
//       signature
//     );
//     await metaTxn.wait();

//     // Check the user's balance decreased, and recipient got 10 tokens
//     let userBalance = await randomTokenContract.balanceOf(userAddress.address);
//     let recipientBalance = await randomTokenContract.balanceOf(
//       recipientAddress.address
//     );

//     expect(userBalance).to.equal(parseEther("9990"));
//     expect(recipientBalance).to.equal(parseEther("10"));

//     // Increment the nonce
//     nonce++;

//     // Have user sign a second message, with a different nonce, to transfer 10 more tokens
//     const messageHash2 = await tokenSenderContract.getHash(
//       userAddress.address,
//       transferAmountOfTokens,
//       recipientAddress.address,
//       randomTokenContract.target,
//       nonce
//     );
//     const signature2 = await userAddress.signMessage(getBytes(messageHash2));
//     // Have the relayer execute the transaction on behalf of the user
//     const metaTxn2 = await relayerSenderContractInstance.transfer(
//       userAddress.address,
//       transferAmountOfTokens,
//       recipientAddress.address,
//       randomTokenContract.target,
//       nonce,
//       signature2
//     );
//     await metaTxn2.wait();

//     // Check the user's balance decreased, and recipient got 10 tokens
//     userBalance = await randomTokenContract.balanceOf(userAddress.address);
//     recipientBalance = await randomTokenContract.balanceOf(
//       recipientAddress.address
//     );

//     expect(userBalance).to.eq(parseEther("9980"));
//     expect(recipientBalance).to.eq(parseEther("20"));
//   });

//   it("Should not let signature replay happen", async function () {
//     // Deploy the contracts
//     const RandomTokenFactory = await ethers.getContractFactory("RandomToken");
//     const randomTokenContract = await RandomTokenFactory.deploy();
//     await randomTokenContract.waitForDeployment();

//     const MetaTokenSenderFactory = await ethers.getContractFactory(
//       "TokenSender"
//     );
//     const tokenSenderContract = await MetaTokenSenderFactory.deploy();
//     await tokenSenderContract.waitForDeployment();

//     // Get three addresses, treat one as the user address
//     // one as the relayer address, and one as a recipient address
//     const [_, userAddress, relayerAddress, recipientAddress] =
//       await ethers.getSigners();

//     // Mint 10,000 tokens to user address (for testing)
//     const tenThousandTokensWithDecimals = parseEther("10000");
//     const userTokenContractInstance = randomTokenContract.connect(userAddress);
//     const mintTxn = await userTokenContractInstance.freeMint(
//       tenThousandTokensWithDecimals
//     );
//     await mintTxn.wait();

//     // Have user infinite approve the token sender contract for transferring 'RandomToken'
//     const approveTxn = await userTokenContractInstance.approve(
//       tokenSenderContract.target,
//       BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
//     );
//     await approveTxn.wait();

//     // Have user sign message to transfer 10 tokens to recipient
//     let nonce = 1;

//     const transferAmountOfTokens = parseEther("10");
//     const messageHash = await tokenSenderContract.getHash(
//       userAddress.address,
//       transferAmountOfTokens,
//       recipientAddress.address,
//       randomTokenContract.target,
//       nonce
//     );
//     const signature = await userAddress.signMessage(getBytes(messageHash));

//     // Have the relayer execute the transaction on behalf of the user
//     const relayerSenderContractInstance =
//       tokenSenderContract.connect(relayerAddress);
//     const metaTxn = await relayerSenderContractInstance.transfer(
//       userAddress.address,
//       transferAmountOfTokens,
//       recipientAddress.address,
//       randomTokenContract.target,
//       nonce,
//       signature
//     );
//     await metaTxn.wait();

//     // Have the relayer attempt to execute the same transaction again with the same signature
//     // This time, we expect the transaction to be reverted because the signature has already been used.
//     expect(
//       relayerSenderContractInstance.transfer(
//         userAddress.address,
//         transferAmountOfTokens,
//         recipientAddress.address,
//         randomTokenContract.target,
//         nonce,
//         signature
//       )
//     ).to.be.revertedWith("Already executed!");
//   });
// });