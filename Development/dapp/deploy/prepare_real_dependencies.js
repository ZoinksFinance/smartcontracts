module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy, save, log} = deployments;
  const {deployer} = await getNamedAccounts();
  const {skipDeploymentIfAlreadyDeployed, getFakeDeployment} = require('./helpers.js');

  await getFakeDeployment(
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    "BTC",
    save,
    log
  );
  await getFakeDeployment(
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    "BUSD",
    save,
    log
  );
  await getFakeDeployment(
    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    "ETH",
    save,
    log
  );
  await getFakeDeployment(
    "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    "PancakeSwapRouter",
    save,
    log
  );
  await getFakeDeployment(
    "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
    "ApeSwapRouter",
    save,
    log
  );
  await getFakeDeployment(
    "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8",
    "BiSwapRouter",
    save,
    log
  );
  await getFakeDeployment(
    "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    "PancakeSwapFactory",
    save,
    log
  );
  await getFakeDeployment(
    "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
    "ApeSwapFactory",
    save,
    log
  );
  await getFakeDeployment(
    "0x858E3312ed3A876947EA49d572A7C42DE08af7EE",
    "BiSwapFactory",
    save,
    log
  );
}
module.exports.tags = ["real", "prepare_real_dependencies"];
module.exports.runAtTheEnd = false;
