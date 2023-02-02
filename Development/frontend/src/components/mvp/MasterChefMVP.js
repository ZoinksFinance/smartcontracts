import React, { Component } from 'react'
import './../App.css'

import { ethers } from "ethers";
import MasterChefAbi from "../../abis/MasterChef.json";
import BEP20Abi from "../../abis/BEP20.json";
import { MasterChefAddress, CakeTokenAddress, CakeLPTokenAddress } from "./../addresses.js";
import TransactionInfo from "./../common/TransactionInfo.js";
import BlockchainUtils from "./../common/BlockchainUtils.js";

class MasterChef extends Component {

    constructor(props) {
        super(props);
        this.utils = null;
        this.utilsCake = null;
        this.utilsCakeLP = null;
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
            massUpdatePools: null,
            withdraw: null,
            emergencyWithdraw: null,

            // Results (Methods write)

            // deposit
            depositSendTxTime: null,
            depositLastTransactionHash: null,
            depositLastTransactionConfirmed: null,
            // massUpdatePools
            massUpdatePoolsSendTxTime: null,
            massUpdatePoolsLastTransactionHash: null,
            massUpdatePoolsLastTransactionConfirmed: null,
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
                const contract = new ethers.Contract(MasterChefAddress, MasterChefAbi.abi, provider);

                // Get signer & contract for next calls
                const contractWithSigner = new ethers.Contract(MasterChefAddress, MasterChefAbi.abi, provider.getSigner());
                const contractCakeWithSigner = new ethers.Contract(CakeTokenAddress, BEP20Abi.abi, provider.getSigner());
                const contractCakeLPWithSigner = new ethers.Contract(CakeLPTokenAddress, BEP20Abi.abi, provider.getSigner());

                this.setState({
                    provider: provider,
                    contract: contract,
                    contractWithSigner: contractWithSigner
                });

                this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing, true, this, provider);
                this.utilsCake = new BlockchainUtils(contractCakeWithSigner, null, this.transactionProcessing, false, this, provider);
                this.utilsCakeLP = new BlockchainUtils(contractCakeLPWithSigner, null, this.transactionProcessing, false, this, provider);
            } else {
                console.warn("Please install MetaMask");
            }
        } catch (error) {
            console.error(`Error in componentDidMount: ${error}`)
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
                <h2>MasterChef</h2>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    // Pool 0 - PancakeSwap Token (Cake) 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
                    // Pool 1 - Pancake LPs (Cake-LP) 0x4aa0449B10E2f380AF8E7d4fa224156eB691A25B
                    const _pid = parseInt(event.target._pid.value);
                    const _amount = this.utils.inputToBigNumber("deposit", event.target._amount.value);

                    // approve: address spender, uint256 amount
                    const sender = MasterChefAddress;
                    if(_pid === 0) {
                        await this.utilsCake.methodSend("approve", sender, _amount);
                    } else if(_pid === 1) {
                        await this.utilsCakeLP.methodSend("approve", sender, _amount);
                    }

                    // deposit(uint256 _pid, uint256 _amount)
                    this.utils.methodSend("deposit", _pid, _amount);
                }}>
                    <h3>Deposit</h3>

                    <label><strong>Pool Id</strong></label>
                    <input name="_pid" type="text" placeholder="Input id" /><br />

                    <label><strong>Amount tokens</strong></label>
                    <input name="_amount" type="text" placeholder="Input ammount" /><br />

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.depositSendTxTime}
                        lastTransactionHash={this.state.depositLastTransactionHash}
                        lastTransactionConfirmed={this.state.depositLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    // massUpdatePools()
                    this.utils.methodSend("massUpdatePools");
                }}>
                    <h3>Mass update pools</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.massUpdatePoolsSendTxTime}
                        lastTransactionHash={this.state.massUpdatePoolsLastTransactionHash}
                        lastTransactionConfirmed={this.state.massUpdatePoolsLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // Pool 0 - PancakeSwap Token (Cake) 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
                    // Pool 1 - Pancake LPs (Cake-LP) 0x4aa0449B10E2f380AF8E7d4fa224156eB691A25B
                    const _pid = parseInt(event.target._pid.value);

                    // withdraw(uint256 _pid)
                    this.utils.methodSend("withdraw", _pid);
                }}>
                    <h3>Withdraw</h3>
                    <label><strong>Pool Id</strong></label>
                    <input name="_pid" type="text" placeholder="Input id" /><br />

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.withdrawSendTxTime}
                        lastTransactionHash={this.state.withdrawLastTransactionHash}
                        lastTransactionConfirmed={this.state.withdrawLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // emergencyWithdraw(uint256 _pid, uint256 _amount)
                    // Pool 0 - PancakeSwap Token (Cake) 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
                    // Pool 1 - Pancake LPs (Cake-LP) 0x4aa0449B10E2f380AF8E7d4fa224156eB691A25B
                    const _pid = event.target._pid.value;
                    const _amount = this.utils.inputToBigNumber("emergencyWithdraw", event.target._amount.value);
                    this.utils.methodSend("emergencyWithdraw", _pid, _amount);
                }}>
                    <h3>Emergency withdraw</h3>

                    <label><strong>Pool Id</strong></label>
                    <input name="_pid" type="text" placeholder="Input id" /><br />                    

                    <label><strong>Amount tokens</strong></label>
                    <input name="_amount" type="text" placeholder="Input ammount" /><br />

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

export default MasterChef;