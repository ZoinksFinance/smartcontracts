const hre = require('hardhat');
const {skipDeploymentIfAlreadyDeployed} = require('./helpers.js');

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy, execute} = deployments;
  const {deployer, poolRewardDistributorAuthority} = await getNamedAccounts();

  const busdAddress = (await deployments.get("BUSD")).address;
  const btcAddress = (await deployments.get("BTC")).address;
  const ethAddress = (await deployments.get("ETH")).address;

  const pancakePairLpAddress = (await deployments.get("PancakePairLP")).address;
  const apePairLpAddress = (await deployments.get("ApePairLP")).address;
  const biPairLpAddress = (await deployments.get("BiPairLP")).address;

  const apeSwapRouterAddress = (await deployments.get("ApeSwapRouter")).address;
  const biSwapRouterAddress = (await deployments.get("BiSwapRouter")).address;
  const pancakeSwapRouterAddress = (await deployments.get("PancakeSwapRouter")).address;

  await deploy('Seniorage', {
    from: deployer,
    args: [busdAddress, pancakeSwapRouterAddress],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const seniorageAddress = (await deployments.get("Seniorage")).address;

  await deploy('AveragePriceOracle', {
    from: deployer,
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });

  await deploy('Zoinks', {
    from: deployer,
    args: [
      busdAddress,
      apeSwapRouterAddress,
      biSwapRouterAddress,
      pancakeSwapRouterAddress
    ],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const zoinksTokenAddress = (await deployments.get("Zoinks")).address;

  await deploy('Pulse', {
    from: deployer,
    args: [busdAddress, pancakeSwapRouterAddress],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const pulseAddress = (await deployments.get("Pulse")).address;

  await deploy('PoolRewardDistributor', {
    from: deployer,
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const poolRewardDistributorAddress = (
    await deployments.get("PoolRewardDistributor")
  ).address;

  await deploy('BtcSnacks', {
    from: deployer,
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const btcSnacksAddress = (await deployments.get("BtcSnacks")).address;

  await deploy('EthSnacks', {
    from: deployer,
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const ethSnacksAddress = (await deployments.get("EthSnacks")).address;

  await deploy('Snacks', {
    from: deployer,
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
  const snacksAddress = (await deployments.get("Snacks")).address;

  await deploy('SnacksPool', {
    from: deployer,
    args: [
      snacksAddress,
      poolRewardDistributorAddress,
      seniorageAddress,
      [
        snacksAddress,
        btcSnacksAddress,
        ethSnacksAddress
      ]
    ],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });

  await deploy('PancakeSwapPool', {
    from: deployer,
    args: [
      pancakePairLpAddress,
      poolRewardDistributorAddress,
      seniorageAddress,
      [
        zoinksTokenAddress,
        snacksAddress,
        btcSnacksAddress,
        ethSnacksAddress
      ]
    ],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });

  await deploy('ApeSwapPool', {
    from: deployer,
    args: [
      apePairLpAddress,
      zoinksTokenAddress,
      poolRewardDistributorAddress,
      seniorageAddress
    ],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });

  await deploy('BiSwapPool', {
    from: deployer,
    args: [
      biPairLpAddress,
      zoinksTokenAddress,
      poolRewardDistributorAddress,
      seniorageAddress
    ],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });

  await deploy('LunchBox', {
    from: deployer,
    args: [
      busdAddress,
      btcAddress,
      ethAddress,
      pancakeSwapRouterAddress
    ],
    skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
    log: true
  });
};
module.exports.tags = ["main"];
