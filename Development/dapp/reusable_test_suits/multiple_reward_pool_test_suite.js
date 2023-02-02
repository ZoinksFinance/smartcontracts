const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { ZERO_ADDRESS, mintZoinksAndAllSnacks } = require("../deploy/helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

module.exports = (
  disabledTestCaseIndicies,
  disabledExpectsForBalancesWithPenalty,
  disabledExpectsForBalancesWithoutPenalty,
  stakingTokenIndex,
  stakingTokenMintingAction,
  poolInstanceAcquiringAction,
  lpTokenInstanceAcquiringAction,
  rewardsDuration
) => {

  let pool;
  let lpToken;
  let owner;
  let alice;
  let zoinks;
  let btcSnacks;
  let ethSnacks;
  let snacks;
  let busd;
  let btc;
  let eth;
  let seniorage;

  beforeEach(async () => {
    [ owner, alice ] = await ethers.getSigners();

    busd = await ethers.getContractAt(
      "MockToken",
      (await deployments.get("BUSD")).address
    );
    eth = await ethers.getContractAt(
      "MockToken",
      (await deployments.get("ETH")).address
    );
    btc = await ethers.getContractAt(
      "MockToken",
      (await deployments.get("BTC")).address
    );
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
    seniorage = await ethers.getContractAt(
      "Seniorage",
      (await deployments.get("Seniorage")).address
    );
  });

  const expectsForBalancesWithPenalty = async (
    zoinks,
    alice,
    zoinksPotentialReward,
    snacksPotentialReward,
    ethSnacksPotentialReward,
    btcSnacksPotentialReward,
    snacks,
    ethSnacks,
    btcSnacks,
    stakeAmount,
    stakingTokenIndex=(-1), // in the the rewards token could be equal to staking token, accounting it
  ) => {
    let aliceBalances = [
      await zoinks.balanceOf(alice.address),
      await snacks.balanceOf(alice.address),
      await ethSnacks.balanceOf(alice.address),
      await btcSnacks.balanceOf(alice.address)
    ]
    if (stakingTokenIndex >= 0) {
      aliceBalances[stakingTokenIndex] = aliceBalances[stakingTokenIndex].sub(
        stakeAmount
      );
    }

    const expects = [
      async () => expect(aliceBalances[0])
        .to.equal(zoinksPotentialReward),
      async () => expect(await zoinks.balanceOf(seniorage.address))
        .to.equal(zoinksPotentialReward.div(2)),
      async () => expect(aliceBalances[1])
        .to.equal(snacksPotentialReward.div(2)),
      async () => expect(await snacks.balanceOf(seniorage.address))
        .to.equal(snacksPotentialReward.div(2)),
      async () => expect(aliceBalances[2])
        .to.equal(ethSnacksPotentialReward.div(2)),
      async () => expect(await ethSnacks.balanceOf(seniorage.address))
        .to.equal(ethSnacksPotentialReward.div(2)),
      async () => expect(aliceBalances[3])
        .to.equal(btcSnacksPotentialReward.div(2)),
      async () => expect(await btcSnacks.balanceOf(seniorage.address))
          .to.equal(btcSnacksPotentialReward.div(2))
    ];
    for (let i = 0; i < expects.length; i++) {
      if (!disabledExpectsForBalancesWithPenalty.includes(i)) {
        await expects[i]();
      }
    }
  };

  const expectsForBalancesWithoutPenalty = async (
    zoinksBalanceAliceDiff,
    zoinksBalanceSeniorageDiff,
    snacksBalanceAliceDiff,
    snacksBalanceSeniorageDiff,
    ethSnacksBalanceAliceDiff,
    ethSnacksBalanceSeniorageDiff,
    btcSnacksBalanceAliceDiff,
    btcSnacksBalanceSeniorageDiff,
    zoinksPotentialReward,
    snacksPotentialReward,
    ethSnacksPotentialReward,
    btcSnacksPotentialReward,
    stakeAmount,
    stakingTokenIndex=(-1)
  ) => {
    let aliceBalancesDiffs = [
      zoinksBalanceAliceDiff,
      snacksBalanceAliceDiff,
      ethSnacksBalanceAliceDiff,
      btcSnacksBalanceAliceDiff
    ]
    if (stakingTokenIndex >= 0) {
      aliceBalancesDiffs[stakingTokenIndex] = aliceBalancesDiffs[stakingTokenIndex].sub(
        stakeAmount
      );
    }
    const expects = [
      () => expect(aliceBalancesDiffs[0]).to.equal(zoinksPotentialReward.sub(zoinksPotentialReward.div(10))),
      () => expect(zoinksBalanceSeniorageDiff).to.equal(zoinksPotentialReward.div(10)),
      () => expect(aliceBalancesDiffs[1]).to.equal(snacksPotentialReward.sub(snacksPotentialReward.div(10))),
      () => expect(snacksBalanceSeniorageDiff).to.equal(snacksPotentialReward.div(10)),
      () => expect(aliceBalancesDiffs[2]).to.equal(ethSnacksPotentialReward.sub(ethSnacksPotentialReward.div(10))),
      () => expect(ethSnacksBalanceSeniorageDiff).to.equal(ethSnacksPotentialReward.div(10)),
      () => expect(aliceBalancesDiffs[3]).to.equal(btcSnacksPotentialReward.sub(btcSnacksPotentialReward.div(10))),
      () => expect(btcSnacksBalanceSeniorageDiff).to.equal(btcSnacksPotentialReward.div(10))
    ];
    for (let i = 0; i < expects.length; i++) {
      if (!disabledExpectsForBalancesWithoutPenalty.includes(i)) {
        expects[i]();
      }
    }
  }

  const testRewardAcquiring = async (
    amountToTransfer,
    amountToStake,
    stakingTokenIndex,
    firstAction,
    secondAction
  ) => {
    await mintZoinksAndAllSnacks(deployments, owner, amountToTransfer);

    // Rewards transfer and notifications
    await zoinks.transfer(pool.address, amountToTransfer);
    await pool.notifyRewardAmount(zoinks.address, amountToTransfer);

    await snacks.transfer(pool.address, amountToTransfer);
    await pool.notifyRewardAmount(snacks.address, amountToTransfer);

    await ethSnacks.transfer(pool.address, amountToTransfer);
    await pool.notifyRewardAmount(ethSnacks.address, amountToTransfer);

    await btcSnacks.transfer(pool.address, amountToTransfer);
    await pool.notifyRewardAmount(btcSnacks.address, amountToTransfer);

    // Attempting to get reward without stake
    await pool.connect(alice).getReward();

    // Stake
    await stakingTokenMintingAction(alice.address, amountToStake, lpToken);
    await lpToken.connect(alice).approve(pool.address, amountToStake);
    await pool.connect(alice).stake(amountToStake);
    // Calculate rewards
    let zoinksPotentialReward = await pool.calculatePotentialReward(
      zoinks.address, alice.address, 1
    );
    let snacksPotentialReward = await pool.calculatePotentialReward(
      snacks.address, alice.address, 1
    );
    let ethSnacksPotentialReward = await pool.calculatePotentialReward(
      ethSnacks.address, alice.address, 1
    );
    let btcSnacksPotentialReward = await pool.calculatePotentialReward(
      btcSnacks.address, alice.address, 1
    );

    // Perform action
    await firstAction(pool, alice);

    // Check balances
    await expectsForBalancesWithPenalty(
      zoinks,
      alice,
      zoinksPotentialReward,
      snacksPotentialReward,
      ethSnacksPotentialReward,
      btcSnacksPotentialReward,
      snacks,
      ethSnacks,
      btcSnacks,
      amountToStake,
      stakingTokenIndex
    );

    // Clear reward tokens
    await zoinks.connect(alice)
      .transfer(owner.address, await zoinks.balanceOf(alice.address));
    await snacks.connect(alice)
      .transfer(owner.address, await snacks.balanceOf(alice.address));
    await ethSnacks.connect(alice)
      .transfer(owner.address, await ethSnacks.balanceOf(alice.address));
    await btcSnacks.connect(alice)
      .transfer(owner.address, await btcSnacks.balanceOf(alice.address));
    // 1 day passed
    await time.increase(86400);

    // Calculate rewards
    zoinksPotentialReward = await pool.earned(alice.address, zoinks.address);
    snacksPotentialReward = await pool.earned(alice.address, snacks.address);
    ethSnacksPotentialReward = await pool.earned(alice.address, ethSnacks.address);
    btcSnacksPotentialReward = await pool.earned(alice.address, btcSnacks.address);

    let zoinksBalanceAliceDiff = await zoinks.balanceOf(alice.address);
    let zoinksBalanceSeniorageDiff = await zoinks.balanceOf(seniorage.address);
    let snacksBalanceAliceDiff = await snacks.balanceOf(alice.address);
    let snacksBalanceSeniorageDiff = await snacks.balanceOf(seniorage.address);
    let ethSnacksBalanceAliceDiff = await ethSnacks.balanceOf(alice.address);
    let ethSnacksBalanceSeniorageDiff = await ethSnacks.balanceOf(seniorage.address);
    let btcSnacksBalanceAliceDiff = await btcSnacks.balanceOf(alice.address);
    let btcSnacksBalanceSeniorageDiff = await btcSnacks.balanceOf(seniorage.address);

    // Perform action
    await secondAction(pool, alice);

    zoinksBalanceAliceDiff = (await zoinks.balanceOf(alice.address)).sub(zoinksBalanceAliceDiff);
    zoinksBalanceSeniorageDiff = (await zoinks.balanceOf(seniorage.address)).sub(zoinksBalanceSeniorageDiff);
    snacksBalanceAliceDiff = (await snacks.balanceOf(alice.address)).sub(snacksBalanceAliceDiff);
    snacksBalanceSeniorageDiff = (await snacks.balanceOf(seniorage.address)).sub(snacksBalanceSeniorageDiff);
    ethSnacksBalanceAliceDiff = (await ethSnacks.balanceOf(alice.address)).sub(ethSnacksBalanceAliceDiff);
    ethSnacksBalanceSeniorageDiff = (await ethSnacks.balanceOf(seniorage.address)).sub(ethSnacksBalanceSeniorageDiff);
    btcSnacksBalanceAliceDiff = (await (btcSnacks.balanceOf(alice.address))).sub(btcSnacksBalanceAliceDiff);
    btcSnacksBalanceSeniorageDiff = (await btcSnacks.balanceOf(seniorage.address)).sub(btcSnacksBalanceSeniorageDiff);

    // Check balances
    await expectsForBalancesWithoutPenalty(
      zoinksBalanceAliceDiff,
      zoinksBalanceSeniorageDiff,
      snacksBalanceAliceDiff,
      snacksBalanceSeniorageDiff,
      ethSnacksBalanceAliceDiff,
      ethSnacksBalanceSeniorageDiff,
      btcSnacksBalanceAliceDiff,
      btcSnacksBalanceSeniorageDiff,
      zoinksPotentialReward,
      snacksPotentialReward,
      ethSnacksPotentialReward,
      btcSnacksPotentialReward,
      amountToStake,
      stakingTokenIndex
    );
  };

  const testCases = [
    () => it("Successful stake() execution", async () => {
        // Stake
        await expect(pool.stake(0)).to.be.revertedWith("MultipleRewardPool: can not stake 0");
        const amountToStake = ethers.utils.parseEther("100");
        await stakingTokenMintingAction(owner.address, amountToStake, lpToken);
        await lpToken.approve(pool.address, amountToStake);
        await pool.stake(amountToStake);
        // Balance check
        expect(await pool.getBalance(owner.address)).to.equal(amountToStake);
    }),

    () => it("Successful notifyRewardAmount() execution", async () => {
        const amountToStake = ethers.utils.parseEther("100");
        await stakingTokenMintingAction(owner.address, amountToStake, lpToken);

        await lpToken.approve(pool.address, amountToStake);
        await pool.stake(amountToStake);
        // Reward transfer
        const amountToTransfer = ethers.utils.parseEther("1000");
        await zoinks.transfer(pool.address, amountToTransfer);
        // Notify
        await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
        let block = await ethers.provider.getBlock();
        // Contract state check
        expect(await pool.rewardRates(zoinks.address)).to.equal(amountToTransfer.div(rewardsDuration));
        expect(await pool.lastUpdateTimePerToken(zoinks.address)).to.equal(block.timestamp);
        expect(await pool.periodFinishPerToken(zoinks.address)).to.equal(rewardsDuration.add(block.timestamp));
        const previousPeriodFinishPerToken = rewardsDuration.add(block.timestamp);
        const previousRewardRate = await pool.rewardRates(zoinks.address);
        // Reward transfer
        await zoinks.transfer(pool.address, amountToTransfer);
        // Notify
        await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
        block = await ethers.provider.getBlock();
        const remaining = previousPeriodFinishPerToken.sub(block.timestamp);
        const leftover = remaining.mul(previousRewardRate);
        // Contract state check
        expect(await pool.rewardRates(zoinks.address))
          .to.equal(amountToTransfer.add(leftover).div(rewardsDuration));
        expect(await pool.lastUpdateTimePerToken(zoinks.address))
          .to.equal(block.timestamp);
        expect(await pool.periodFinishPerToken(zoinks.address))
          .to.equal(rewardsDuration.add(block.timestamp));
        // 10 days passed
        await time.increase(864000);
        // Get reward from user
        await pool.getReward();
        // 10 days passed
        await time.increase(864000);
        // Get reward from user
        await pool.getReward();
        // 10 days passed
        await time.increase(864000);
        // Get reward from user
        await pool.getReward();
        // Big reward notification
        await expect(pool.notifyRewardAmount(zoinks.address, amountToTransfer.mul(1000)))
          .to.be.revertedWith("MultipleRewardPool: provided reward too high");
    }),

    () => it("Successful getReward() execution", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      const amountToStake = ethers.utils.parseEther("100");
      const action = async (pool, alice) => {
        await pool.connect(alice).getReward();
      };
      await testRewardAcquiring(
        amountToTransfer,
        amountToStake,
        -1, // disable accounting of the staked token
        action,
        action
      );
    }),

    () => it("Successful exit() execution", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      const amountToStake = ethers.utils.parseEther("100");
      await expect(pool.exit()).to.be.revertedWith("MultipleRewardPool: can not withdraw 0");
      let balanceBefore = await lpToken.balanceOf(alice.address);
      await testRewardAcquiring(
        amountToTransfer,
        amountToStake,
        stakingTokenIndex,
        async (pool, alice) => {
          await pool.connect(alice).exit();
        },
        async (pool, alice) => {
          await stakingTokenMintingAction(alice.address, amountToStake, lpToken);
          await lpToken.connect(alice).approve(pool.address, amountToStake);
          await pool.connect(alice).stake(amountToStake);
          await pool.connect(alice).exit();
        }
      );
      let expectedLpTokenBalance = balanceBefore.add(amountToStake);
      if (stakingTokenIndex === -1) {
        expectedLpTokenBalance = expectedLpTokenBalance.mul(2);
      }
      expect(await lpToken.balanceOf(alice.address)).to.equal(expectedLpTokenBalance);
    }),

    () => it("Successful withdraw() execution", async () => {
      // Require check
      await expect(pool.withdraw(0)).to.be.revertedWith("MultipleRewardPool: can not withdraw 0");
      // Stake
      const amountToStake = ethers.utils.parseEther("100");
      await stakingTokenMintingAction(owner.address, amountToStake, lpToken);
      await lpToken.approve(pool.address, amountToStake);
      await pool.stake(amountToStake);
      // Calculate balance before
      let balanceBefore = await lpToken.balanceOf(owner.address);
      await pool.withdraw(amountToStake);
      // Balance check
      expect(await lpToken.balanceOf(owner.address)).to.equal(balanceBefore.add(amountToStake));
    }),

    () => it("Successful lastTimeRewardApplicable() execution", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      await mintZoinksAndAllSnacks(deployments, owner, amountToTransfer);
      await zoinks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
      const block = await ethers.provider.getBlock();
      expect(await pool.lastTimeRewardApplicable(zoinks.address)).to.equal(block.timestamp);
      await time.increase(86400);
      expect(await pool.lastTimeRewardApplicable(zoinks.address)).to.equal(rewardsDuration.add(block.timestamp));
    }),

    () => it("Successful getRewardForDuration() execution", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      await mintZoinksAndAllSnacks(deployments, owner, amountToTransfer);
      await zoinks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
      const rewardForDuration = await pool.getRewardForDuration(zoinks.address);
      const rewardRate = await pool.rewardRates(zoinks.address);
      expect(rewardForDuration).to.equal(rewardRate.mul(rewardsDuration));
    }),

    () => it("Successful calculatePotentialReward() execution", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      await mintZoinksAndAllSnacks(deployments, owner, amountToTransfer);
      await zoinks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
      await snacks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(snacks.address, amountToTransfer);
      await ethSnacks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(ethSnacks.address, amountToTransfer);
      await btcSnacks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(btcSnacks.address, amountToTransfer);
      await pool.calculatePotentialReward(zoinks.address, owner.address, 86400);
      const amountToStake = ethers.utils.parseEther("100");
      await stakingTokenMintingAction(owner.address, amountToStake, lpToken);
      await lpToken.approve(pool.address, amountToStake);
      await pool.stake(amountToStake);
      await pool.calculatePotentialReward(zoinks.address, owner.address, 86400);
    }),

    () => it("Successful setPoolRewardDistributor() execution", async () => {
      await expect(pool.connect(alice)
        .setPoolRewardDistributor(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
      await pool.setPoolRewardDistributor(alice.address);
    }),

    () => it("Successful setSeniorage() execution", async () => {
      await expect(pool.connect(alice)
        .setSeniorage(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
      await pool.setSeniorage(alice.address);
    }),

    () => it("Successful setRewardsDuration() execution", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      await mintZoinksAndAllSnacks(deployments, owner, amountToTransfer);
      await zoinks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
      await snacks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(snacks.address, amountToTransfer);
      await ethSnacks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(ethSnacks.address, amountToTransfer);
      await btcSnacks.transfer(pool.address, amountToTransfer);
      await pool.notifyRewardAmount(btcSnacks.address, amountToTransfer);
      await expect(pool.setRewardsDuration(100))
        .to.be.revertedWith("MultipleRewardPool: duration cannot be changed now");
      await time.increase(86400);
      await pool.setRewardsDuration(100);
    }),

    () => it("Successful addRewardToken() execution", async () => {
      await expect(pool.addRewardToken(zoinks.address))
        .to.be.revertedWith("MultipleRewardPool: already contains");
      await pool.addRewardToken(alice.address);
    }),

    () => it("Successful removeRewardToken() execution", async () => {
      await expect(pool.removeRewardToken(alice.address))
        .to.be.revertedWith("MultipleRewardPool: token not found");
      await pool.removeRewardToken(zoinks.address);
    }),

    () => it("Successful getRewardToken() execution", async () => {
      expect(await pool.getRewardToken(2)).to.not.be.equal(ZERO_ADDRESS);
    }),

    () => it("Successful getRewardTokensCount() execution", async () => {
      expect(await pool.getRewardTokensCount()).to.be.equal(4);
    }),

    () => it("Successful onlyDistributor check", async () => {
      const amountToTransfer = ethers.utils.parseEther("1000");
      await mintZoinksAndAllSnacks(deployments, owner, amountToTransfer);
      await zoinks.transfer(pool.address, amountToTransfer);
      await expect(
        pool.connect(alice)
          .notifyRewardAmount(zoinks.address, amountToTransfer)
      ).to.be.revertedWith("MultipleRewardPool: caller is not the PoolRewardDistributor");
      await pool.notifyRewardAmount(zoinks.address, amountToTransfer);
    }),

    () => it("Successful onlyValidToken check", async () => {
      await expect(pool.calculatePotentialReward(
        alice.address, owner.address, 86400
      )).to.be.revertedWith("MultipleRewardPool: not a reward token");
      await pool.calculatePotentialReward(
        zoinks.address, owner.address, 86400
      );
    })

  ];

  for (let i = 0; i < testCases.length; i++) {
    if (disabledTestCaseIndicies.includes(i)) continue;
    testCases[i]();
  }
}
