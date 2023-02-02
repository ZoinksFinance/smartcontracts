const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const multipleRewardPoolTestSuite = require('../reusable_test_suits/multiple_reward_pool_test_suite');
const { mintZoinksAndAllSnacks } = require("../deploy/helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SnacksPool", () => {
  let pool;
  let lpToken;
  let owner;
  let alice;
  let zoinks;
  let btcSnacks;
  let ethSnacks;
  let snacks;
  let busd;

  const rewardsDuration = ethers.BigNumber.from("43200");

  const lpTokenInstanceAcquiringAction = async () => {
    return await ethers.getContractAt(
      "Snacks",
      (await deployments.get("Snacks")).address
    );
  }

  const poolInstanceAcquiringAction = async () => {
    return await ethers.getContractAt(
      "SnacksPool",
      (await deployments.get("SnacksPool")).address
    );
  }

  const stakingTokenMintingAction = async (who, amount, lpToken) => {
    const taxFeePercent = await lpToken.TAX_PERCENT_FOR_BUY();
    const amountWithFee = amount.add(amount.mul(taxFeePercent).div(100));
    await busd.mint(owner.address, amountWithFee);
    await busd.approve(zoinks.address, amountWithFee);
    await zoinks.mint(amountWithFee);
    await zoinks.approve(lpToken.address, amount);
    await lpToken.buyTotal(amount);
    if (who !== owner.address) {
      await lpToken.transfer(who, amount);
    }
  }

  beforeEach(async () => {
      await deployments.fixture(['snacks_pool_test_fixtures']);
      [ owner, alice ] = await ethers.getSigners();

      pool = await poolInstanceAcquiringAction();
      lpToken = await lpTokenInstanceAcquiringAction();
      zoinks = await ethers.getContractAt(
        "Zoinks",
        (await deployments.get("Zoinks")).address
      );
      btcSnacks = await ethers.getContractAt(
        "BtcSnacks",
        (await deployments.get("BtcSnacks")).address
      );
      ethSnacks = await ethers.getContractAt(
        "EthSnacks",
        (await deployments.get("EthSnacks")).address
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

  multipleRewardPoolTestSuite(
    // [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 13, 14, 15],
    [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 14, 15, 16],
    [], // // no need to disable some expects of reward with penalties
    [], // no need to disable some expects of reward without penalties
    1, // staking token is first in reward tokens
    stakingTokenMintingAction,
    poolInstanceAcquiringAction,
    lpTokenInstanceAcquiringAction,
    rewardsDuration
  );

  // it("Successful notifyRewardAmount() execution", async () => {
  //   const amountToStake = ethers.utils.parseEther("100");
  //   await stakingTokenMintingAction(owner.address, amountToStake, lpToken);
  //   await snacks.approve(pool.address, amountToStake);
  //   await pool.stake(amountToStake);
  //   // Reward transfer
  //   const amountToTransfer = ethers.utils.parseEther("1000");
  //   await snacks.transfer(pool.address, amountToTransfer);
  //   // Notify
  //   await pool.notifyRewardAmount(snacks.address, amountToTransfer);
  //   let block = await ethers.provider.getBlock();
  //   // Contract state check
  //   expect(await pool.rewardRates(snacks.address)).to.equal(amountToTransfer.div(rewardsDuration));
  //   expect(await pool.lastUpdateTimePerToken(snacks.address)).to.equal(block.timestamp);
  //   expect(await pool.periodFinishPerToken(snacks.address)).to.equal(rewardsDuration.add(block.timestamp));
  //   const previousPeriodFinishPerToken = rewardsDuration.add(block.timestamp);
  //   const previousRewardRate = await pool.rewardRates(snacks.address);
  //   // Reward transfer
  //   await snacks.transfer(pool.address, amountToTransfer);
  //   // Notify
  //   await pool.notifyRewardAmount(snacks.address, amountToTransfer);
  //   block = await ethers.provider.getBlock();
  //   const remaining = previousPeriodFinishPerToken.sub(block.timestamp);
  //   const leftover = remaining.mul(previousRewardRate);
  //   // Contract state check
  //   expect(await pool.rewardRates(snacks.address)).to.equal(amountToTransfer.add(leftover).div(rewardsDuration));
  //   expect(await pool.lastUpdateTimePerToken(snacks.address)).to.equal(block.timestamp);
  //   expect(await pool.periodFinishPerToken(snacks.address)).to.equal(rewardsDuration.add(block.timestamp));
  //   // 10 days passed
  //   await time.increase(864000);
  //   // Get reward from user
  //   await pool.getReward();
  //   // 10 days passed
  //   await time.increase(864000);
  //   // Get reward from user
  //   await pool.getReward();
  //   // 10 days passed
  //   await time.increase(864000);
  //   // Get reward from user
  //   await pool.getReward();
  //   // Big reward notification
  //   await expect(pool.notifyRewardAmount(snacks.address, amountToTransfer.mul(1000))).to.be.revertedWith("SnacksPool: provided reward too high");
  // });
});
