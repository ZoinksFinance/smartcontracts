const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts } = require("hardhat");
const {
  mockedResultOfSwap,
  mockedLiquidity,
  ZERO_ADDRESS,
  ZERO,
  mockSwaps,
  mockLiquidity
} = require("../deploy/helpers");

describe("Seniorage", () => {

  let owner;
  let bdmWallet;
  let crmWallet;
  let devManagerWallet;
  let marketingManagerWallet;
  let devWallet;
  let marketingFundWallet;
  let reservesWallet;
  let situationalFundWallet;
  let seniorageWallet;

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
  let pair;

  let amountToTransfer = ethers.utils.parseEther("3333");
  const btcSwapSlippagePercent = ethers.BigNumber.from('9000');
  const ethSwapSlippagePercent = ethers.BigNumber.from('9000');
  const zoinksSwapSlippagePercent = ethers.BigNumber.from('9000');
  const addLiquiditySlippagePercent = ethers.BigNumber.from('9000');

  beforeEach(async () => {
    await deployments.fixture(['seniorage_test_fixtures']);
    [
      owner,
      bdmWallet,
      crmWallet,
      devManagerWallet,
      marketingManagerWallet,
      devWallet,
      marketingFundWallet,
      reservesWallet,
      situationalFundWallet,
      seniorageWallet
    ] = await ethers.getSigners();

    seniorage = await ethers.getContractAt(
      'Seniorage',
      (await deployments.get('Seniorage')).address
    );
    zoinks = await ethers.getContractAt(
      'Zoinks',
      (await deployments.get('Zoinks')).address
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
    seniorage = await ethers.getContractAt(
      'Seniorage',
      (await deployments.get('Seniorage')).address
    );
    pair = await ethers.getContractAt(
      'MockToken',
      (await deployments.get('PancakePairLP')).address
    );

    const snacksToMint = amountToTransfer.mul(10);
    await busd.mint(owner.address, snacksToMint);
    await busd.approve(zoinks.address, snacksToMint);
    await zoinks.mint(snacksToMint);
    await zoinks.approve(snacks.address, snacksToMint);
    await snacks.mintWithPayTokenAmount(snacksToMint);

    const tokensToMint = amountToTransfer.mul(10);
    await busd.mint(owner.address, tokensToMint);
    await busd.approve(zoinks.address, tokensToMint);
    await zoinks.mint(tokensToMint);

    await btc.mint(owner.address, tokensToMint);
    await eth.mint(owner.address, tokensToMint);

    const ethSnacksToMint = amountToTransfer.mul(2);
    await eth.mint(owner.address, ethSnacksToMint);
    await eth.approve(ethSnacks.address, ethSnacksToMint);
    await ethSnacks.mintWithPayTokenAmount(ethSnacksToMint);

    const btcSnacksToMint = amountToTransfer.mul(2);
    await btc.mint(owner.address, btcSnacksToMint);
    await btc.approve(btcSnacks.address, btcSnacksToMint);
    await btcSnacks.mintWithPayTokenAmount(btcSnacksToMint);
  });

  it("Successful distributeNonBusdCurrencies() execution", async() => {
    // Transfer of all non BUSD tokens to seniorage in the amount of 3333 wei
    await btc.transfer(seniorage.address, amountToTransfer);
    await eth.transfer(seniorage.address, amountToTransfer);
    await zoinks.transfer(seniorage.address, amountToTransfer);
    await snacks.transfer(seniorage.address, amountToTransfer);
    await btcSnacks.transfer(seniorage.address, amountToTransfer);
    await ethSnacks.transfer(seniorage.address, amountToTransfer);

    // Distribution
    await expect(seniorage.connect(devWallet).distributeNonBusdCurrencies()).to.be.revertedWith("Seniorage: caller is not authorised");
    await seniorage.distributeNonBusdCurrencies();
    const fivePercentOfBalance = amountToTransfer.mul(5).div(100);
    const tenPercentOfBalance = amountToTransfer.mul(10).div(100);
    const fifteenPercentOfBalance = amountToTransfer.mul(15).div(100);
    const twentyPercentOfBalance = amountToTransfer.mul(20).div(100);
    const thirtyFivePercentOfBalance = amountToTransfer.mul(35).div(100);
    const leftover = amountToTransfer
    .sub(fivePercentOfBalance.mul(4))
    .sub(tenPercentOfBalance)
    .sub(fifteenPercentOfBalance)
    .sub(twentyPercentOfBalance)
    .sub(thirtyFivePercentOfBalance);
    // Checking balances
    expect(await btc.balanceOf(bdmWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(crmWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(devManagerWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(marketingManagerWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(devWallet.address)).to.be.equal(tenPercentOfBalance.add(leftover));
    expect(await btc.balanceOf(marketingFundWallet.address)).to.be.equal(twentyPercentOfBalance);
    expect(await btc.balanceOf(situationalFundWallet.address)).to.be.equal(fifteenPercentOfBalance);
    expect(await eth.balanceOf(bdmWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(crmWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(devManagerWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(marketingManagerWallet.address)).to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(devWallet.address)).to.be.equal(tenPercentOfBalance.add(leftover));
    expect(await eth.balanceOf(marketingFundWallet.address)).to.be.equal(twentyPercentOfBalance);
    expect(await eth.balanceOf(situationalFundWallet.address)).to.be.equal(fifteenPercentOfBalance);
    // ...
    // Checking balances on seniorage
    expect(await btc.balanceOf(seniorage.address)).to.be.equal(0);
    expect(await eth.balanceOf(seniorage.address)).to.be.equal(0);
    expect(await zoinks.balanceOf(seniorage.address)).to.be.equal(0);
    expect(await snacks.balanceOf(seniorage.address)).to.be.equal(0);
    expect(await btcSnacks.balanceOf(seniorage.address)).to.be.equal(0);
    expect(await ethSnacks.balanceOf(seniorage.address)).to.be.equal(0);
    // Distribution on zero balances
    await seniorage.distributeNonBusdCurrencies();
    // Transfer some of non BUSD tokens to seniorage
    await btc.transfer(seniorage.address, amountToTransfer);
    await eth.transfer(seniorage.address, amountToTransfer);
    await zoinks.transfer(seniorage.address, amountToTransfer);
    // Distribution when some balances are not zero
    await seniorage.distributeNonBusdCurrencies();
    // Transfer of all non BUSD tokens to seniorage in the amount of 3333 tokens
    await btc.transfer(seniorage.address, amountToTransfer);
    await eth.transfer(seniorage.address, amountToTransfer);
    await zoinks.transfer(seniorage.address, amountToTransfer);
    await snacks.transfer(seniorage.address, amountToTransfer);
    await btcSnacks.transfer(seniorage.address, amountToTransfer);
    await ethSnacks.transfer(seniorage.address, amountToTransfer);
    // Distribution when dev wallet does not receive leftover
    await seniorage.distributeNonBusdCurrencies();
  });

  it('Test all rejections of the distributeBusd() execution', async () => {
    const oldBalance = await busd.balanceOf(seniorage.address);
    // Attempt to distribute when balance is zero
    await busd.burn(seniorage.address, oldBalance);
    await seniorage.distributeBusd(
      ZERO, ZERO, ZERO, ZERO, ZERO, ZERO
    );
    await busd.mint(seniorage.address, oldBalance);

    await expect(seniorage.connect(devWallet).distributeBusd(
      ZERO, ZERO, ZERO, ZERO, ZERO, ZERO
    )).to.be.revertedWith("Seniorage: caller is not authorised");
  });

  describe('Variations of distributeBusd() execution', () => {
    const taxPercentForBuy = 5;
    const senioragePercent = 6667;
    const pulsePercent = 3333;

    const seniorageBusdBalance = ethers.utils.parseEther("5000");

    const amountToSwapOnBTCorETH = seniorageBusdBalance.mul(750).div(10000);
    const amountToSwapOnZoinksToSendAway = seniorageBusdBalance.mul(2000).div(10000);
    const amountToSwapOnZoinksToSupplyLiquidity = seniorageBusdBalance.mul(1500).div(10000);

    let router;
    let routerMockContract;
    let swapExactTokensForTokensSelector;
    let addLiquiditySelector;

    const prepareTokensForDistribution = async (
      _seniorageBusdBalance,
      _mockedLiquidity,
      _mockedResultOfSwap
    ) => {
      await busd.mint(seniorage.address, _seniorageBusdBalance);

      await pair.mint(seniorage.address, _mockedLiquidity);
      await eth.mint(seniorage.address, _mockedResultOfSwap);
      await btc.mint(seniorage.address, _mockedResultOfSwap);

      await busd.mint(owner.address, _mockedResultOfSwap);
      await busd.approve(zoinks.address, _mockedResultOfSwap);
      await zoinks.mint(_mockedResultOfSwap);
      await zoinks.transfer(seniorage.address, _mockedResultOfSwap);
    };

    it("Successful distributeBusd() execution - check BtcSnacks and EthSnacks", async() => {
      await prepareTokensForDistribution(
        seniorageBusdBalance,
        mockedLiquidity,
        amountToSwapOnBTCorETH
      );
      await mockSwaps(
        'PancakeSwapRouter',
        deployments,
        ZERO,
        owner.address,
        amountToSwapOnBTCorETH
      );
      await mockLiquidity(
        mockedLiquidity,
        deployments
      );

      const amountSnacksToMint = await btcSnacks.calculateBuyTokenAmountOnMint(amountToSwapOnBTCorETH);

      // the local variable is in distributeBusd function
      const differenceForEthAndBtcSnacks = amountSnacksToMint.sub(amountSnacksToMint.mul(taxPercentForBuy).div(100));

      const anySnacksForSeniorageWallet = differenceForEthAndBtcSnacks.mul(senioragePercent).div(10000);
      const anySnacksForPulse = differenceForEthAndBtcSnacks.mul(pulsePercent).div(10000);

      await seniorage.distributeBusd(
        ZERO, ZERO, ZERO, ZERO, ZERO, ZERO
      );
      expect(await btcSnacks.balanceOf(seniorageWallet.address)).to.be.equal(anySnacksForSeniorageWallet);
      expect(await btcSnacks.balanceOf(pulse.address)).to.be.equal(anySnacksForPulse);
      expect(await ethSnacks.balanceOf(seniorageWallet.address)).to.be.equal(anySnacksForSeniorageWallet);
      expect(await ethSnacks.balanceOf(pulse.address)).to.be.equal(anySnacksForPulse);
    });

    it("Successful distributeBusd() execution - check Snacks distribution", async() => {
      await prepareTokensForDistribution(
        seniorageBusdBalance,
        mockedLiquidity,
        amountToSwapOnZoinksToSendAway
      );
      await mockSwaps(
        'PancakeSwapRouter',
        deployments,
        ZERO,
        owner.address,
        amountToSwapOnZoinksToSendAway
      );
      await mockLiquidity(
        mockedLiquidity,
        deployments
      );
      const amountSnacksToMint = await snacks.calculateBuyTokenAmountOnMint(amountToSwapOnZoinksToSendAway);

      // the local variable is in distributeBusd function
      const differenceForSnacks = amountSnacksToMint.sub(amountSnacksToMint.mul(taxPercentForBuy).div(100));

      const snacksForSeniorageWallet = differenceForSnacks.mul(7500).div(10000);
      const snacksForPulse = differenceForSnacks.mul(2500).div(10000);

      await seniorage.distributeBusd(
        ZERO, ZERO, ZERO, ZERO, ZERO, ZERO
      );
      expect(await snacks.balanceOf(seniorageWallet.address)).to.be.equal(snacksForSeniorageWallet);
      expect(await snacks.balanceOf(pulse.address)).to.be.equal(snacksForPulse);
    });

    it("Successful distributeBusd() execution - check Snacks supplying liquidity", async() => {
      await prepareTokensForDistribution(
        seniorageBusdBalance,
        amountToSwapOnZoinksToSupplyLiquidity,
        amountToSwapOnZoinksToSupplyLiquidity
      );

      await mockSwaps(
        'PancakeSwapRouter',
        deployments,
        ZERO,
        owner.address,
        amountToSwapOnZoinksToSupplyLiquidity
      );
      await mockLiquidity(
        amountToSwapOnZoinksToSupplyLiquidity,
        deployments
      );
      await seniorage.distributeBusd(
        ZERO, ZERO, ZERO, ZERO, ZERO, ZERO
      );
      expect(await pair.balanceOf(pulse.address)).to.be.equal(amountToSwapOnZoinksToSupplyLiquidity);
    });
  });

  it("Successful configureCurrencies() execution", async() => {
    await expect(seniorage.connect(devWallet).configureCurrencies(
      pair.address,
      btc.address,
      eth.address,
      zoinks.address,
      snacks.address,
      btcSnacks.address,
      ethSnacks.address
    )).to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.configureCurrencies(
      pair.address,
      btc.address,
      eth.address,
      zoinks.address,
      snacks.address,
      btcSnacks.address,
      ethSnacks.address
    );
  });

  it("Successful configureWallets() execution", async() => {
    await expect(seniorage.connect(devWallet).configureWallets(
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS
    )).to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.configureWallets(
      bdmWallet.address,
      crmWallet.address,
      devManagerWallet.address,
      marketingManagerWallet.address,
      devWallet.address,
      marketingFundWallet.address,
      situationalFundWallet.address,
      seniorageWallet.address
    );
  });

  it("Successful setAuthority() execution", async() => {
    await expect(seniorage.connect(devWallet).setAuthority(owner.address)).to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.setAuthority(owner.address);
  });

  it("Successful setPulse() execution", async() => {
    await expect(seniorage.connect(devWallet).setPulse(pulse.address)).to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.setPulse(pulse.address);
  });
});
