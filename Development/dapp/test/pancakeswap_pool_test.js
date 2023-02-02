const { ethers, deployments } = require("hardhat");
const multipleRewardPoolTestSuite = require('../reusable_test_suits/multiple_reward_pool_test_suite');

describe("PancakeSwapPool", () => {
  const rewardsDuration = ethers.BigNumber.from("43200");

  beforeEach(async () => {
    await deployments.fixture(['pancake_swap_pool_test_fixtures']);
  });

  multipleRewardPoolTestSuite(
    [1, 2, 3, 4, 12, 16],
    [], // // no need to disable some expects of reward with penalties
    [], // no need to disable some expects of reward without penalties
    -1, // to need to take into account that staking token is a reward token
    async (who, amount, lpToken) => {
      await lpToken.mint(who, amount);
    },
    async () => {
      return await ethers.getContractAt(
        "PancakeSwapPool",
        (await deployments.get("PancakeSwapPool")).address
      );
    },
    async () => {
      return await ethers.getContractAt(
        "MockToken",
        (await deployments.get("PancakePairLP")).address
      );
    },
    rewardsDuration
);
});
