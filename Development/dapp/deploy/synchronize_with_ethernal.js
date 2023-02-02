const hre = require('hardhat');
module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { log } = deployments;

  const synchronizeWithEthernal = async (artifactName, contractAddress) => {
    await hre.ethernal.push({
        name: artifactName,
        address: contractAddress
    });
    log(`Synchronizing with ethernal: ${artifactName} - ${contractAddress}`);
  }

  await synchronizeWithEthernal(
    'AveragePriceOracle',
    (await deployments.get('AveragePriceOracle')).address
  );
  await synchronizeWithEthernal(
    'ApeSwapPool',
    (await deployments.get('ApeSwapPool')).address
  );
  await synchronizeWithEthernal(
    'BiSwapPool',
    (await deployments.get('BiSwapPool')).address
  );
  await synchronizeWithEthernal(
    'BtcSnacks',
    (await deployments.get('BtcSnacks')).address
  );
  await synchronizeWithEthernal(
    'EthSnacks',
    (await deployments.get('EthSnacks')).address
  );
  await synchronizeWithEthernal(
    'PancakeSwapPool',
    (await deployments.get('PancakeSwapPool')).address
  );
  await synchronizeWithEthernal(
    'PoolRewardDistributor',
    (await deployments.get('PoolRewardDistributor')).address
  );
  await synchronizeWithEthernal(
    'Pulse',
    (await deployments.get('Pulse')).address
  );
  await synchronizeWithEthernal(
    'Seniorage',
    (await deployments.get('Seniorage')).address
  );
  await synchronizeWithEthernal(
    'Snacks',
    (await deployments.get('Snacks')).address
  );
  await synchronizeWithEthernal(
    'SnacksPool',
    (await deployments.get('SnacksPool')).address
  );
  await synchronizeWithEthernal(
    'Zoinks',
    (await deployments.get('Zoinks')).address
  );
}
module.exports.tags = ["sync", "synchronize_with_ethernal"];
module.exports.dependencies = ["main"];
