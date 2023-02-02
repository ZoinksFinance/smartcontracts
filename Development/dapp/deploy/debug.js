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
module.exports.tags = ["debug"];
module.exports.dependencies = ["mock", "main", "configure"];
module.exports.runAtTheEnd = true;
