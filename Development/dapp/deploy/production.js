const hre = require('hardhat');
module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {log} = deployments;
  log('Using empty stage...');

  // await execute(
  //   'AveragePriceOracle',
  //   {from: deployer, log: true},
  //   'initialize',
  //   zoinksTokenAddress,
  //   apePairAddress,
  //   biPairAddress,
  //   pancakePairAddress
  // );
}
module.exports.tags = ["production"];
module.exports.dependencies = ["real", "main", "configure"];
module.exports.runAtTheEnd = true;
