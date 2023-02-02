import React, { Component } from 'react'
import './../App.css'

import { ethers } from "ethers";
import PulseAbi from "../../abis/Pulse.json";
import { PulseAddress } from "./../addresses.js";
import TransactionInfo from "./../common/TransactionInfo.js";
import BlockchainUtils from "./../common/BlockchainUtils.js";

class Pulse extends Component {

    constructor(props) {
        super(props);
        this.utils = null;
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
            buySnacks: null,
            redeemSnacks: null,
            depositSnacks: null,
            depositToMasterChef: null,

            // Results (Methods write)

            // buySnacks
            buySnacksSendTxTime: null,
            buySnacksLastTransactionHash: null,
            buySnacksLastTransactionConfirmed: null,
            // redeemSnacks
            redeemSnacksSendTxTime: null,
            redeemSnacksLastTransactionHash: null,
            redeemSnacksLastTransactionConfirmed: null,
            // depositSnacks
            depositSnacksSendTxTime: null,
            depositSnacksLastTransactionHash: null,
            depositSnacksLastTransactionConfirmed: null,
            // depositToMasterChef
            depositToMasterChefSendTxTime: null,
            depositToMasterChefLastTransactionHash: null,
            depositToMasterChefLastTransactionConfirmed: null,
        };
    }

    componentDidMount() {
        try {
            // Runs after the first render() lifecycle
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(PulseAddress, PulseAbi.abi, provider);

                // Get signer & contract for next calls
                const contractWithSigner = new ethers.Contract(PulseAddress, PulseAbi.abi, provider.getSigner());

                this.setState({
                    provider: provider,
                    contract: contract,
                    contractWithSigner: contractWithSigner
                });

                this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing, true, this, provider);
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
                <h2>Pulse</h2>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    // buySnacks()
                    this.utils.methodSend("buySnacks");
                }}>
                    <h3>Buy snacks</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.buySnacksSendTxTime}
                        lastTransactionHash={this.state.buySnacksLastTransactionHash}
                        lastTransactionConfirmed={this.state.buySnacksLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    // redeemSnacks()
                    this.utils.methodSend("redeemSnacks");
                }}>
                    <h3>Redeem snacks</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.redeemSnacksSendTxTime}
                        lastTransactionHash={this.state.redeemSnacksLastTransactionHash}
                        lastTransactionConfirmed={this.state.redeemSnacksLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // depositSnacks()
                    this.utils.methodSend("depositSnacks");
                }}>
                    <h3>Deposit snacks</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.depositSnacksSendTxTime}
                        lastTransactionHash={this.state.depositSnacksLastTransactionHash}
                        lastTransactionConfirmed={this.state.depositSnacksLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // depositToMasterChef()
                    this.utils.methodSend("depositToMasterChef");
                }}>
                    <h3>Deposit to Master Chef</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.depositToMasterChefSendTxTime}
                        lastTransactionHash={this.state.depositToMasterChefLastTransactionHash}
                        lastTransactionConfirmed={this.state.depositToMasterChefLastTransactionConfirmed} />
                </form>
            </>
        );
    }
}

export default Pulse;