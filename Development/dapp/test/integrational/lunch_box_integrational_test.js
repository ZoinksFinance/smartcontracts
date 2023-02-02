const {time} = require("@nomicfoundation/hardhat-network-helpers");
const {expect} = require("chai");
const hre = require("hardhat");
const {backendCall1224, mintZoinksAndAllSnacks} = require('../../deploy/helpers');

const {ethers, deployments, getNamedAccounts} = hre;

describe("LunchBox (integrational)", () => {
  let owner;
  let alice;
  let bob;
  let slowpoke;
  let charlie;

  let lunchBox;
  let busd;
  let zoinks;
  let btc;
  let eth;
  let snacks;
  let btcSnacks;
  let ethSnacks;
  let router;
  let snacksPool;
  let poolRewardDistributor;
  let averagePriceOracle;

  beforeEach(async () => {
    await deployments.fixture(['general_test_fixtures']);
    [owner, authority, bob, alice, slowpoke, charlie] = 
      await ethers.getSigners();
    
    lunchBox = await ethers.getContractAt(
      hre.names.internal.lunchBox, 
      (await deployments.get(hre.names.internal.lunchBox)).address
    );
    busd = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.busd)).address
    );
    zoinks = await ethers.getContractAt(
      hre.names.internal.zoinks,
      (await deployments.get(hre.names.internal.zoinks)).address
    );
    btc = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.btc)).address
    );
    eth = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.eth)).address
    );
    snacks = await ethers.getContractAt(
      hre.names.internal.snacks,
      (await deployments.get(hre.names.internal.snacks)).address
    );
    btcSnacks = await ethers.getContractAt(
      hre.names.internal.btcSnacks,
      (await deployments.get(hre.names.internal.btcSnacks)).address
    );
    ethSnacks = await ethers.getContractAt(
      hre.names.internal.ethSnacks,
      (await deployments.get(hre.names.internal.ethSnacks)).address
    );
    router = await ethers.getContractAt(
      hre.names.internal.iRouter,
      (await deployments.get(hre.names.external.routers.pancake)).address
    );
    seniorage = await ethers.getContractAt(
      hre.names.internal.seniorage,
      (await deployments.get(hre.names.internal.seniorage)).address
    );
    snacksPool = await ethers.getContractAt(
      hre.names.internal.snacksPool,
      (await deployments.get(hre.names.internal.snacksPool)).address
    );
    poolRewardDistributor = await ethers.getContractAt(
      hre.names.internal.poolRewardDistributor,
      (await deployments.get(hre.names.internal.poolRewardDistributor)).address
    );
  });

  it('should calculate distributed rewards successfully', async () => {
    const totalAmount = ethers.utils.parseEther('100');
    await mintZoinksAndAllSnacks(deployments, owner, totalAmount, alice);
    await mintZoinksAndAllSnacks(deployments, owner, totalAmount, bob);
    await mintZoinksAndAllSnacks(deployments, owner, totalAmount, slowpoke);
    await mintZoinksAndAllSnacks(deployments, owner, totalAmount, charlie);

    await snacks.connect(alice).approve(snacksPool.address, totalAmount);
    await snacksPool.connect(alice).stake(totalAmount);

    await snacks.connect(bob).approve(snacksPool.address, totalAmount);
    await snacksPool.connect(bob).stake(totalAmount);

    await snacks.connect(slowpoke).approve(snacksPool.address, totalAmount);
    await snacksPool.connect(slowpoke).stake(totalAmount);

    await snacks.connect(charlie).approve(snacksPool.address, totalAmount);
    await snacksPool.connect(charlie).stake(totalAmount);

    const lunchBoxTotalReward = ethers.utils.parseEther('1000');
    await busd.mint(poolRewardDistributor.address, lunchBoxTotalReward);

    await time.increase(43201); // 24 h
    await backendCall1224(hre);
    
    await snacksPool.connect(alice).activateLunchBox();
    await snacksPool.connect(bob).activateLunchBox();
    await snacksPool.connect(slowpoke).activateLunchBox();

    await time.increase(43200);

    /*console.log(ethers.utils.formatUnits(await lunchBox.earned(alice.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(bob.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(slowpoke.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(charlie.address)));
    console.log('---');*/

    await snacksPool.connect(alice).getReward();
    await snacksPool.connect(bob).getReward();
    await time.increase(43200);

    /*console.log(ethers.utils.formatUnits(await lunchBox.earned(alice.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(bob.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(slowpoke.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(charlie.address)));
    console.log('---');*/

    await busd.mint(poolRewardDistributor.address, lunchBoxTotalReward);
    await backendCall1224(hre);
    await snacksPool.connect(charlie).activateLunchBox();
    await time.increase(43200);

    /*console.log(ethers.utils.formatUnits(await lunchBox.earned(alice.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(bob.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(slowpoke.address)));
    console.log(ethers.utils.formatUnits(await lunchBox.earned(charlie.address)));
    console.log('---');*/
  });
});