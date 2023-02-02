const hre = require("hardhat");
const ethers = hre.ethers;
const { time } = require("@nomicfoundation/hardhat-network-helpers");

////////////////////////////////////////////
// Constants Starts
////////////////////////////////////////////

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO = ethers.BigNumber.from('0');
const mockedResultOfSwap = ethers.utils.parseEther("2");
const mockedLiquidity = ethers.utils.parseEther("1");
const mockedReserve0 = ethers.utils.parseEther("10");
const mockedReserve1 = ethers.utils.parseEther("20");
const skipDeploymentIfAlreadyDeployed = false;

////////////////////////////////////////////
// Constants Ends
////////////////////////////////////////////

const getMockToken = async (name, symbol, amount, deploy, deployer, skipDeploymentIfAlreadyDeployed, save) => {
  let mockTokenDeployment = await deploy(hre.names.internal.mockToken, {
    from: deployer,
    args: [name, symbol, amount],
    log: true
  });
  await save(name, mockTokenDeployment);
  return await hre.ethers.getContractAt(hre.names.internal.mockToken, mockTokenDeployment.address);
}

const getMock = async (interface, artifactName, deploy, deployer, skipDeploymentIfAlreadyDeployed, save, prepareMocks) => {
  let mock = await deploy(hre.names.internal.mockContract, {
    from: deployer,
    log: true
  });
  await save(artifactName, mock);
  const result = await hre.ethers.getContractAt(interface, mock.address);
  mock = await hre.ethers.getContractAt(hre.names.internal.mockContract, mock.address);
  if (prepareMocks) {
    await prepareMocks(mock, result);
  }
  return result;
}

const faucetBusdFromWhale = async (who, amount, busd) => {
  const impersonatedBusdWhale = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
  await withImpersonatedSigner(impersonatedBusdWhale, async (signer) => {
    await mintNativeTokens(signer.address, '0x10000000000000000000');
    await busd.connect(signer).transfer(who, amount);
  });
}

const mintNativeTokens = async (signer, amountHex) => {
  await hre.network.provider.send("hardhat_setBalance", [
    signer.address || signer,
    amountHex
  ]);
}

const getFakeDeployment = async (address, name, save) => {
  await save(name, {address});
}

const withImpersonatedSigner = async (signerAddress, action) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [signerAddress],
  });

  const impersonatedSigner = await hre.ethers.getSigner(signerAddress);
  await action(impersonatedSigner);

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [signerAddress],
  });
}

const mockSwaps = async (
  routerArtifactName,
  deployments,
  amount,
  deployer,
  mockResultOfSwap
) => {
  const block = await hre.ethers.provider.getBlock();

  const router = await hre.ethers.getContractAt(
    hre.names.internal.iRouter,
    (await deployments.get(routerArtifactName)).address
  );
  const routerMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(routerArtifactName)).address
  );

  const swapExactTokensForTokensSelector = router.interface.encodeFunctionData(
      "swapExactTokensForTokens",
      [
        amount,
        ZERO,
        [
          (await deployments.get(hre.names.external.tokens.busd)).address,
          (await deployments.get(hre.names.internal.zoinks)).address
        ],
        deployer,
        hre.ethers.BigNumber.from((block.timestamp + 15).toString())
      ]
    );

  await routerMockContract.givenMethodReturn(
    swapExactTokensForTokensSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint256[]'],
      [[0, mockResultOfSwap]]
    )
  );
};

const mockPrice1Cumulative = async (
  mockedPrice1Cumulative,
  deployments
) => {
  const pancakeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.pancake.pair)).address
  );
  const apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.ape.pair)).address
  );
  const biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.bi.pair)).address
  );

  const pancakeZoinksBusdPair = await hre.ethers.getContractAt(
    hre.names.internal.iPair,
    (await deployments.get(hre.names.external.pairs.pancake.pair)).address
  );
  const price1CumulativeLastSelector = pancakeZoinksBusdPair
    .interface.encodeFunctionData("price1CumulativeLast");

  await apeZoinksBusdPairMockContract.givenMethodReturn(
    price1CumulativeLastSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint256'],
      [mockedPrice1Cumulative]
    )
  );
  await biZoinksBusdPairMockContract.givenMethodReturn(
    price1CumulativeLastSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint256'],
      [mockedPrice1Cumulative]
    )
  );
  await pancakeZoinksBusdPairMockContract.givenMethodReturn(
    price1CumulativeLastSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint256'],
      [mockedPrice1Cumulative]
    )
  );
};

