const hre = require('hardhat');
module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {execute, log} = deployments;
  const {deployer, authority} = await getNamedAccounts();

  const busdAddress = (await deployments.get("BUSD")).address;
  const btcAddress = (await deployments.get("BTC")).address;
  const ethAddress = (await deployments.get("ETH")).address;

  // with LP suffix is MockToken instances in debug stage
  // and witout LP suffix is MockContract instances in debug stage
  // in the production stage either with or without LP suffix won't do the difference
  const pancakePairLpAddress = (await deployments.get("PancakePairLP")).address;
  const apePairLpAddress = (await deployments.get("ApePairLP")).address;
  const biPairLpAddress = (await deployments.get("BiPairLP")).address;
  const pancakePairAddress = (await deployments.get("PancakeSwapZoinksBusdPair")).address;
  const apePairAddress = (await deployments.get("ApeSwapZoinksBusdPair")).address;
  const biPairAddress = (await deployments.get("BiSwapZoinksBusdPair")).address;

  const zoinksTokenAddress = (await deployments.get("Zoinks")).address;
  const seniorageAddress = (await deployments.get("Seniorage")).address;
  const pulseAddress = (await deployments.get("Pulse")).address;
  const poolRewardDistributorAddress = (await deployments.get("PoolRewardDistributor")).address;
  const btcSnacksAddress = (await deployments.get("BtcSnacks")).address;
  const ethSnacksAddress = (await deployments.get("EthSnacks")).address;
  const snacksAddress = (await deployments.get("Snacks")).address;
  const snacksPoolAddress = (await deployments.get("SnacksPool")).address;
  const averagePriceOracleAddress = (await deployments.get("AveragePriceOracle")).address;
  const pancakeSwapPoolAddress = (await deployments.get("PancakeSwapPool")).address;
  const lunchBoxAddress = (await deployments.get("LunchBox")).address;

  await execute(
    'Zoinks',
    {from: deployer, log: true},
    'configure',
    deployer,
    seniorageAddress,
    pulseAddress,
    snacksAddress,
    poolRewardDistributorAddress,
    averagePriceOracleAddress
  );

  await execute(
    'PoolRewardDistributor',
    {from: deployer, log: true},
    'configure',
    busdAddress,
    zoinksTokenAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress,
    apePairLpAddress,
    biPairLpAddress,
    pancakePairLpAddress,
    snacksPoolAddress,
    lunchBoxAddress,
    seniorageAddress,
    authority
  );

  await execute(
    'Zoinks',
    {from: deployer, log: true},
    'setBuffer',
    ethers.BigNumber.from('5')
  );

  await execute(
    'Snacks',
    {from: deployer, log: true},
    'configure',
    zoinksTokenAddress,
    pulseAddress,
    poolRewardDistributorAddress,
    seniorageAddress,
    authority,
    btcSnacksAddress,
    ethSnacksAddress,
    snacksPoolAddress,
    pancakeSwapPoolAddress
  );

  await execute(
    'BtcSnacks',
    {from: deployer, log: true},
    'configure',
    btcAddress,
    pulseAddress,
    poolRewardDistributorAddress,
    seniorageAddress,
    authority,
    snacksAddress,
    snacksPoolAddress,
    pancakeSwapPoolAddress
  );

  await execute(
    'EthSnacks',
    {from: deployer, log: true},
    'configure',
    ethAddress,
    pulseAddress,
    poolRewardDistributorAddress,
    seniorageAddress,
    authority,
    snacksAddress,
    snacksPoolAddress,
    pancakeSwapPoolAddress
  );

  await execute(
    'LunchBox',
    {from: deployer, log: true},
    'configure',
    zoinksTokenAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress,
    snacksPoolAddress,
    poolRewardDistributorAddress,
    seniorageAddress
  );

  await execute(
    'SnacksPool',
    {from: deployer, log: true},
    'configure',
    lunchBoxAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress
  );
}
module.exports.tags = ["configure"];
