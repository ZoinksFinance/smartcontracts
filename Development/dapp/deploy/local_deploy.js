const hre = require('hardhat');
module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {log} = deployments;
  log('Using empty stage...');
}
module.exports.tags = ["local_deploy"];
module.exports.dependencies = ["production", "sync"];
module.exports.runAtTheEnd = true;
