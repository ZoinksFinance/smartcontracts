const hre = require('hardhat');
const {
  ZERO,
  mockedResultOfSwap,
  mockedReserve0,
  mockedReserve1,
  mockSwaps,
  mockReserves,
  mockPrice1Cumulative
} = require('../helpers');
const { time } = require("@nomicfoundation/hardhat-network-helpers");

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy, save, execute} = deployments;
  const { deployer } = await getNamedAccounts();

  const busdAddress = (await deployments.get('BUSD')).address;
  const zoinksTokenAddress = (await deployments.get('Zoinks')).address;

  await execute(
    'BUSD',
    {from: deployer, log: true},
    'mint',
    deployer,
    hre.ethers.utils.parseEther("10000000000000")
  );

  const amount = hre.ethers.utils.parseEther("1");
  await execute(
    'BUSD',
    {from: deployer, log: true},
    'approve',
    (await deployments.get('Zoinks')).address,
    amount
  );

  await execute(
    'Zoinks',
    {from: deployer, log: true},
    'mint',
    amount
  );

  await execute(
    'BUSD',
    {from: deployer, log: true},
    'approve',
    (await deployments.get('PancakeSwapRouter')).address,
    amount
  );

  await execute(
    'Zoinks',
    {from: deployer, log: true},
    'approve',
    (await deployments.get('PancakeSwapRouter')).address,
    amount
  );

  await mockSwaps(
    'PancakeSwapRouter',
    deployments,
    amount,
    deployer,
    mockedResultOfSwap
  );
  await mockSwaps(
    'ApeSwapRouter',
    deployments,
    amount,
    deployer,
    mockedResultOfSwap
  );
  await mockSwaps(
    'BiSwapRouter',
    deployments,
    amount,
    deployer,
    mockedResultOfSwap
  );

  await mockReserves(
    mockedReserve0,
    mockedReserve1,
    deployments
  );

  // Mocked price of zoinks in busd cumulative =
  //    busdReserve / zoinksReserve * 12hours
  //      * (2^112)
  await mockPrice1Cumulative(
    mockedReserve1.div(mockedReserve0).mul(3600 * 12)
    .mul(
      ethers.BigNumber.from('2').pow(ethers.BigNumber.from('112'))
    ),
    deployments
  );

  await execute(
    'AveragePriceOracle',
    {from: deployer, log: true},
    'initialize',
    zoinksTokenAddress,
    (await deployments.get('ApeSwapZoinksBusdPair')).address,
    (await deployments.get('BiSwapZoinksBusdPair')).address,
    (await deployments.get('PancakeSwapZoinksBusdPair')).address
  );

  // new mocked reserves are: 5 ZOINKS, 25 BUSD
  await mockPrice1Cumulative(
    mockedReserve1.add(ethers.utils.parseEther('5'))
    .div(mockedReserve0.sub(ethers.utils.parseEther('5')))
    .mul(3600 * 12)
    .mul(
      ethers.BigNumber.from('2').pow(ethers.BigNumber.from('112'))
    ),
    deployments
  );
}
module.exports.tags = ["zoinks_token_test_fixtures"];
module.exports.dependencies = ["debug"];
module.exports.runAtTheEnd = true;
