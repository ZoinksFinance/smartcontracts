#!/bin/bash

CONTRACTS_DIR='../dapp/contracts/'
REPORT_OUTPUT_DIR='../reports2/'
SURYA_COMMAND='npm run env -- surya mdreport'

mkdir ${REPORT_OUTPUT_DIR};

# for i in ../dapp/contracts/*.sol; do ${COMPOSE_COMMAND} ../reports2/$(basename $i .sol).md  $i; done

${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}ApeSwapPool.md ${CONTRACTS_DIR}base/SingleRewardPool.sol ${CONTRACTS_DIR}ApeSwapPool.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}BiSwapPool.md ${CONTRACTS_DIR}base/SingleRewardPool.sol ${CONTRACTS_DIR}BiSwapPool.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}BtcSnacks.md ${CONTRACTS_DIR}base/SnacksBase.sol ${CONTRACTS_DIR}BtcSnacks.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}EthSnacks.md ${CONTRACTS_DIR}base/SnacksBase.sol ${CONTRACTS_DIR}EthSnacks.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}PancakeSwapPool.md ${CONTRACTS_DIR}base/MultipleRewardPool.sol ${CONTRACTS_DIR}PancakeSwapPool.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}PoolRewardDistributor.md ${CONTRACTS_DIR}PoolRewardDistributor.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}Pulse.md ${CONTRACTS_DIR}Pulse.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}Seniorage.md ${CONTRACTS_DIR}Seniorage.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}LunchBox.md ${CONTRACTS_DIR}LunchBox.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}Snacks.md ${CONTRACTS_DIR}base/SnacksBase.sol ${CONTRACTS_DIR}Snacks.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}SnacksPool.md ${CONTRACTS_DIR}base/MultipleRewardPool.sol ${CONTRACTS_DIR}SnacksPool.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}Zoinks.md ${CONTRACTS_DIR}Zoinks.sol
${SURYA_COMMAND} ${REPORT_OUTPUT_DIR}AveragePriceOracle.md ${CONTRACTS_DIR}AveragePriceOracle.sol
