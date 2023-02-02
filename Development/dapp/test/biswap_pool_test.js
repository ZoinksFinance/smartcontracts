const { ethers, deployments } = require("hardhat");
const singleRewardPoolTestSuite = require('../reusable_test_suits/single_reward_pool_test_suite');

describe("BiSwapPool", () => {
  const rewardsDuration = ethers.BigNumber.from("43200");

  beforeEach(async () => {
    await deployments.fixture(['bi_swap_pool_test_fixtures']);
  });

  singleRewardPoolTestSuite(
    [], // disable notifyRewardAmount reusable test case
    async (who, amount, lpToken) => {
      await lpToken.mint(who, amount);
    },
    async () => {
      return await ethers.getContractAt(
        "BiSwapPool",
        (await deployments.get("BiSwapPool")).address
      );
    },
    async () => {
      return await ethers.getContractAt(
        "MockToken",
        (await deployments.get("BiPairLP")).address
      );
    },
    rewardsDuration
  );
});
