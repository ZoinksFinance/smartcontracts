const { ethers, deployments } = require("hardhat");
const snacksBaseTestSuite = require('../reusable_test_suits/snacks_base_test_suite.js');

describe("BtcSnacks", () => {

  beforeEach(async () => {
    await deployments.fixture(['btc_snacks_test_fixtures']);
  });

  snacksBaseTestSuite(
    [],
    async () => await ethers.getContractAt(
        "BtcSnacks",
        (await deployments.get("BtcSnacks")).address
      ),
    async () => await ethers.getContractAt(
        "MockToken",
        (await deployments.get("BTC")).address
      ),
    async (who, amount, lpToken) => await lpToken.mint(who.address, amount)
  );
});
