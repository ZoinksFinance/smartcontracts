const hre = require("hardhat");
const { ethers, deployments } = hre;
const snacksBaseTestSuite = require('../reusable_test_suits/snacks_base_test_suite.js');

describe("BtcSnacks", () => {

  beforeEach(async () => {
    await deployments.fixture(['btc_snacks_test_fixtures']);
  });

  const testCases = snacksBaseTestSuite(
    [9, 10],
    async () => await ethers.getContractAt(
      hre.names.internal.btcSnacks,
      (await deployments.get(hre.names.internal.btcSnacks)).address
    ),
    async () => await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.btc)).address
    ),
    async (who, amount, lpToken) => await lpToken.mint(who.address, amount)
  );

  testCases[9]("BSNACK");

  testCases[10]("btcSnacks");

});
