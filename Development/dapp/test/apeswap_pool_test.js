const { ethers, deployments } = require("hardhat");
const singleRewardPoolTestSuite = require('../reusable_test_suits/single_reward_pool_test_suite');

describe("ApeSwapPool", () => {
  const rewardsDuration = ethers.BigNumber.from("43200");

  beforeEach(async () => {
    await deployments.fixture(['ape_swap_pool_test_fixtures']);
  });

  singleRewardPoolTestSuite(
    [],
    async (who, amount, lpToken) => {
      await lpToken.mint(who, amount);
    },
    async () => {
      return await ethers.getContractAt(
        "ApeSwapPool",
        (await deployments.get("ApeSwapPool")).address
      );
    },
    async () => {
      return await ethers.getContractAt(
        "MockToken",
        (await deployments.get("ApePairLP")).address
      );
    },
    rewardsDuration
  );
});
