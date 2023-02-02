const hre = require('hardhat');
module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy, save, execute} = deployments;
  const {
    deployer,
    firstRewardReceiver,
    secondRewardReceiver
  } = await getNamedAccounts();
  const [
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

  const {
    ZERO,
    mockedResultOfSwap,
    mockSwaps,
  } = require('../helpers');

  await execute(
    'Seniorage',
    {from: deployer, log: true},
    'configureWallets',
    bdmWallet.address,
    crmWallet.address,
    devManagerWallet.address,
    marketingManagerWallet.address,
    devWallet.address,
    marketingFundWallet.address,
    situationalFundWallet.address,
    seniorageWallet.address
  );

  await execute(
    'Seniorage',
    {from: deployer, log: true},
    'configureCurrencies',
    (await deployments.get("PancakePairLP")).address,
    (await deployments.get('Zoinks')).address,
    (await deployments.get('BTC')).address,
    (await deployments.get('ETH')).address,
    (await deployments.get("Snacks")).address,
    (await deployments.get("BtcSnacks")).address,
    (await deployments.get("EthSnacks")).address
  );

  await execute(
    'Seniorage',
    {from: deployer, log: true},
    'setPulse',
    (await deployments.get("Pulse")).address
  );

  await execute(
    'Seniorage',
    {from: deployer, log: true},
    'setAuthority',
    deployer
  );

  await execute(
    'Seniorage',
    {from: deployer, log: true},
    'setLunchBox',
    (await deployments.get("LunchBox")).address
  );

  await mockSwaps(
    'PancakeSwapRouter',
    deployments,
    ZERO,
    deployer,
    mockedResultOfSwap,
  );

}
module.exports.tags = ["seniorage_test_fixtures"];
module.exports.dependencies = ["debug"];
module.exports.runAtTheEnd = true;
