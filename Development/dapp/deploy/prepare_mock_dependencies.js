const hre = require("hardhat");
const ethers = hre.ethers;

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy, save} = deployments;
  const {deployer} = await getNamedAccounts();
  const {
    skipDeploymentIfAlreadyDeployed,
    getMockToken,
    getMock,
    getFakeDeployment
  } = require('./helpers.js');

  const totalSupply = ethers.utils.parseEther('1000000');

  await getMockToken(
    "ETH",
    "ETH",
    totalSupply,
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMockToken(
    "BTC",
    "BTC",
    totalSupply,
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMockToken(
    "BUSD",
    "BUSD",
    totalSupply,
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMockToken(
    "PancakePairLP",
    "PLP",
    totalSupply,
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMockToken(
    "ApePairLP",
    "ALP",
    totalSupply,
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMockToken(
    "BiPairLP",
    "BLP",
    totalSupply,
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IRouter",
    "PancakeSwapRouter",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IRouter",
    "ApeSwapRouter",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IRouter",
    "BiSwapRouter",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IFactory",
    "PancakeSwapFactory",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IFactory",
    "ApeSwapFactory",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IFactory",
    "BiSwapFactory",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IPair",
    "ApeSwapZoinksBusdPair",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IPair",
    "BiSwapZoinksBusdPair",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );

  await getMock(
    "IPair",
    "PancakeSwapZoinksBusdPair",
    deploy,
    deployer,
    skipDeploymentIfAlreadyDeployed,
    save
  );
}
module.exports.tags = ["mock", "prepare_mock_dependencies"];
module.exports.runAtTheEnd = false;