const mockReserves = async (
  mockReserve0,
  mockReserve1,
  deployments
) => {
  const currentTime = await time.latest();

  const pancakeZoinksBusdPair = await hre.ethers.getContractAt(
    hre.names.internal.iPair,
    (await deployments.get(hre.names.external.pairs.pancake.pair)).address
  );
  const getReservesSelector = pancakeZoinksBusdPair
    .interface.encodeFunctionData("getReserves");

  const pancakeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.pancake.pair)).address
  );
  const apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.ape.pair)).address
  );
  const biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.bi.pair)).address
  );

  await apeZoinksBusdPairMockContract.givenMethodReturn(
    getReservesSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint112', 'uint112', 'uint32'],
      [mockReserve0, mockReserve1, currentTime]
    )
  );
  await biZoinksBusdPairMockContract.givenMethodReturn(
    getReservesSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint112', 'uint112', 'uint32'],
      [mockReserve0, mockReserve1, currentTime]
    )
  );
  await pancakeZoinksBusdPairMockContract.givenMethodReturn(
    getReservesSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint112', 'uint112', 'uint32'],
      [mockReserve0, mockReserve1, currentTime]
    )
  );
};

const mockLiquidity = async (
  mockedAmount,
  deployments
) => {
  const pancakeRouter = await hre.ethers.getContractAt(
    hre.names.internal.iRouter,
    (await deployments.get(hre.names.external.routers.pancake)).address
  );
  const pancakeRouterMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.routers.pancake)).address
  );
  const addLiquiditySelector = pancakeRouter.interface.encodeFunctionData(
      "addLiquidity",
      [
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        ZERO,
        ZERO,
        ZERO,
        ZERO,
        ZERO_ADDRESS,
        ZERO
      ]
    );
  await pancakeRouterMockContract.givenMethodReturn(
    addLiquiditySelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256'],
      [0, 0, mockedAmount]
    )
  );
}

const mockGetPair = async (
  deployments
) => {
  const pancakeFactory = await hre.ethers.getContractAt(
    hre.names.internal.iFactory,
    (await deployments.get(hre.names.external.factories.pancake)).address
  );
  const getPairSelector = pancakeFactory.interface.encodeFunctionData(
      "getPair",
      [
        ZERO_ADDRESS,
        ZERO_ADDRESS
      ]
    );
  const pancakeFactoryMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.factories.pancake)).address
  );
  const apeFactoryMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.factories.ape)).address
  );
  const biFactoryMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.factories.bi)).address
  );

  const pancakeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.pancake.pair)).address
  );
  const apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.ape.pair)).address
  );
  const biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    hre.names.internal.mockContract,
    (await deployments.get(hre.names.external.pairs.bi.pair)).address
  );

  await pancakeFactoryMockContract.givenMethodReturn(
    getPairSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['address'],
      [pancakeZoinksBusdPairMockContract.address]
    )
  );
  await apeFactoryMockContract.givenMethodReturn(
    getPairSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['address'],
      [apeZoinksBusdPairMockContract.address]
    )
  );
  await biFactoryMockContract.givenMethodReturn(
    getPairSelector,
    hre.ethers.utils.defaultAbiCoder.encode(
      ['address'],
      [biZoinksBusdPairMockContract.address]
    )
  );
}

const mintZoinks = async (deployments, owner, amountToMint, receiver) => {
  const busd = await hre.ethers.getContractAt(
    hre.names.internal.mockToken,
    (await deployments.get(hre.names.external.tokens.busd)).address
  );
  const zoinks = await hre.ethers.getContractAt(
    hre.names.internal.zoinks,
    (await deployments.get(hre.names.internal.zoinks)).address
  );
  await busd.mint(owner.address, amountToMint);
  await busd.approve(zoinks.address, amountToMint);
  await zoinks.mint(amountToMint);
  if (receiver) {
    await zoinks.transfer(receiver.address, amountToMint);
  }
};

