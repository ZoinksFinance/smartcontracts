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
  let mockTokenDeployment = await deploy("MockToken", {
    from: deployer,
    args: [name, symbol, amount],
    log: true
  });
  await save(name, mockTokenDeployment);
  return await hre.ethers.getContractAt("MockToken", mockTokenDeployment.address);
}

const getMock = async (interface, artifactName, deploy, deployer, skipDeploymentIfAlreadyDeployed, save, prepareMocks) => {
  let mock = await deploy("MockContract", {
    from: deployer,
    log: true
  });
  await save(artifactName, mock);
  const result = await hre.ethers.getContractAt(interface, mock.address);
  mock = await hre.ethers.getContractAt("MockContract", mock.address);
  if (prepareMocks) {
    await prepareMocks(mock, result);
  }
  return result;
}

const mintNativeTokens = async (signer, amountHex) => {
  await hre.network.provider.send("hardhat_setBalance", [
    signer.address,
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
    "IRouter",
    (await deployments.get(routerArtifactName)).address
  );
  const routerMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get(routerArtifactName)).address
  );

  const swapExactTokensForTokensSelector = router.interface.encodeFunctionData(
      "swapExactTokensForTokens",
      [
        amount,
        ZERO,
        [
          (await deployments.get('BUSD')).address,
          (await deployments.get('Zoinks')).address
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
    "MockContract",
    (await deployments.get('PancakeSwapZoinksBusdPair')).address
  );
  const apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('ApeSwapZoinksBusdPair')).address
  );
  const biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('BiSwapZoinksBusdPair')).address
  );

  const pancakeZoinksBusdPair = await hre.ethers.getContractAt(
    "IPair",
    (await deployments.get('PancakeSwapZoinksBusdPair')).address
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
    "IPair",
    (await deployments.get('PancakeSwapZoinksBusdPair')).address
  );
  const getReservesSelector = pancakeZoinksBusdPair
    .interface.encodeFunctionData("getReserves");

  const pancakeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('PancakeSwapZoinksBusdPair')).address
  );
  const apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('ApeSwapZoinksBusdPair')).address
  );
  const biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('BiSwapZoinksBusdPair')).address
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
    "IRouter",
    (await deployments.get('PancakeSwapRouter')).address
  );
  const pancakeRouterMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('PancakeSwapRouter')).address
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
    "IFactory",
    (await deployments.get('PancakeSwapFactory')).address
  );
  const getPairSelector = pancakeFactory.interface.encodeFunctionData(
      "getPair",
      [
        ZERO_ADDRESS,
        ZERO_ADDRESS
      ]
    );
  const pancakeFactoryMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('PancakeSwapFactory')).address
  );
  const apeFactoryMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('ApeSwapFactory')).address
  );
  const biFactoryMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('BiSwapFactory')).address
  );

  const pancakeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('PancakeSwapZoinksBusdPair')).address
  );
  const apeZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('ApeSwapZoinksBusdPair')).address
  );
  const biZoinksBusdPairMockContract = await hre.ethers.getContractAt(
    "MockContract",
    (await deployments.get('BiSwapZoinksBusdPair')).address
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

const mintZoinksAndAllSnacks = async (deployments, owner, amountToMint, receiver) => {
  const busd = await hre.ethers.getContractAt(
    "MockToken",
    (await deployments.get('BUSD')).address
  );
  const eth = await hre.ethers.getContractAt(
    "MockToken",
    (await deployments.get('ETH')).address
  );
  const btc = await hre.ethers.getContractAt(
    "MockToken",
    (await deployments.get('BTC')).address
  );
  const zoinks = await hre.ethers.getContractAt(
    "Zoinks",
    (await deployments.get('Zoinks')).address
  );
  const snacks = await hre.ethers.getContractAt(
    "Snacks",
    (await deployments.get('Snacks')).address
  );
  const btcSnacks = await hre.ethers.getContractAt(
    "BtcSnacks",
    (await deployments.get('BtcSnacks')).address
  );
  const ethSnacks = await hre.ethers.getContractAt(
    "EthSnacks",
    (await deployments.get('EthSnacks')).address
  );

  await busd.mint(owner.address, amountToMint);
  await busd.approve(zoinks.address, amountToMint);
  await zoinks.mint(amountToMint);

  await busd.mint(owner.address, amountToMint);
  await busd.approve(zoinks.address, amountToMint);
  await zoinks.mint(amountToMint);
  await zoinks.approve(snacks.address, amountToMint);
  await snacks.mintWithPayTokenAmount(amountToMint);

  await eth.mint(owner.address, amountToMint);
  await eth.approve(ethSnacks.address, amountToMint);
  await ethSnacks.mintWithPayTokenAmount(amountToMint);

  await btc.mint(owner.address, amountToMint);
  await btc.approve(btcSnacks.address, amountToMint);
  await btcSnacks.mintWithPayTokenAmount(amountToMint);

  if (receiver) {
    await zoinks.transfer(receiver.address, amountToMint);
    await snacks.transfer(receiver.address, amountToMint);
    await ethSnacks.transfer(receiver.address, amountToMint);
    await btcSnacks.transfer(receiver.address, amountToMint);
  }
};

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
  mintZoinksAndAllSnacks
};
