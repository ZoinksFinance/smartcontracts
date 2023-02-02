import React, { Component } from "react";
import "./../App.css";

import { ethers } from "ethers";
import SnacksStakingPoolAbi from "../../abis/SnacksStakingPool.json";
import SnacksAbi from "../../abis/Snacks.json";
import { SnacksStakingPoolAddress, SnacksAddress } from "./../addresses.js";
import TransactionInfo from "./../common/TransactionInfo.js";
import BlockchainUtils from "./../common/BlockchainUtils.js";

class SnacksStakingPoolMVP extends Component {

    constructor(props) {
        super(props);
        this.utils = null;
        this.utilsSnacks = null;
        this.state = {
            // Blockchain connection
            provider: null,
            contract: null,
            contractWithSigner: null,

            // General
            loading: false,

            // Propierties from left side

            // Methods read only

            // Results (Methods read only)

            // Methods write
            deposit: null,
            updatePool: null,
            withdraw: null,
            emergencyWithdraw: null,

            // Results (Methods write)

            // deposit
            depositSendTxTime: null,
            depositLastTransactionHash: null,
            depositLastTransactionConfirmed: null,
            // updatePool
            updatePoolSendTxTime: null,
            updatePoolLastTransactionHash: null,
            updatePoolLastTransactionConfirmed: null,
            // withdraw
            withdrawSendTxTime: null,
            withdrawLastTransactionHash: null,
            withdrawLastTransactionConfirmed: null,
            // emergencyWithdraw
            emergencyWithdrawSendTxTime: null,
            emergencyWithdrawLastTransactionHash: null,
            emergencyWithdrawLastTransactionConfirmed: null,
        };
    }

    componentDidMount() {
        try {
            // Runs after the first render() lifecycle
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(SnacksStakingPoolAddress, SnacksStakingPoolAbi.abi, provider);

                // Get signer & contract for next calls
                const contractWithSigner = new ethers.Contract(SnacksStakingPoolAddress, SnacksStakingPoolAbi.abi, provider.getSigner());
                const contractZoinksWithSigner = new ethers.Contract(SnacksAddress, SnacksAbi.abi, provider.getSigner());

                this.setState({
                    provider: provider,
                    contract: contract,
                    contractWithSigner: contractWithSigner
                });

                this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing, true, this, provider);
                this.utilsSnacks = new BlockchainUtils(contractZoinksWithSigner, null, this.transactionProcessing, false, this, provider);
            } else {
                const msgError1 = "Please install MetaMask";
                console.error(msgError1)
                alert(msgError1);
            }
        } catch (error) {
            const msgError2 = `Error in SnacksStakingPool componentDidMount: ${error}`;
            console.error(msgError2)
            alert(msgError2);
        }
    }

    // ! Processing part
    // Set tx state values and wait for confirmations
    async transactionProcessing(method, tx) {
        this.setState({ [method + "LastTransactionConfirmed"]: 0 });
        this.setState({
            [method + "SendTxTime"]: tx.timestamp ?? "-",
            [method + "LastTransactionHash"]: tx.hash ?? "Error"
        });
        return new Promise((resolve) => {
            this.state.provider.on(tx.hash, (transactionReceipt) => {
                this.setState({ [method + "LastTransactionConfirmed"]: transactionReceipt.confirmations });
                if (transactionReceipt.confirmations <= 12) {
                    this.setState({
                        [method + "LastTransactionHash"]: transactionReceipt.confirmations,
                    });
                } else {
                    this.state.provider.removeAllListeners();
                }
                resolve();
            });
        });
    }

    // Render de la DApp
    render() {
        return (
            <>
                <h2>SnacksStakingPool</h2>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    const _amount = this.utils.inputToBigNumber("deposit", event.target._amount.value);
                    // approve(address spender, uint256 amount)
                    const sender = SnacksStakingPoolAddress;
                    await this.utilsSnacks.methodSend("approve", sender, _amount);
                    // deposit(uint256 _amount)
                    this.utils.methodSend("deposit", _amount);

                }}>
                    <h3>Deposit</h3>

                    <label><strong>Amount</strong></label>
                    <input type="text" name="_amount" placeholder="Input ammount" /><br />

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.depositSendTxTime}
                        lastTransactionHash={this.state.depositLastTransactionHash}
                        lastTransactionConfirmed={this.state.depositLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // updatePool()
                    this.utils.methodSend("updatePool");
                }}>
                    <h3>Update pool</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.updatePoolSendTxTime}
                        lastTransactionHash={this.state.updatePoolLastTransactionHash}
                        lastTransactionConfirmed={this.state.updatePoolLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // withdraw()
                    this.utils.methodSend("withdraw");
                }}>
                    <h3>Withdraw</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.withdrawSendTxTime}
                        lastTransactionHash={this.state.withdrawLastTransactionHash}
                        lastTransactionConfirmed={this.state.withdrawLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // emergencyWithdraw()
                    this.utils.methodSend("emergencyWithdraw");
                }}>
                    <h3>Emergency withdraw</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.emergencyWithdrawSendTxTime}
                        lastTransactionHash={this.state.emergencyWithdrawLastTransactionHash}
                        lastTransactionConfirmed={this.state.emergencyWithdrawLastTransactionConfirmed} />
                </form>
            </>
        );
    }
}

export default SnacksStakingPoolMVP;