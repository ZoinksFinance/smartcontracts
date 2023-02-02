const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require('hardhat');
const {ethers, deployments} = hre;
const {
  mockedReserve1,
  mockedReserve0,
  mockReserves,
  mockPrice1Cumulative
} = require("../deploy/helpers");

describe("Zoinks", () => {
  beforeEach(async () => {
    await deployments.fixture(['zoinks_test_fixtures']);
    [owner, authority] = await ethers.getSigners();
    zoinks = await ethers.getContractAt(
      hre.names.internal.zoinks,
      (await deployments.get(hre.names.internal.zoinks)).address
    );
    busd = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.busd)).address
    );
    seniorage = await ethers.getContractAt(
      hre.names.internal.seniorage,
      (await deployments.get(hre.names.internal.seniorage)).address
    );
    averagePriceOracle = await ethers.getContractAt(
      hre.names.internal.averagePriceOracle,
      (await deployments.get(hre.names.internal.averagePriceOracle)).address
    );
    pulse = await ethers.getContractAt(
      hre.names.internal.pulse,
      (await deployments.get(hre.names.internal.pulse)).address
    );
    snacks = await ethers.getContractAt(
      hre.names.internal.snacks,
      (await deployments.get(hre.names.internal.snacks)).address
    );
    poolRewardDistributor = await ethers.getContractAt(
      hre.names.internal.poolRewardDistributor,
      (await deployments.get(hre.names.internal.poolRewardDistributor)).address
    );
    pancakePairAddress = (await deployments.get(hre.names.external.pairs.pancake.pair)).address;
    apePairAddress = (await deployments.get(hre.names.external.pairs.ape.pair)).address;
    biPairAddress = (await deployments.get(hre.names.external.pairs.bi.pair)).address;
  });

  it("Successful configure() execution", async() => {
    await expect(
      zoinks.connect(authority).configure(
        authority.address,
        seniorage.address,
        pulse.address,
        snacks.address,
        poolRewardDistributor.address,
        averagePriceOracle.address
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await zoinks.configure(
      authority.address,
      seniorage.address,
      pulse.address,
      snacks.address,
      poolRewardDistributor.address,
      averagePriceOracle.address
    );
  });

  it("Successful mint() execution", async() => {
    // Mint 0
    await expect(zoinks.mint(0)).to.be.revertedWith("Zoinks: invalid amount");
    // Mint max supply
    const maxSupply = await zoinks.MAX_SUPPLY();
    await busd.mint(owner.address, maxSupply);
    await busd.approve(zoinks.address, maxSupply);
    await expect(zoinks.mint(maxSupply)).to.be.revertedWith("Zoinks: max supply exceeded");
    // Mint 1000
    const supplyBefore = await zoinks.totalSupply();
    const seniorageBalanceBefore = await busd.balanceOf(seniorage.address);
    const ownerBalanceBefore = await zoinks.balanceOf(owner.address);
    const amountToMint = ethers.utils.parseEther("1000");
    await busd.approve(zoinks.address, amountToMint);
    await zoinks.mint(amountToMint);
    // Total supply and balances check
    expect(await zoinks.totalSupply()).to.equal(supplyBefore.add(amountToMint));
    expect(await zoinks.balanceOf(owner.address)).to.equal(ownerBalanceBefore.add(amountToMint));
    expect(await busd.balanceOf(seniorage.address)).to.equal(seniorageBalanceBefore.add(amountToMint));
  });

  it("Successful applyTWAP() execution (max supply has been exceeded)", async() => {
    const MAX_SUPPLY = await zoinks.MAX_SUPPLY();
    await busd.mint(owner.address, MAX_SUPPLY);
    await busd.approve(zoinks.address, MAX_SUPPLY);
    await zoinks.mint(MAX_SUPPLY.sub(ethers.utils.parseEther('1')));
    await time.increase(3600 * 12);
    await expect(zoinks.applyTWAP())
      .to.be.revertedWith('Zoinks: caller is not authorised');
    await expect(zoinks.connect(authority).applyTWAP())
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
    await zoinks.connect(authority).applyTWAP();

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

  it("Successful applyTWAP() execution (TWAP under limit)", async () => {
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

  it("Successful applyTWAP() execution (TWAP above limit)", async () => {
    // reserves are already mocked so TWAP - 10000 > 1000
    const expectedInflationPercent = ethers.BigNumber.from('1000');
    await applyTWAPTestCase(expectedInflationPercent, 3600 * 12);
  });

  it("Successful applyTWAP() execution (no inflation)", async () => {
    const Q112 = ethers.BigNumber.from("2").pow(112);
    const timeElapsed = 43200;
    const cumulativePrice = Q112.mul(timeElapsed).mul(2);
    await mockPrice1Cumulative(cumulativePrice, deployments);
    await time.increase(timeElapsed);
    await zoinks.connect(authority).applyTWAP();
  });

  it("Successful applyTWAP() execution (insufficient amount on mint)", async () => {
    const timeElapsed = 43200;
    const Q112 = ethers.BigNumber.from("2").pow(112);
    const buffer = ethers.BigNumber.from("2000000000000000");
    const cumulativePrice = Q112.mul(timeElapsed).mul(10);
    await zoinks.setBuffer(buffer);
    await time.increase(timeElapsed);
    await zoinks.connect(authority).applyTWAP();
    expect(await zoinks.zoinksAmountStored()).to.equal(7);
    await mockPrice1Cumulative(cumulativePrice, deployments);
    await zoinks.setBuffer(5);
    await time.increase(timeElapsed);
    await zoinks.connect(authority).applyTWAP();
    expect(await zoinks.zoinksAmountStored()).to.equal(0);
  });

  it("Successful pause() execution", async () => {
    // Pause from not the owner
    await expect(zoinks.connect(authority).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    // Pause
    await zoinks.pause();
    // User's function is not available
    await busd.approve(zoinks.address, ethers.utils.parseEther("1"));
    await expect(zoinks.mint(ethers.utils.parseEther("1"))).to.be.revertedWith("Pausable: paused");
  });

  it("Successful unpause() execution", async () => {
    // Pause from the owner
    await zoinks.pause();
    // User's function is not available
    await busd.approve(zoinks.address, ethers.utils.parseEther("1"));
    await expect(zoinks.mint(ethers.utils.parseEther("1"))).to.be.revertedWith("Pausable: paused");
    // Unpause from not the owner
    await expect(zoinks.connect(authority).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    // Unpause from the owner
    await zoinks.unpause();
    // User's function becomes available
    await zoinks.mint(ethers.utils.parseEther("1"));
  });
});
