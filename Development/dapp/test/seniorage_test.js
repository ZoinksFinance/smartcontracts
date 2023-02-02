const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, deployments } = hre;
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
  let situationalFundWallet;
  let seniorageWallet;

  let seniorage;
  let busd;
  let btc;
  let eth;
  let zoinks;
  let pulse;
  let snacks;
  let ethSnacks;
  let btcSnacks;
  let pair;

  let amountToTransfer = ethers.utils.parseEther("3333");

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
      situationalFundWallet,
      seniorageWallet,
      multisigWallet
    ] = await ethers.getSigners();

    seniorage = await ethers.getContractAt(
      hre.names.internal.seniorage,
      (await deployments.get(hre.names.internal.seniorage)).address
    );
    zoinks = await ethers.getContractAt(
      hre.names.internal.zoinks,
      (await deployments.get(hre.names.internal.zoinks)).address
    );
    busd = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.busd)).address
    );
    eth = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.eth)).address
    );
    btc = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.tokens.btc)).address
    );
    pulse = await ethers.getContractAt(
      hre.names.internal.pulse,
      (await deployments.get(hre.names.internal.pulse)).address
    );
    snacks = await ethers.getContractAt(
      hre.names.internal.snacks,
      (await deployments.get(hre.names.internal.snacks)).address
    );
    ethSnacks = await ethers.getContractAt(
      hre.names.internal.ethSnacks,
      (await deployments.get(hre.names.internal.ethSnacks)).address
    );
    btcSnacks = await ethers.getContractAt(
      hre.names.internal.btcSnacks,
      (await deployments.get(hre.names.internal.btcSnacks)).address
    );
    seniorage = await ethers.getContractAt(
      hre.names.internal.seniorage,
      (await deployments.get(hre.names.internal.seniorage)).address
    );
    pair = await ethers.getContractAt(
      hre.names.internal.mockToken,
      (await deployments.get(hre.names.external.pairs.pancake.lp)).address
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

  it("1. Successful distributeNonBusdCurrencies() execution", async () => {
    // ARRANGE. Fase 1 + 2
    // Transfer of all non BUSD tokens to seniorage in the amount of 3333 wei
    await btc.transfer(seniorage.address, amountToTransfer);
    await eth.transfer(seniorage.address, amountToTransfer);
    await zoinks.transfer(seniorage.address, amountToTransfer);
    await snacks.transfer(seniorage.address, amountToTransfer);
    await btcSnacks.transfer(seniorage.address, amountToTransfer);
    await ethSnacks.transfer(seniorage.address, amountToTransfer);
    // Mint Mock tokens to distribute BUSD in LunchBox (tokens swap return always mockedResultOfSwap)
    const lunchBoxAddress = (await deployments.get(hre.names.internal.lunchBox)).address;
    const busdToLuchBox = mockedResultOfSwap.mul(3); // zoinksBalance, btcBalance, ethBalance swaps

    // ACT. Fase 1
    // Distribution
    await expect(seniorage.connect(devWallet).distributeNonBusdCurrencies(0, 0, 0))
      .to.be.revertedWith("Seniorage: caller is not authorised");
    await busd.mint(lunchBoxAddress, busdToLuchBox);
    await seniorage.distributeNonBusdCurrencies(0, 0, 0);
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

    // ASSERT. Fase 1
    // Checking balances
    expect(await btc.balanceOf(bdmWallet.address), "Check BTC balance bdmWallet").to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(crmWallet.address), "Check BTC balance crmWallet").to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(devManagerWallet.address), "Check BTC balance devManagerWallet").to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(marketingManagerWallet.address), "Check BTC balance marketingManagerWallet").to.be.equal(fivePercentOfBalance);
    expect(await btc.balanceOf(devWallet.address), "Check BTC balance devWallet").to.be.equal(tenPercentOfBalance.add(leftover));
    expect(await btc.balanceOf(marketingFundWallet.address), "Check BTC balance marketingFundWallet").to.be.equal(twentyPercentOfBalance);
    expect(await btc.balanceOf(situationalFundWallet.address), "Check BTC balance situationalFundWallet").to.be.equal(fifteenPercentOfBalance);
    expect(await eth.balanceOf(bdmWallet.address), "Check ETH balance bdmWallet").to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(crmWallet.address), "Check ETH balance crmWallet").to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(devManagerWallet.address), "Check ETH balance devManagerWallet").to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(marketingManagerWallet.address), "Check ETH balance marketingManagerWallet").to.be.equal(fivePercentOfBalance);
    expect(await eth.balanceOf(devWallet.address), "Check ETH balance devWallet").to.be.equal(tenPercentOfBalance.add(leftover));
    expect(await eth.balanceOf(marketingFundWallet.address), "Check ETH balance marketingFundWallet").to.be.equal(twentyPercentOfBalance);
    expect(await eth.balanceOf(situationalFundWallet.address), "Check ETH balance situationalFundWallet").to.be.equal(fifteenPercentOfBalance);
    // ...
    // Checking balances on seniorage
    expect(await btc.balanceOf(seniorage.address), "Check BTC balance seniorage").to.be.equal(0);
    expect(await eth.balanceOf(seniorage.address), "Check ETH balance seniorage").to.be.equal(0);
    expect(await zoinks.balanceOf(seniorage.address), "Check Zoinks balance seniorage").to.be.equal(0);
    expect(await snacks.balanceOf(seniorage.address), "Check Snacks balance seniorage").to.be.equal(0);
    expect(await btcSnacks.balanceOf(seniorage.address), "Check BTCSnacks balance seniorage").to.be.equal(0);
    expect(await ethSnacks.balanceOf(seniorage.address), "Check ETHSnacks balance seniorage").to.be.equal(0);

    // ACT. Fase 2
    // Distribution on zero balances
    await busd.mint(lunchBoxAddress, busdToLuchBox);
    await seniorage.distributeNonBusdCurrencies(0, 0, 0);
    // Transfer some of non BUSD tokens to seniorage
    await btc.transfer(seniorage.address, amountToTransfer);
    await eth.transfer(seniorage.address, amountToTransfer);
    await zoinks.transfer(seniorage.address, amountToTransfer);

    // Distribution when some balances are not zero
    await busd.mint(lunchBoxAddress, busdToLuchBox);
    await seniorage.distributeNonBusdCurrencies(0, 0, 0);
    // Transfer of all non BUSD tokens to seniorage in the amount of 3333 tokens
    await btc.transfer(seniorage.address, amountToTransfer);
    await eth.transfer(seniorage.address, amountToTransfer);
    await zoinks.transfer(seniorage.address, amountToTransfer);
    await snacks.transfer(seniorage.address, amountToTransfer);
    await btcSnacks.transfer(seniorage.address, amountToTransfer);
    await ethSnacks.transfer(seniorage.address, amountToTransfer);
    // Distribution when dev wallet does not receive leftover
    await busd.mint(lunchBoxAddress, busdToLuchBox);
    await seniorage.distributeNonBusdCurrencies(0, 0, 0);

    // ASSERT. Fase 2
  });

  it('2. Test all rejections of the distributeBusd() execution', async () => {
    // ARRANGE
    const oldBalance = await busd.balanceOf(seniorage.address);

    // ACT
    // Attempt to distribute when balance is zero
    await busd.burn(seniorage.address, oldBalance);
    await seniorage.distributeBusd(
      ZERO, ZERO, ZERO, ZERO, ZERO
    );
    await busd.mint(seniorage.address, oldBalance);

    // ASSERT
    await expect(seniorage.connect(devWallet).distributeBusd(
      ZERO, ZERO, ZERO, ZERO, ZERO
    )).to.be.revertedWith("Seniorage: caller is not authorised");
  });

  describe('3. Variations of distributeBusd() execution', () => {
    // ARRANGE. Fase 1
    const taxPercentForBuy = 5;
    const senioragePercent = 5455;
    const pulsePercent = 4545;

    const seniorageBusdBalance = ethers.utils.parseEther("5000");

    const amountToSwapOnBTCorETH = seniorageBusdBalance.mul(550).div(10000);
    const amountToSwapOnZoinksToSendAway = seniorageBusdBalance.mul(300).div(10000);
    const amountToSwapOnZoinksToSupplyLiquidity = seniorageBusdBalance.mul(1500).div(10000);

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

    it("3.1. Successful distributeBusd() execution - check BtcSnacks and EthSnacks", async () => {
      // ARRANGE. Fase 2
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

      // ACT
      await seniorage.distributeBusd(
        ZERO, ZERO, ZERO, ZERO, ZERO
      );

      // ASSERT
      expect(await btcSnacks.balanceOf(seniorageWallet.address)).to.be.equal(anySnacksForSeniorageWallet);
      expect(await btcSnacks.balanceOf(pulse.address)).to.be.equal(anySnacksForPulse);
      expect(await ethSnacks.balanceOf(seniorageWallet.address)).to.be.equal(anySnacksForSeniorageWallet);
      expect(await ethSnacks.balanceOf(pulse.address)).to.be.equal(anySnacksForPulse);
    });

    it("3.2. Successful distributeBusd() execution - check Snacks distribution", async () => {
      // ARRANGE. Fase 2
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

      // ACT
      await seniorage.distributeBusd(
        ZERO, ZERO, ZERO, ZERO, ZERO
      );

      // ASSERT
      expect(await snacks.balanceOf(pulse.address)).to.be.equal(differenceForSnacks);
    });

    it("3.3. Successful distributeBusd() execution - check Snacks supplying liquidity", async () => {
      // ARRANGE. Fase 2
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

      // ACT
      await seniorage.distributeBusd(
        ZERO, ZERO, ZERO, ZERO, ZERO
      );

      // ASSERT
      expect(await pair.balanceOf(pulse.address)).to.be.equal(amountToSwapOnZoinksToSupplyLiquidity);
    });

    it("3.4. Successful distributeBusd() execution (insufficient amounts)", async () => {
      const insufficientAmount = 1000;
      const sufficientAmount = ethers.utils.parseEther("100");
      await pair.transfer(seniorage.address, ethers.utils.parseEther("1500"));
      // After each swap we get 1000 wei
      await mockSwaps(
        "PancakeSwapRouter",
        deployments,
        0,
        owner.address,
        insufficientAmount
      );
      await mockLiquidity(
        amountToSwapOnZoinksToSupplyLiquidity,
        deployments
      );
      // Distribution
      await seniorage.distributeBusd(0, 0, 0, 0, 0);
      // Check stored amounts
      expect(await seniorage.btcAmountStored()).to.equal(1000);
      expect(await seniorage.ethAmountStored()).to.equal(1000);
      expect(await seniorage.zoinksAmountStored()).to.equal(1000);
      // Transfer BTC/ETH/ZOINKS for mint
      await btc.transfer(seniorage.address, sufficientAmount.add(insufficientAmount));
      await eth.transfer(seniorage.address, sufficientAmount.add(insufficientAmount));
      await zoinks.transfer(seniorage.address, sufficientAmount.add(insufficientAmount));
      // After each swap we get 100e18 wei
      await mockSwaps(
        "PancakeSwapRouter",
        deployments,
        0,
        owner.address,
        sufficientAmount
      );
      await mockLiquidity(
        amountToSwapOnZoinksToSupplyLiquidity,
        deployments
      );
      // Distribution
      await seniorage.distributeBusd(0, 0, 0, 0, 0);
      // Check stored amounts
      expect(await seniorage.btcAmountStored()).to.equal(0);
      expect(await seniorage.ethAmountStored()).to.equal(0);
      expect(await seniorage.zoinksAmountStored()).to.equal(0);
    });
  });

  it("4. Successful configureCurrencies() execution", async () => {
    // ARRANGE

    // ACT
    await expect(seniorage.connect(devWallet).configureCurrencies(
      pair.address,
      zoinks.address,
      btc.address,
      eth.address,
      snacks.address,
      btcSnacks.address,
      ethSnacks.address
    )).to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.configureCurrencies(
      pair.address,
      zoinks.address,
      btc.address,
      eth.address,
      snacks.address,
      btcSnacks.address,
      ethSnacks.address
    );
    await seniorage.configureCurrencies(
      pair.address,
      btc.address,
      eth.address,
      zoinks.address,
      snacks.address,
      btcSnacks.address,
      ethSnacks.address
    );

    // ASSERT
  });

  it("5. Successful configureWallets() execution", async () => {
    // ARRANGE

    // ACT
    await expect(seniorage.connect(devWallet).configureWallets(
      ZERO_ADDRESS,
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
      seniorageWallet.address,
      multisigWallet.address
    );

    // ASSERT
  });

  it("6. Successful setAuthority() execution", async () => {
    // ARRANGE

    // ACT
    await expect(seniorage.connect(devWallet).setAuthority(owner.address))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.setAuthority(owner.address);

    // ASSERT
  });

  it("7. Successful setPulse() execution", async () => {
    // ARRANGE

    // ACT
    await expect(seniorage.connect(devWallet).setPulse(pulse.address))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await seniorage.setPulse(pulse.address);

    // ASSERT
  });

  it("8. Successful pause() execution", async () => {
    // Pause from not the owner
    await expect(seniorage.connect(devWallet).pause())
      .to.be.revertedWith("Ownable: caller is not the owner");
    // Pause from the owner
    await seniorage.pause();
    // Attempt to call
    await expect(seniorage.distributeNonBusdCurrencies(0, 0, 0)).to.be.revertedWith("Pausable: paused");
  });

  it("9. Successful unpause() execution", async () => {
    // Pause from not the owner
    await expect(seniorage.connect(devWallet).pause())
      .to.be.revertedWith("Ownable: caller is not the owner");
    // Pause from the owner
    await seniorage.pause();
    // Attempt to call
    await expect(seniorage.distributeNonBusdCurrencies(0, 0, 0)).to.be.revertedWith("Pausable: paused");
    // Unpause from not the owner
    await expect(seniorage.connect(devWallet).unpause())
      .to.be.revertedWith("Ownable: caller is not the owner");
    // Unpause from the owner
    await seniorage.unpause();
    // Attempt to call
    await seniorage.distributeNonBusdCurrencies(0, 0, 0);
  });
});
