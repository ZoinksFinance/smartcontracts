const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { ZERO } = require("../deploy/helpers");
const snacksBaseTestSuite = require('../reusable_test_suits/snacks_base_test_suite.js');

describe("Snacks", () => {

  let owner;
  let buyer1;
  let buyer2;
  let buyer3;
  let buyer4;
  let buyer5;
  let seller;

  let zoinks;
  let snacks;
  let seniorage;
  let pulse;
  let busd;

  beforeEach(async () => {
    await deployments.fixture(['snacks_test_fixtures']);
    [
      owner,
      buyer1,
      buyer2,
      buyer3,
      buyer4,
      buyer5,
      seller
    ] = await ethers.getSigners();
    zoinks = await ethers.getContractAt(
      "Zoinks",
      (await deployments.get("Zoinks")).address
    );
    seniorage = await ethers.getContractAt(
      "Seniorage",
      (await deployments.get("Seniorage")).address
    );
    pulse = await ethers.getContractAt(
      "Pulse",
      (await deployments.get("Pulse")).address
    );
    snacks = await ethers.getContractAt(
      "Snacks",
      (await deployments.get("Snacks")).address
    );
    busd = await ethers.getContractAt(
      "MockToken",
      (await deployments.get("BUSD")).address
    );
  });

  const payTokenMintingAction = async (who, amount, payToken) => {
    await busd.mint(who.address, amount);
    await busd.approve(payToken.address, amount);
    await payToken.mint(amount);
    if (who.address !== owner.address) {
      await payToken.transfer(who.address, amount);
    }
  }

  const testCases = snacksBaseTestSuite(
    [1, 2, 3, 4, 5, 6],
    async () => await ethers.getContractAt(
        "Snacks",
        (await deployments.get("Snacks")).address
      ),
    async () => await ethers.getContractAt(
        "Zoinks",
        (await deployments.get("Zoinks")).address
      ),
    payTokenMintingAction
  );

  // 2. Check how many <token> we need to pay for 5 new <any>Snacks
  testCases[1](ethers.BigNumber.from('15000000000000'));

  // 3. Buy 5 new <any>Snacks and pay with 0.00000015 <token>. And check undistributed 5% mintWithBuyTokenAmount fee 0.25 <any>Snacks
  testCases[2](ethers.BigNumber.from('7000015000000000000'));

  // 4. Check how many <token> we need to return for 4.75 of total 5 <any>Snacks
  // testCases[3](ethers.BigNumber.from('14843750000000'));

  // 5. Check how many <token> we need to return for 6 of total 7 <any>Snacks
  // testCases[4](ethers.BigNumber.from('27000000000000'));

  // // 6. Redeem 4.75 <any>Snacks and get <token>. And check undistributed 5% mintWithBuyTokenAmount + 10% redeem fee 0.50 <any>Snacks
  // testCases[5](
  //   ethers.BigNumber.from('15000000000000'),
  //   ethers.BigNumber.from('14374687500000')
  // );

  it("10. Check how many Snacks we mint, with 0.000015 Zoinks", async () => {
    // ACT
    const amountZoinksToSpend = ethers.utils.parseEther('0.000015');
    const snacksResult = await snacks.calculateBuyTokenAmountOnMint(amountZoinksToSpend);
    const snacksExpected = ethers.BigNumber.from('5000000000000000000');

    // ASSERT
    expect(snacksResult).to.be.equal(snacksExpected);
  });

  it("11. Check how many Snacks we mint, with 1 Zoinks and 5 Snacks already minted", async () => {
    // Current price
    const amountSnacksToMint = ethers.utils.parseEther('5');

    const zoinksCurrentPriceResult = await snacks.calculatePayTokenAmountOnMint(amountSnacksToMint);
    const zoinksCurrentPriceExpected = ethers.utils.parseEther('0.000015');
    // New price
    const amountZoinksToSpend = ethers.utils.parseEther('1');
    const currentTotalSupply = ethers.utils.parseEther('5');
    await busd.mint(owner.address, currentTotalSupply);
    await busd.approve(zoinks.address, currentTotalSupply);
    await zoinks.mint(currentTotalSupply);
    await zoinks.approve(snacks.address, currentTotalSupply);

    let snacksResult = await snacks.calculateBuyTokenAmountOnMint(amountZoinksToSpend);
    await snacks.mintWithPayTokenAmount(amountZoinksToSpend);
    const snacksExpected = ethers.BigNumber.from('1343027968223367525000');

    // ASSERT
    expect(zoinksCurrentPriceResult).to.be.equal(zoinksCurrentPriceExpected);
    expect(snacksResult.mul(95).div(100)).to.be.equal(snacksExpected);
  });

  it("12. Check big number os Zoinks to mintWithBuyTokenAmount Snacks calculation of TOTAL to mintWithBuyTokenAmount", async () => {
    // ACT
    const amountZoinksToSpend = ethers.BigNumber.from("50055015000000000000"); // 50.055015
    const currentTotalSupply = ethers.utils.parseEther('5');
    await payTokenMintingAction(owner, currentTotalSupply, zoinks);
    await zoinks.approve(snacks.address, currentTotalSupply);
    await snacks.mintWithBuyTokenAmount(currentTotalSupply);
    const snacksResult = await snacks.calculateBuyTokenAmountOnMint(amountZoinksToSpend);
    const snacksExpected = ethers.utils.parseEther('10000');

    // ASSERT
    expect(snacksResult).to.be.closeTo(snacksExpected, '1500000000000000');
  });

  it("13. Check very big number os Zoinks to mintWithBuyTokenAmount Snacks calculation of TOTAL to mintWithBuyTokenAmount", async () => {
    // ACT
    // Max zoinks to spend: 8361,00
    // Max snacks to mint: 129313
    const amountZoinksToSpend = ethers.BigNumber.from("8361000000000000000000"); // 500005.5
    const currentTotalSupply = ethers.utils.parseEther('5');
    await payTokenMintingAction(owner, currentTotalSupply, zoinks);
    await zoinks.approve(snacks.address, currentTotalSupply);
    const snacksResult = await snacks.calculateBuyTokenAmountOnMint(amountZoinksToSpend);
    const snacksExpected = ethers.utils.parseEther('129313');

    // ASSERT
    expect(snacksResult).to.be.closeTo(snacksExpected, '72400000000000000');
  });
});
