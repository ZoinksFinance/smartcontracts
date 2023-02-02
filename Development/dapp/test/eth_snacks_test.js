const { ethers, deployments } = require("hardhat");
const snacksBaseTestSuite = require('../reusable_test_suits/snacks_base_test_suite.js');

describe("EthSnacks", () => {

  beforeEach(async () => {
    await deployments.fixture(['eth_snacks_test_fixtures']);
  });

  snacksBaseTestSuite(
    [],
    async () => await ethers.getContractAt(
        "EthSnacks",
        (await deployments.get("EthSnacks")).address
      ),
    async () => await ethers.getContractAt(
        "MockToken",
        (await deployments.get("ETH")).address
      ),
    async (who, amount, lpToken) => await lpToken.mint(who.address, amount)
  );
});
