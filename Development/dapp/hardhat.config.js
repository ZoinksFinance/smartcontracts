require("dotenv").config();
require("hardhat-deploy");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-docgen");
if (process.env.ETHERNAL_ENABLE === "true") {
  require("hardhat-ethernal");
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});
task("ethernal_reset", "Resets the Ethernal Zoinks testnet Workspace", async (taskArgs, hre) => {
  await hre.ethernal.resetWorkspace(process.env.ETHERNAL_WORKSPACE);
});

require("./tasks/ping")(task);
require("./tasks/deliver_abi")(task);

const mainnetBscUrl = `https://bsc-mainnet.nodereal.io/v1/${process.env.MEGANODE_SECRET}`;
const mainnetBscChainId = 56;

extendEnvironment((hre) => {
    hre.ethernalSync = true;
    hre.ethernalWorkspace = process.env.ETHERNAL_WORKSPACE;
    hre.ethernalTrace = false;
    hre.ethernalResetOnStart = 'Hardhat';
    hre.ethernalUploadAst = true;
});

const DEFAULT_SETTING = {
    version: "0.8.15",
    settings: {
        optimizer: {
            enabled: true,
            runs: 200,
        }
    }
}

module.exports = {
  solidity: {
      compilers: [DEFAULT_SETTING]
  },
  networks: {
      hardhat: {
          forking: {
              url: mainnetBscUrl,
              chainId: mainnetBscChainId,
              blockNumber: 21034876
          },
          saveDeployments: true
      },
      mainnet: {
          url: mainnetBscUrl,
          chainId: mainnetBscChainId,
          accounts: {mnemonic: process.env.MNEMONIC},
          saveDeployments: true
      }
  },
  namedAccounts: {
      deployer: 0,
      snacks: 1,
      pulse: 2,
      seniorage: 3,
      authority: 4,
      recipient: 5
  },
  gasReporter: {
      enabled: process.env.REPORT_GAS === "true" ? true : false,
      currency: "USD"
  },
  etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY
  },
  verify: {
      etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY
      }
  },
  docgen: {
      path: './docs',
      clear: true,
      runOnCompile: process.env.DOCGEN === "true" ? true : false
  }
};
