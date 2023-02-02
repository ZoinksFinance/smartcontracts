# Zoinks

Smart contracts for Zoinks.fi project

## ABI delivery

The CI/CD department should use command `yarn hardhat export-abi` instead of compilation stage.

You could also use command `yarn hardhat clear-abi` to clear the exported ABI files.

## Ethernal block explorer secret

The `.env` file should contain `ETHERNAL_WORKSPACE` key with value that represents the workspace name in the Ethernal.
You also obliged to have `ETHERNAL_EMAIL` and `ETHERNAL_PASSWORD` keys with email and password for the Ethernal server.

## MythX static analysis

The following commands and variables are used with lates installed version of MythX. See https://docs.mythx.io/.

To generate MythX static analysis report use command `yarn hardhat mythx`.

You have to have `MYTHX_API_KEY` key for an API key of the service. And you also have to have `MYTHX_MODE` key which values could be only: `standard`, `quick` and `deep`.