const mintZoinksAndAllSnacks = async (deployments, owner, amountToMintWithoutFee, receiver) => {
  const busd = await hre.ethers.getContractAt(
    hre.names.internal.mockToken,
    (await deployments.get(hre.names.external.tokens.busd)).address
  );
  const eth = await hre.ethers.getContractAt(
    hre.names.internal.mockToken,
    (await deployments.get(hre.names.external.tokens.eth)).address
  );
  const btc = await hre.ethers.getContractAt(
    hre.names.internal.mockToken,
    (await deployments.get(hre.names.external.tokens.btc)).address
  );
  const zoinks = await hre.ethers.getContractAt(
    hre.names.internal.zoinks,
    (await deployments.get(hre.names.internal.zoinks)).address
  );
  const snacks = await hre.ethers.getContractAt(
    hre.names.internal.snacks,
    (await deployments.get(hre.names.internal.snacks)).address
  );
  const btcSnacks = await hre.ethers.getContractAt(
    hre.names.internal.btcSnacks,
    (await deployments.get(hre.names.internal.btcSnacks)).address
  );
  const ethSnacks = await hre.ethers.getContractAt(
    hre.names.internal.ethSnacks,
    (await deployments.get(hre.names.internal.ethSnacks)).address
  );

  await busd.mint(owner.address, amountToMintWithoutFee);
  await busd.approve(zoinks.address, amountToMintWithoutFee);
  await zoinks.mint(amountToMintWithoutFee);

  const FEE_PERCENT = hre.ethers.BigNumber.from('500');
  const BASE_PERCENT = hre.ethers.BigNumber.from('10000');

  const amountToMint = amountToMintWithoutFee;
  const feeAmount = amountToMintWithoutFee.mul(FEE_PERCENT).div(BASE_PERCENT);

  await busd.mint(owner.address, amountToMint.add(feeAmount));
  await busd.approve(zoinks.address, amountToMint.add(feeAmount));
  await zoinks.mint(amountToMint.add(feeAmount));
  await zoinks.approve(snacks.address, amountToMint.add(feeAmount));
  await snacks.mintWithPayTokenAmount(amountToMint.add(feeAmount));

  await eth.mint(owner.address, amountToMint.add(feeAmount));
  await eth.approve(ethSnacks.address, amountToMint.add(feeAmount));
  await ethSnacks.mintWithPayTokenAmount(amountToMint.add(feeAmount));

  await btc.mint(owner.address, amountToMint.add(feeAmount));
  await btc.approve(btcSnacks.address, amountToMint.add(feeAmount));
  await btcSnacks.mintWithPayTokenAmount(amountToMint.add(feeAmount));

  if (receiver) {
    await zoinks.transfer(receiver.address, amountToMint);
    await snacks.transfer(receiver.address, amountToMint);
    await ethSnacks.transfer(receiver.address, amountToMint);
    await btcSnacks.transfer(receiver.address, amountToMint);
  }
};

const getLastBlockTimestamp = async (hre, network) => {
  if (network.name === 'hardhat') {
    return await time.latest();
  }
  const provider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks[network.name].url);
  return (await provider.getBlock(await provider.getBlockNumber())).timestamp;
};

const getNamedAccountsFromTenderly = async (hre, log) => {
  const provider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks.tenderly.url);
  const accounts = await provider.listAccounts();
  const defaultAccount = accounts[0];
  const result = {};
  for (const [key, value] of Object.entries(hre.config.namedAccounts)) {
    if (accounts[value]) {
      result[key] = accounts[value];
    } else {
      result[key] = defaultAccount;
      log(`WARNING: the value for '${key}' was not found in Tenderly provider under index '${value}', replacing by the default account!`);
    }
  }
  return result;
};

const emptyStage = (message) => 
  async ({deployments}) => {
      const {log} = deployments;
      log(message);
  };

