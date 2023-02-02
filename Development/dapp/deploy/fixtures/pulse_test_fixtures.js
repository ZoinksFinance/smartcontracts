const hre = require('hardhat');
const {
  ZERO,
  mockedResultOfSwap,
  ZERO_ADDRESS,
  getFakeDeployment,
  mockedLiquidity,
  mockSwaps,
  mockLiquidity
} = require('../helpers');

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const {deploy, save, execute} = deployments;
  const {
    deployer,
    firstRewardReceiver,
    secondRewardReceiver
  } = await getNamedAccounts();

  const zoinks = await ethers.getContractAt(
    'Zoinks',
    (await deployments.get('Zoinks')).address
  );
  const busd = await ethers.getContractAt(
    'MockToken',
    (await deployments.get('BUSD')).address
  );
  const eth = await ethers.getContractAt(
    'MockToken',
    (await deployments.get('ETH')).address
  );
  const btc = await ethers.getContractAt(
    'MockToken',
    (await deployments.get('BTC')).address
  );
  const pancakeSwapPool = await ethers.getContractAt(
    'PancakeSwapPool',
    (await deployments.get('PancakeSwapPool')).address
  );
  const pulse = await ethers.getContractAt(
    'Pulse',
    (await deployments.get('Pulse')).address
  );
  const snacksPool = await ethers.getContractAt(
    'SnacksPool',
    (await deployments.get('SnacksPool')).address
  );

  const snacksAddress = (await deployments.get("Snacks")).address;
  const snacks = await ethers.getContractAt('Snacks', snacksAddress);

  const btcSnacksAddress = (await deployments.get("BtcSnacks")).address;
  const btcSnacks = await ethers.getContractAt('BtcSnacks', btcSnacksAddress);

  const ethSnacksAddress = (await deployments.get("EthSnacks")).address;
  const ethSnacks = await ethers.getContractAt('EthSnacks', ethSnacksAddress);

  const pairAddress = (await deployments.get("PancakePairLP")).address;
  
  const seniorageAddress = (await deployments.get("Seniorage")).address;

  const initialBalance = ethers.utils.parseEther("1000000000");

  await busd.mint(deployer, initialBalance);
  await btc.mint(deployer, initialBalance);
  await eth.mint(deployer, initialBalance);

  await busd.mint(deployer, initialBalance);
  await busd.approve(zoinks.address, initialBalance);
  await zoinks.mint(initialBalance);

  await pulse.configure(
      pairAddress,
      zoinks.address,
      snacks.address,
      btcSnacks.address,
      ethSnacks.address,
      pancakeSwapPool.address,
      snacksPool.address,
      seniorageAddress,
      deployer
  );

  // Snacks buying
  const amountToBuy = ethers.utils.parseEther("10000");
  const tokensToApprove = ethers.utils.parseEther("10000000");
  await zoinks.approve(snacks.address, tokensToApprove)
  await snacks.mintWithBuyTokenAmount(amountToBuy);

  // // BtcSnacks buying
  await btc.approve(btcSnacks.address, tokensToApprove);
  await btcSnacks.mintWithBuyTokenAmount(amountToBuy);

  // // BtcSnacks buying
  await eth.approve(ethSnacks.address, tokensToApprove);
  await ethSnacks.mintWithBuyTokenAmount(amountToBuy);

  await mockSwaps(
    'PancakeSwapRouter',
    deployments,
    ZERO,
    deployer,
    mockedResultOfSwap
  );

  await mockLiquidity(
    mockedLiquidity,
    deployments
  );

}
module.exports.tags = ["pulse_test_fixtures"];
module.exports.dependencies = ["debug"];
module.exports.runAtTheEnd = true;
