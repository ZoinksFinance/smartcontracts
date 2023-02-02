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
    recipient
  } = await getNamedAccounts();

  const {
    ZERO,
    mockedResultOfSwap,
    mockSwaps,
  } = require('../helpers');

  const recipients = [recipient];
  const percents = [10000];

  await execute(
    'LunchBox',
    {from: deployer, log: true},
    'setRecipients',
    recipients,
    percents
  );

  await mockSwaps(
    'PancakeSwapRouter',
    deployments,
    ZERO,
    deployer,
    mockedResultOfSwap,
  );
}
module.exports.tags = ["lunch_box_test_fixtures"];
module.exports.dependencies = ["debug"];
module.exports.runAtTheEnd = true;