const backendCall1224 = async (hre) => {
  let authority;

  let zoinks;
  let snacks;
  let btcSnacks;
  let ethSnacks;
  let seniorage;
  let pulse;
  let poolRewardDistributor;

  authority = (await hre.ethers.getSigners())[1];

  zoinks = await hre.ethers.getContractAt(
    hre.names.internal.zoinks,
    (await hre.deployments.get(hre.names.internal.zoinks)).address
  );
  snacks = await hre.ethers.getContractAt(
    hre.names.internal.snacks,
    (await hre.deployments.get(hre.names.internal.snacks)).address
  );
  btcSnacks = await hre.ethers.getContractAt(
    hre.names.internal.btcSnacks,
    (await hre.deployments.get(hre.names.internal.btcSnacks)).address
  );
  ethSnacks = await hre.ethers.getContractAt(
    hre.names.internal.ethSnacks,
    (await hre.deployments.get(hre.names.internal.ethSnacks)).address
  );
  seniorage = await hre.ethers.getContractAt(
    hre.names.internal.seniorage,
    (await hre.deployments.get(hre.names.internal.seniorage)).address
  );
  pulse = await hre.ethers.getContractAt(
    hre.names.internal.pulse,
    (await hre.deployments.get(hre.names.internal.pulse)).address
  );
  poolRewardDistributor = await hre.ethers.getContractAt(
    hre.names.internal.poolRewardDistributor,
    (await hre.deployments.get(hre.names.internal.poolRewardDistributor)).address
  );
  snacksPool = await hre.ethers.getContractAt(
    hre.names.internal.snacksPool,
    (await hre.deployments.get(hre.names.internal.snacksPool)).address
  );

  // ACT
  // 1. Zoinks - applyTWAP
  await zoinks.connect(authority).applyTWAP();
  // 2. BtcSnacks - distributeFee
  await btcSnacks.connect(authority).distributeFee();
  // 3. EthSnacks - distributeFee
  await ethSnacks.connect(authority).distributeFee();
  // 4. Snacks - distributeFee
  await snacks.connect(authority).distributeFee();
  // 5. Pulse - distributeBtcSnacksAndEthSnacks
  await pulse.connect(authority).distributeBtcSnacksAndEthSnacks();
  // 6. Seniorage - distributeNonBusdCurrencies
  await seniorage.connect(authority).distributeNonBusdCurrencies(0, 0, 0);
  // 7. Seniorage - distributeBusd
  await seniorage.connect(authority).distributeBusd(0, 0, 0, 0, 0);
  // 8. Pulse - harvest
  await pulse.connect(authority).harvest();
  // 9. Pulse - distributeSnacks
  await pulse.connect(authority).distributeSnacks();
  // 10. Pulse - distributeZoinks
  await pulse.connect(authority).distributeZoinks();
  // 11. PoolRewardDistributor - distributeRewards
  await poolRewardDistributor.connect(authority).distributeRewards();
  // 12. SnacksPool - deliverRewardsForAllLunchBoxParticipants
  let user;
  let totalRewardAmountForParticipantsInSnacks = ZERO;
  let totalRewardAmountForParticipantsInBtcSnacks = ZERO;
  let totalRewardAmountForParticipantsInEthSnacks = ZERO;
  for (let i = 0; i < await snacksPool.getLunchBoxParticipantsLength(); i++) {
    user = await snacksPool.getLunchBoxParticipantAt(i);
    totalRewardAmountForParticipantsInSnacks 
      = totalRewardAmountForParticipantsInSnacks.add(await snacksPool.earned(user, snacks.address));
    totalRewardAmountForParticipantsInBtcSnacks 
      = totalRewardAmountForParticipantsInBtcSnacks.add(await snacksPool.earned(user, btcSnacks.address));
    totalRewardAmountForParticipantsInEthSnacks 
      = totalRewardAmountForParticipantsInEthSnacks.add(await snacksPool.earned(user, ethSnacks.address));
  }
  await snacksPool.connect(authority).deliverRewardsForAllLunchBoxParticipants(
    totalRewardAmountForParticipantsInSnacks,
    totalRewardAmountForParticipantsInBtcSnacks,
    totalRewardAmountForParticipantsInEthSnacks,
    0,
    0,
    0
  );
}

module.exports = {
  getMockToken,
  getMock,
  skipDeploymentIfAlreadyDeployed,
  withImpersonatedSigner,
  mintNativeTokens,
  getFakeDeployment,
  mockedResultOfSwap,
  mockedLiquidity,
  ZERO_ADDRESS,
  ZERO,
  mockedReserve0,
  mockedReserve1,
  mockSwaps,
  mockPrice1Cumulative,
  mockReserves,
  mockLiquidity,
  mockGetPair,
  mintZoinksAndAllSnacks,
  faucetBusdFromWhale,
  mintZoinks,
  getLastBlockTimestamp,
  getNamedAccountsFromTenderly,
  emptyStage,
  backendCall1224
};
