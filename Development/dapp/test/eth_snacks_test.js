const hre = require("hardhat");
const { ethers, deployments } = hre;
const snacksBaseTestSuite = require('../reusable_test_suits/snacks_base_test_suite.js');

describe("EthSnacks", () => {

  beforeEach(async () => {
    await deployments.fixture(['eth_snacks_test_fixtures']);
  });

  const testCases = snacksBaseTestSuite(
    [9, 10],
    async () => await ethers.getContractAt(
      hre.names.internal.ethSnacks,
      (await deployments.get(hre.names.internal.ethSnacks)).address
    ),
    async () => await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.eth)).address
    ),
    async (who, amount, lpToken) => await lpToken.mint(who.address, amount)
  );

  testCases[9]("ETSNACK");

  testCases[10]("ethSnacks");

});
