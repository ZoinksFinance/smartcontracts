const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts } = require("hardhat");
const {
  mockedLiquidity,
  mockedResultOfSwap,
  ZERO_ADDRESS,
  ZERO,
  withImpersonatedSigner,
  mintNativeTokens
} = require("../deploy/helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Pulse", () => {

    let deployer;
    let bob;
    let seniorage;
    let busd;
    let btc;
    let eth;
    let zoinks;
    let snacksPool;
    let pulse;
    let router;
    let snacks;
    let ethSnacks;
    let btcSnacks;
    let pancakeSwapPool;
    let poolRewardDistributor;

    const amountToBuy = ethers.utils.parseEther("10000");
    const amountToTransfer = ethers.utils.parseEther('1000');

    beforeEach(async () => {
      await deployments.fixture(['pulse_test_fixtures']);
      [deployer, bob] = await ethers.getSigners();

      poolRewardDistributor = await ethers.getContractAt(
        'PoolRewardDistributor',
        (await deployments.get('PoolRewardDistributor')).address
      );
      seniorage = await ethers.getContractAt(
        'Seniorage',
        (await deployments.get('Seniorage')).address
      );
      zoinks = await ethers.getContractAt(
        'Zoinks',
        (await deployments.get('Zoinks')).address
      );
      pancakeSwapPool = await ethers.getContractAt(
        'PancakeSwapPool',
        (await deployments.get('PancakeSwapPool')).address
      );
      busd = await ethers.getContractAt(
        'MockToken',
        (await deployments.get('BUSD')).address
      );
      eth = await ethers.getContractAt(
        'MockToken',
        (await deployments.get('ETH')).address
      );
      btc = await ethers.getContractAt(
        'MockToken',
        (await deployments.get('BTC')).address
      );
      router = await ethers.getContractAt(
        'IRouter',
        (await deployments.get('PancakeSwapRouter')).address
      );
      pulse = await ethers.getContractAt(
        'Pulse',
        (await deployments.get('Pulse')).address
      );
      snacks = await ethers.getContractAt(
        'Snacks',
        (await deployments.get('Snacks')).address
      );
      ethSnacks = await ethers.getContractAt(
        'EthSnacks',
        (await deployments.get('EthSnacks')).address
      );
      btcSnacks = await ethers.getContractAt(
        'BtcSnacks',
        (await deployments.get('BtcSnacks')).address
      );
      snacksPool = await ethers.getContractAt(
        'SnacksPool',
        (await deployments.get('SnacksPool')).address
      );
      const pairLpToken = await ethers.getContractAt(
        'MockToken',
        (await deployments.get("PancakePairLP")).address
      );
      await pairLpToken.mint(pulse.address, mockedLiquidity);
    });

    it("Successful distributeSnacks() execution", async() => {
      await expect(pulse.connect(bob).distributeSnacks()).to
        .be.revertedWith("Pulse: caller is not authorised");
      await pulse.distributeSnacks();
      // Transfer 1000 SNACKS to pulse
      await snacks.transfer(pulse.address, amountToTransfer);
      // 100 SNACKS
      const redeemAmount = amountToTransfer.mul(10).div(100);
      // 10 SNACKS
      const redeemComission = redeemAmount.mul(10).div(100);
      // Calculate amount of ZOINKS after redeem
      const amountOfZoinks = await snacks.calculatePayTokenAmountOnRedeem(
        redeemAmount.sub(redeemComission)
      );
      await pulse.distributeSnacks();
      // Checking balances
      expect(await zoinks.balanceOf(pulse.address)).to.equal(amountOfZoinks);
    });

    it("Successful distrubuteZoinks() execution", async() => {
      // // Require check
      await pulse.distrubuteZoinks(
        ZERO,
        ZERO,
        ZERO
      );
      // // Transfer 1000 ZOINKS
      await zoinks.transfer(pulse.address, amountToTransfer);
      // // 10% ZOINKS of pulse balance
      const amountToOperate = amountToTransfer.mul(10).div(100);
      // // Calculate how much SNACKS pulse will receive on 100 ZOINKS
      const amountOfSnacks = await snacks.calculateBuyTokenAmountOnMint(amountToOperate);
      const fee = amountOfSnacks.mul(5).div(100);

      await pulse.distrubuteZoinks(
        mockedResultOfSwap,
        ZERO,
        ZERO
      );
      // Checking balances
      expect(await snacks.balanceOf(pulse.address)).to.be.equal(amountOfSnacks.sub(fee));
      expect(await pancakeSwapPool.getBalance(pulse.address)).to.be.equal(mockedLiquidity);
    });

    it("Successful harvest() execution", async() => {
      // Transfer 1000 ZOINKS
      await zoinks.transfer(pulse.address, amountToTransfer);
      // Transfer 1000 SNACKS to pulse
      await snacks.transfer(pulse.address, amountToTransfer);

      await pulse.distrubuteZoinks(
        mockedResultOfSwap,
        ZERO,
        ZERO
      );
      await pulse.distributeSnacks();

      // Transfer rewards
      await snacks.transfer(snacksPool.address, amountToTransfer);
      await ethSnacks.transfer(snacksPool.address, amountToTransfer);
      await btcSnacks.transfer(snacksPool.address, amountToTransfer);
      await snacks.transfer(pancakeSwapPool.address, amountToTransfer);
      await ethSnacks.transfer(pancakeSwapPool.address, amountToTransfer);
      await btcSnacks.transfer(pancakeSwapPool.address, amountToTransfer);

      await withImpersonatedSigner(poolRewardDistributor.address, async (distributorSigner) => {
        await mintNativeTokens(distributorSigner, '0x100000000000000000');
        await snacksPool.connect(distributorSigner).notifyRewardAmount(
          snacks.address,
          amountToTransfer
        );
        await snacksPool.connect(distributorSigner).notifyRewardAmount(
          ethSnacks.address,
          amountToTransfer
        );
        await snacksPool.connect(distributorSigner).notifyRewardAmount(
          btcSnacks.address,
          amountToTransfer
        );
        await pancakeSwapPool.connect(distributorSigner).notifyRewardAmount(
          snacks.address,
          amountToTransfer
        );
        await pancakeSwapPool.connect(distributorSigner).notifyRewardAmount(
          ethSnacks.address,
          amountToTransfer
        );
        await pancakeSwapPool.connect(distributorSigner).notifyRewardAmount(
          btcSnacks.address,
          amountToTransfer
        );
      });

      await time.increase(864000); // 10 days

      let expectedRewardFromSnacksPoolInSnacks = await snacksPool.earned(pulse.address, snacks.address);
      let expectedRewardFromPancakeSwapPoolInSnacks = await pancakeSwapPool.earned(pulse.address, snacks.address);
      let expectedRewardFromSnacksPoolInEthSnacks = await snacksPool.earned(pulse.address, ethSnacks.address);
      let expectedRewardFromPancakeSwapPoolInEthSnacks = await pancakeSwapPool.earned(pulse.address, ethSnacks.address);
      let expectedRewardFromSnacksPoolInBtcSnacks = await snacksPool.earned(pulse.address, btcSnacks.address);
      let expectedRewardFromPancakeSwapPoolInBtcSnacks = await pancakeSwapPool.earned(pulse.address, btcSnacks.address);

      // Harvest
      const oldSnacksBalance = await snacks.balanceOf(pulse.address);
      const oldEthSnacksBalance = await ethSnacks.balanceOf(pulse.address);
      const oldBtcSnacksBalance = await btcSnacks.balanceOf(pulse.address);

      await pulse.harvest();

      expect((await snacks.balanceOf(pulse.address)).sub(oldSnacksBalance)).to.be.equal(
        expectedRewardFromSnacksPoolInSnacks.add(expectedRewardFromPancakeSwapPoolInSnacks)
      );
      expect((await ethSnacks.balanceOf(pulse.address)).sub(oldEthSnacksBalance)).to.be.equal(
        expectedRewardFromSnacksPoolInEthSnacks.add(expectedRewardFromPancakeSwapPoolInEthSnacks)
      );
      expect((await btcSnacks.balanceOf(pulse.address)).sub(oldBtcSnacksBalance)).to.be.equal(
        expectedRewardFromSnacksPoolInBtcSnacks.add(expectedRewardFromPancakeSwapPoolInBtcSnacks)
      );
    });
});
