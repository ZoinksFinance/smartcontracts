const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {
  ZERO,
  ZERO_ADDRESS,
  mockReserves,
  withImpersonatedSigner,
  mintNativeTokens
} = require('../deploy/helpers');

describe("AveragePriceOracle", () => {

  let zoinks;
  let averagePriceOracle;
  let pancakeZoinksBusdPairMockContract;
  let apeZoinksBusdPairMockContract;
  let biZoinksBusdPairMockContract;
  let pancakeZoinksBusdPair;

  let getReservesSelector;
  let apeSwapZoinksBusdPair;
  let biSwapZoinksBusdPair;
  let pancakeSwapZoinksBusdPair;

  const BASE_PERCENT = ethers.BigNumber.from("10000");
  const APE_SWAP_PERCENT = ethers.BigNumber.from("1500");
  const BI_SWAP_PERCENT = ethers.BigNumber.from("1500");
  const PANCAKE_SWAP_PERCENT = ethers.BigNumber.from("3500");
  const TWAP_PERCENT = ethers.BigNumber.from("6500");
  const RESOLUTION = ethers.BigNumber.from("1000000000000000000000000000000000000");

  const etherToMintForImpersonatedSigners = '0x10000000000000000000000';

  beforeEach(async () => {
    await deployments.fixture(['average_price_oracle_test_fixtures']);
    [owner, alice] = await ethers.getSigners();
    zoinks = await ethers.getContractAt(
      'Zoinks',
      (await deployments.get('Zoinks')).address
    );
    averagePriceOracle = await ethers.getContractAt(
      'AveragePriceOracle',
      (await deployments.get('AveragePriceOracle')).address
    );
    pancakeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
      "MockContract",
      (await deployments.get('PancakeSwapZoinksBusdPair')).address
    );
    apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
      "MockContract",
      (await deployments.get('ApeSwapZoinksBusdPair')).address
    );
    biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
      "MockContract",
      (await deployments.get('BiSwapZoinksBusdPair')).address
    );
    pancakeZoinksBusdPair = await hre.ethers.getContractAt(
      "IPair",
      (await deployments.get('PancakeSwapZoinksBusdPair')).address
    );
    getReservesSelector = pancakeZoinksBusdPair
      .interface.encodeFunctionData("getReserves");
    apeSwapZoinksBusdPair = (await deployments.get("ApeSwapZoinksBusdPair")).address;
    biSwapZoinksBusdPair = (await deployments.get("BiSwapZoinksBusdPair")).address;
    pancakeSwapZoinksBusdPair = (await deployments.get("PancakeSwapZoinksBusdPair")).address;
  });

  it('Should perform initialize properly', async () => {

    const currentTime = await time.latest();

    await mockReserves(ZERO, ZERO, deployments);

    await expect(averagePriceOracle.initialize(
      zoinks.address,
      apeSwapZoinksBusdPair,
      biSwapZoinksBusdPair,
      pancakeSwapZoinksBusdPair
    )).to.be.revertedWith("AveragePriceOracle: no reserves");

    await mockReserves(
      ethers.utils.parseEther('100'),
      ethers.utils.parseEther('200'),
      deployments
    );

    await averagePriceOracle.initialize(
      zoinks.address,
      apeSwapZoinksBusdPair,
      biSwapZoinksBusdPair,
      pancakeSwapZoinksBusdPair
    );

    await expect(averagePriceOracle.initialize(
      zoinks.address,
      apeSwapZoinksBusdPair,
      biSwapZoinksBusdPair,
      pancakeSwapZoinksBusdPair
    )).to.be.revertedWith("AveragePriceOracle: already initialized");
  });

  it("Successful update() execution", async () => {
    await averagePriceOracle.initialize(
      zoinks.address,
      apeSwapZoinksBusdPair,
      biSwapZoinksBusdPair,
      pancakeSwapZoinksBusdPair
    );
    await time.increase(43200);
    await withImpersonatedSigner(zoinks.address, async (impersonatedZoinksSigner) => {
      await mintNativeTokens(impersonatedZoinksSigner, etherToMintForImpersonatedSigners);
      await averagePriceOracle.connect(impersonatedZoinksSigner).update();
    });
    let apeSwapAveragePriceLast = await averagePriceOracle.apeSwapAveragePriceLast();
    let biSwapAveragePriceLast = await averagePriceOracle.biSwapAveragePriceLast();
    let pancakeSwapAveragePriceLast = await averagePriceOracle.pancakeSwapAveragePriceLast();
    let twapFromContract = await averagePriceOracle.twapLast();
    let twap =
        APE_SWAP_PERCENT.mul(apeSwapAveragePriceLast)
        .add(BI_SWAP_PERCENT.mul(biSwapAveragePriceLast))
        .add(PANCAKE_SWAP_PERCENT.mul(pancakeSwapAveragePriceLast))
        .mul(BASE_PERCENT)
        .div(TWAP_PERCENT)
        .div(RESOLUTION);
    expect(twapFromContract).to.be.equal(twap);
    // 100k
    let amountToSwap = ethers.utils.parseEther("100000");
    let amountOutMin = ethers.utils.parseEther("90000");
    // Swap
    block = await ethers.provider.getBlock();
    await zoinks.swapOnZoinks(
      amountToSwap,
      amountOutMin,
      block.timestamp + 100,
      2
    );
    await zoinks.swapOnZoinks(
      amountToSwap,
      amountOutMin,
      block.timestamp + 100,
      2
    );
    await zoinks.swapOnZoinks(
      amountToSwap,
      amountOutMin,
      block.timestamp + 100,
      2
    );
    await time.increase(43200);
    await withImpersonatedSigner(zoinks.address, async (impersonatedZoinksSigner) => {
      await mintNativeTokens(impersonatedZoinksSigner, etherToMintForImpersonatedSigners);
      await averagePriceOracle.connect(impersonatedZoinksSigner).update();
    });
    apeSwapAveragePriceLast = await averagePriceOracle.apeSwapAveragePriceLast();
    biSwapAveragePriceLast = await averagePriceOracle.biSwapAveragePriceLast();
    pancakeSwapAveragePriceLast = await averagePriceOracle.pancakeSwapAveragePriceLast();
    twapFromContract = await averagePriceOracle.twapLast();
    twap =
        APE_SWAP_PERCENT.mul(apeSwapAveragePriceLast)
        .add(BI_SWAP_PERCENT.mul(biSwapAveragePriceLast))
        .add(PANCAKE_SWAP_PERCENT.mul(pancakeSwapAveragePriceLast))
        .mul(BASE_PERCENT)
        .div(TWAP_PERCENT)
        .div(RESOLUTION);
    expect(twapFromContract).to.be.equal(twap);
    await time.increase(21600);
    amountToSwap = ethers.utils.parseEther("100000");
    amountOutMin = ethers.utils.parseEther("70000");
    // Swap
    block = await ethers.provider.getBlock();
    await zoinks.swapOnZoinks(
      amountToSwap,
      amountOutMin,
      block.timestamp + 100,
      2
    );
    await zoinks.swapOnZoinks(
      amountToSwap,
      amountOutMin,
      block.timestamp + 100,
      2
    );
    await zoinks.swapOnZoinks(
      amountToSwap,
      amountOutMin,
      block.timestamp + 100,
      2
    );
    await time.increase(21600);

    await withImpersonatedSigner(zoinks.address, async (impersonatedZoinksSigner) => {
      await mintNativeTokens(impersonatedZoinksSigner, etherToMintForImpersonatedSigners);
      await averagePriceOracle.connect(impersonatedZoinksSigner).update();
    });
    apeSwapAveragePriceLast = await averagePriceOracle.apeSwapAveragePriceLast();
    biSwapAveragePriceLast = await averagePriceOracle.biSwapAveragePriceLast();
    pancakeSwapAveragePriceLast = await averagePriceOracle.pancakeSwapAveragePriceLast();
    twapFromContract = await averagePriceOracle.twapLast();
    twap =
      APE_SWAP_PERCENT.mul(apeSwapAveragePriceLast)
      .add(BI_SWAP_PERCENT.mul(biSwapAveragePriceLast))
      .add(PANCAKE_SWAP_PERCENT.mul(pancakeSwapAveragePriceLast))
      .mul(BASE_PERCENT)
      .div(TWAP_PERCENT)
      .div(RESOLUTION);
    expect(twapFromContract).to.be.equal(twap);
  });
});
