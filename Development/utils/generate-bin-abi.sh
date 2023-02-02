#!/bin/bash

DAPP_DIR='../dapp'
OUTPUT_DIR='./contracts/out'
DEPLOY_DIR='./contracts/artifacts'
SOLC_COMMAND='solcjs'
INCLUDE_PATH='node_modules/'

cd ${DAPP_DIR};
mkdir ${DEPLOY_DIR};

for i in ./contracts/*.sol;
    do
        name=$(basename $i .sol)
        echo Processing ${name} contract;
        ${SOLC_COMMAND} $i --bin --abi --optimize -o ${OUTPUT_DIR}  --base-path . --include-path ${INCLUDE_PATH};
        mv ${OUTPUT_DIR}/contracts_${name}_sol_${name}.abi ${DEPLOY_DIR}/${name}.abi
        mv ${OUTPUT_DIR}/contracts_${name}_sol_${name}.bin ${DEPLOY_DIR}/${name}.bin
    done
