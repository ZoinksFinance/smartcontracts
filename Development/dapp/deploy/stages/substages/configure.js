const hre = require('hardhat');
const {getNamedAccountsFromTenderly} = require('../../helpers.js');

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
  network
}) => {
  const {execute, log} = deployments;
  const {
    deployer, 
    authority,
    recipient,
    bdmWallet,
    crmWallet,
    devManagerWallet,
    marketingManagerWallet,
    devWallet,
    marketingFundWallet,
    situationalFundWallet,
    seniorageWallet,
    multisigWallet
  } = network.name === 'tenderly' ? await getNamedAccountsFromTenderly(hre, log) : await getNamedAccounts();

  const rewardsDuration = ethers.BigNumber.from("43200");

  const busdAddress = (await deployments.get(hre.names.external.tokens.busd)).address;
  const btcAddress = (await deployments.get(hre.names.external.tokens.btc)).address;
  const ethAddress = (await deployments.get(hre.names.external.tokens.eth)).address;

  // with LP suffix is MockToken instances in debug stage
  // and witout LP suffix is MockContract instances in debug stage
  // in the production stage either with or without LP suffix won't do the difference
  // every addresses per DEX are similar
  // 
  // const pancakePairAddress = (await deployments.get(hre.names.external.pairs.pancake.pair)).address;
  // const apePairAddress = (await deployments.get(hre.names.external.pairs.ape.pair)).address;
  // const biPairAddress = (await deployments.get(hre.names.external.pairs.bi.pair)).address;
  const pancakePairLpAddress = (await deployments.get(hre.names.external.pairs.pancake.lp)).address;
  const apePairLpAddress = (await deployments.get(hre.names.external.pairs.ape.lp)).address;
  const biPairLpAddress = (await deployments.get(hre.names.external.pairs.bi.lp)).address;

  const zoinksTokenAddress = (await deployments.get(hre.names.internal.zoinks)).address;
  const seniorageAddress = (await deployments.get(hre.names.internal.seniorage)).address;
  const pulseAddress = (await deployments.get(hre.names.internal.pulse)).address;
  const poolRewardDistributorAddress = (await deployments.get(hre.names.internal.poolRewardDistributor)).address;
  const btcSnacksAddress = (await deployments.get(hre.names.internal.btcSnacks)).address;
  const ethSnacksAddress = (await deployments.get(hre.names.internal.ethSnacks)).address;
  const snacksAddress = (await deployments.get(hre.names.internal.snacks)).address;
  const snacksPoolAddress = (await deployments.get(hre.names.internal.snacksPool)).address;
  const averagePriceOracleAddress = (await deployments.get(hre.names.internal.averagePriceOracle)).address;
  const pancakeSwapPoolAddress = (await deployments.get(hre.names.internal.pancakeSwapPool)).address;
  const lunchBoxAddress = (await deployments.get(hre.names.internal.lunchBox)).address;
  const apeSwapPoolAddress = (await deployments.get(hre.names.internal.apeSwapPool)).address;
  const biwapPoolAddress = (await deployments.get(hre.names.internal.biSwapPool)).address;

  await execute(
    hre.names.internal.zoinks,
    {from: deployer, log: true},
    'configure',
    authority,
    seniorageAddress,
    pulseAddress,
    snacksAddress,
    poolRewardDistributorAddress,
    averagePriceOracleAddress
  );

  await execute(
    hre.names.internal.poolRewardDistributor,
    {from: deployer, log: true},
    'configure',
    busdAddress,
    zoinksTokenAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress,
    apeSwapPoolAddress,
    biwapPoolAddress,
    pancakeSwapPoolAddress,
    snacksPoolAddress,
    lunchBoxAddress,
    seniorageAddress,
    authority
  );

  await execute(
    hre.names.internal.zoinks,
    {from: deployer, log: true},
    'setBuffer',
    ethers.BigNumber.from('5')
  );

  await execute(
    hre.names.internal.snacks,
    {from: deployer, log: true},
    'configure',
    zoinksTokenAddress,
    pulseAddress,
    poolRewardDistributorAddress,
    seniorageAddress,
    snacksPoolAddress,
    pancakeSwapPoolAddress,
    lunchBoxAddress,
    authority,
    btcSnacksAddress,
    ethSnacksAddress,
  );

  await execute(
    hre.names.internal.btcSnacks,
    {from: deployer, log: true},
    'configure',
    btcAddress,
    pulseAddress,
    poolRewardDistributorAddress,
    seniorageAddress,
    snacksPoolAddress,
    pancakeSwapPoolAddress,
    lunchBoxAddress,
    authority,
    snacksAddress
  );

  await execute(
    hre.names.internal.ethSnacks,
    {from: deployer, log: true},
    'configure',
    ethAddress,
    pulseAddress,
    poolRewardDistributorAddress,
    seniorageAddress,
    snacksPoolAddress,
    pancakeSwapPoolAddress,
    lunchBoxAddress,
    authority,
    snacksAddress
  );

  await execute(
    hre.names.internal.lunchBox,
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
    hre.names.internal.lunchBox,
    {from: deployer, log: true},
    'setRecipients',
    [recipient],
    [10000]
  );

  await execute(
    hre.names.internal.snacksPool,
    {from: deployer, log: true},
    'configure',
    lunchBoxAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress
  );

  await execute(
    hre.names.internal.snacksPool,
    {from: deployer, log: true},
    'setAuthority',
    authority
  );

  await execute(
    hre.names.internal.pulse,
    {from: deployer, log: true},
    'configure',
    pancakePairLpAddress,
    zoinksTokenAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress,
    pancakeSwapPoolAddress,
    snacksPoolAddress,
    seniorageAddress,
    authority
  );

  await execute(
    hre.names.internal.seniorage,
    {from: deployer, log: true},
    'configureCurrencies',
    pancakePairLpAddress,
    zoinksTokenAddress,
    btcAddress,
    ethAddress,
    snacksAddress,
    btcSnacksAddress,
    ethSnacksAddress
  );

  await execute(
    hre.names.internal.seniorage,
    {from: deployer, log: true},
    'setPulse',
    pulseAddress
  );

  await execute(
    hre.names.internal.seniorage,
    {from: deployer, log: true},
    'setLunchBox',
    lunchBoxAddress
  );

  await execute(
    hre.names.internal.seniorage,
    {from: deployer, log: true},
    'setAuthority',
    authority
  );

  await execute(
    hre.names.internal.seniorage,
    {from: deployer, log: true},
    'configureWallets',
    bdmWallet,
    crmWallet,
    devManagerWallet,
    marketingManagerWallet,
    devWallet,
    marketingFundWallet,
    situationalFundWallet,
    seniorageWallet,
    multisigWallet
  );
} 

module.exports.tags = ["configure"];
