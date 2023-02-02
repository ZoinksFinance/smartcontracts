const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, deployments, getNamedAccounts } = require("hardhat");
const {
  mockedResultOfSwap,
  ZERO_ADDRESS,
  ZERO,
  withImpersonatedSigner,
  mintNativeTokens,
  mockedReserve1,
  mockedReserve0,
  mockPrice1Cumulative
} = require("../deploy/helpers");

describe("Zoinks", () => {
  let deployer;
  let seniorage;
  let zoinks;
  let snacks;
  let averagePriceOracle;
  let pulse;
  let poolRewardDistributor;
  let busd;
  let router;
  let pancakePairAddress;
  let apePairAddress;
  let biPairAddress;

  beforeEach(async () => {
    await deployments.fixture(['zoinks_token_test_fixtures']);
    const namedAccounts = await getNamedAccounts();
    deployer = namedAccounts.deployer;
    zoinks = await ethers.getContractAt(
      'Zoinks',
      (await deployments.get('Zoinks')).address
    );
    busd = await ethers.getContractAt(
      'MockToken',
      (await deployments.get('BUSD')).address
    );
    router = await ethers.getContractAt(
      'IRouter',
      (await deployments.get('PancakeSwapRouter')).address
    );
    seniorage = await ethers.getContractAt(
      'Seniorage',
      (await deployments.get('Seniorage')).address
    );
    averagePriceOracle = await ethers.getContractAt(
      'AveragePriceOracle',
      (await deployments.get('AveragePriceOracle')).address
    );
    pulse = await ethers.getContractAt(
      'Pulse',
      (await deployments.get('Pulse')).address
    );
    snacks = await ethers.getContractAt(
      'Snacks',
      (await deployments.get('Snacks')).address
    );
    poolRewardDistributor = await ethers.getContractAt(
      'PoolRewardDistributor',
      (await deployments.get('PoolRewardDistributor')).address
    );
    pancakePairAddress = (await deployments.get('PancakeSwapZoinksBusdPair')).address;
    apePairAddress = (await deployments.get('ApeSwapZoinksBusdPair')).address;
    biPairAddress = (await deployments.get('BiSwapZoinksBusdPair')).address;
  });

  it("Successful mint() execution", async() => {
    // ZOINKS mint
    await expect(zoinks.mint(0)).to.be.revertedWith("Zoinks: invalid amount");
    const amountToMint = ethers.utils.parseEther("1");
    await expect(zoinks.mint(ethers.utils.parseEther("40000000000"))).to.be.revertedWith("Zoinks: max supply exceeded");
    const supplyBefore = await zoinks.totalSupply();
    const busdBalanceBefore = await busd.balanceOf(seniorage.address);
    await busd.approve(zoinks.address, amountToMint);
    const oldBalance = await zoinks.balanceOf(deployer);
    await zoinks.mint(amountToMint);
    // Total supply and balances check
    expect(await zoinks.totalSupply()).to.equal(supplyBefore.add(amountToMint));
    expect(await zoinks.balanceOf(deployer)).to.equal(oldBalance.add(amountToMint));
    expect(await busd.balanceOf(seniorage.address)).to.equal(busdBalanceBefore.add(amountToMint));
  });

  it("Successful swapOnZoinks() execution", async() => {
    // Swap
    await expect(zoinks.swapOnZoinks(0, 0, 0, 2)).to.be.revertedWith("Zoinks: invalid amount");
    await expect(zoinks.swapOnZoinks(100, 0, 0, 2)).to.be.revertedWith("Zoinks: invalid amountOutMin");
    await expect(zoinks.swapOnZoinks(100, 100, 0, 2)).to.be.revertedWith("Zoinks: invalid deadline");
    const balanceBefore = await zoinks.balanceOf(deployer);
    const amountToSwap = ethers.utils.parseEther("1");
    await busd.approve(zoinks.address, amountToSwap);
    const block = await ethers.provider.getBlock();
    // result of the swap is mocked in the fixture and equals to amountToSwap
    await expect(zoinks.swapOnZoinks(amountToSwap, amountToSwap, block.timestamp + 15, 2))
      .to.emit(zoinks, 'Swap', {
          sender: deployer,
          amountIn: amountToSwap,
          amountOut: mockedResultOfSwap
      });
  });

  it("Should fail applyTWAP() execution if max supply has been exceeded", async() => {
    const MAX_SUPPLY = await zoinks.MAX_SUPPLY();
    await busd.mint(deployer, MAX_SUPPLY);
    await busd.approve(zoinks.address, MAX_SUPPLY);
    await zoinks.mint(MAX_SUPPLY.sub(ethers.utils.parseEther('1')));
    await time.increase(3600 * 12);
    await expect(zoinks.applyTWAP())
      .to.be.revertedWith('Zoinks: max supply exceeded');
  });

  const applyTWAPTestCase = async (expectedInflationPercent, timeElapsed) => {
    await time.increase(timeElapsed);
    const buffer = await zoinks.buffer();
    const BASE_PERCENT = ethers.BigNumber.from('10000');

    let expectedInflationAmount = expectedInflationPercent.mul(await zoinks.totalSupply()).div(BASE_PERCENT.mul(buffer));

    const POOL_REWARD_DISTRIBUTOR_PERCENT = ethers.BigNumber.from('6500');
    const SENIORAGE_PERCENT =  ethers.BigNumber.from('2000');
    const BUY_SNACKS_PERCENT = ethers.BigNumber.from('1500');
    const ISOLATE_PERCENT = ethers.BigNumber.from('6667');
    const PULSE_PERCENT = ethers.BigNumber.from('3333');
    const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
    const MINT_FEE_PERCENT = ethers.BigNumber.from('500');

    const poolRewardDistributorExpectedBalanceInZoinks =
      expectedInflationAmount.mul(POOL_REWARD_DISTRIBUTOR_PERCENT).div(BASE_PERCENT);
    const seniorageExpectedBalanceInZoinks =
      expectedInflationAmount.mul(SENIORAGE_PERCENT).div(BASE_PERCENT);

    let expectedBuySnacksAmount = await snacks.calculateBuyTokenAmountOnMint(
      expectedInflationAmount.mul(BUY_SNACKS_PERCENT).div(BASE_PERCENT)
    );

    expectedBuySnacksAmount = expectedBuySnacksAmount.sub(expectedBuySnacksAmount.mul(MINT_FEE_PERCENT).div(BASE_PERCENT));
    const deadAddressExpectedBalanceInSnacks = expectedBuySnacksAmount.mul(ISOLATE_PERCENT).div(BASE_PERCENT);
    const pulseExpectedBalanceInSnacks = expectedBuySnacksAmount.mul(PULSE_PERCENT).div(BASE_PERCENT);

    await zoinks.applyTWAP();

    const zoinksTolerance = ethers.BigNumber.from('200000000000000'); // 0.0002 eth
    const snacksTolerance = ethers.BigNumber.from('150000000000000000'); // 0.15 eth

    expect(await zoinks.balanceOf(poolRewardDistributor.address)).to.be.closeTo(
      poolRewardDistributorExpectedBalanceInZoinks, zoinksTolerance
    );
    expect(await zoinks.balanceOf(seniorage.address)).to.be.closeTo(
      seniorageExpectedBalanceInZoinks, zoinksTolerance
    );
    expect(await snacks.balanceOf(DEAD_ADDRESS)).to.be.closeTo(
      deadAddressExpectedBalanceInSnacks, snacksTolerance
    );
    expect(await snacks.balanceOf(pulse.address)).to.be.closeTo(
      pulseExpectedBalanceInSnacks, snacksTolerance
    );
  }

  it("Successful applyTWAP() execution - with TWAP under limit", async () => {
    const Q112 = ethers.BigNumber.from("2").pow(112);
    const BASE_PERCENT = ethers.BigNumber.from("10000");
    const APE_SWAP_PERCENT = ethers.BigNumber.from("1500");
    const BI_SWAP_PERCENT = ethers.BigNumber.from("1500");
    const PANCAKE_SWAP_PERCENT = ethers.BigNumber.from("3500");
    const TWAP_PERCENT = ethers.BigNumber.from("6500");
    const RESOLUTION = ethers.BigNumber.from("1000000000000000000000000000000000000");

    const timeElapsed = 3600 * 12;

    const oldExpectedPrice1Cumulative =
      mockedReserve1.mul(Q112).div(mockedReserve0).mul(timeElapsed);

    // this magical number comes from resolution of system of inequations:
    // {0 < twap - 10000 < 1000; reserveDifference > 0; newExpectedPrice1Cumulative > 0;}
    // in condition that ALL of the variables except reserveDifference are CONSTANTS.
    const reserveDifference = ethers.utils.parseEther('2.6');

    const newExpectedPrice1Cumulative =
      mockedReserve1.add(reserveDifference).mul(Q112)
      .div(mockedReserve0.sub(reserveDifference))
      .mul(timeElapsed);

    await mockPrice1Cumulative(newExpectedPrice1Cumulative, deployments);

    let apeSwapAveragePrice =
      newExpectedPrice1Cumulative
      .sub(oldExpectedPrice1Cumulative)
      .mul(RESOLUTION)
      .div(timeElapsed)
      .div(Q112);

    let biSwapAveragePrice =
      newExpectedPrice1Cumulative
      .sub(oldExpectedPrice1Cumulative)
      .mul(RESOLUTION)
      .div(timeElapsed)
      .div(Q112);

    let pancakeSwapAveragePrice =
      newExpectedPrice1Cumulative
      .sub(oldExpectedPrice1Cumulative)
      .mul(RESOLUTION)
      .div(timeElapsed)
      .div(Q112);

    let twap =
        APE_SWAP_PERCENT.mul(apeSwapAveragePrice)
        .add(BI_SWAP_PERCENT.mul(biSwapAveragePrice))
        .add(PANCAKE_SWAP_PERCENT.mul(pancakeSwapAveragePrice))
        .mul(BASE_PERCENT)
        .div(TWAP_PERCENT)
        .div(RESOLUTION);

    const expectedInflationPercent = twap.sub(BASE_PERCENT);
    await applyTWAPTestCase(expectedInflationPercent, timeElapsed);
  });

  it("Successful applyTWAP() execution - with TWAP at limit", async () => {
    // reserves are already mocked so TWAP - 10000 > 1000
    const expectedInflationPercent = ethers.BigNumber.from('1000');
    await applyTWAPTestCase(expectedInflationPercent, 3600 * 12);
  });
});
