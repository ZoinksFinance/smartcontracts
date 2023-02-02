import React, { Component } from "react";
import "./../App.css";

import { ethers } from "ethers";
import ZoinksTokenAbi from "../../abis/ZoinksToken.json";
import BUSDAbi from "../../abis/BUSD.json";
import { ZoinksTokenAddress, BUSDAddress } from "./../addresses.js";
import TransactionInfo from "./../common/TransactionInfo.js";
import BlockchainUtils from "./../common/BlockchainUtils.js";

class ZoinksTokenMPV extends Component {

    constructor(props) {
        super(props);
        this.utils = null;
        this.utilsBUSD = null;
        this.state = {
            // Blockchain connection
            provider: null,
            contract: null,
            contractWithSigner: null,
            contractBUSDWithSigner: null,

            // General
            loading: false,

            // Propierties from left side

            // Methods read only

            // Results (Methods read only)

            // Methods write
            zoinksMint: null,
            swapOnZoinks: null,
            applyTWAP: null,

            // Results (Methods write)

            // zoinksMint
            zoinksMintSendTxTime: null,
            zoinksMintLastTransactionHash: null,
            zoinksMintLastTransactionConfirmed: null,
            // swapOnZoinks
            swapOnZoinksSendTxTime: null,
            swapOnZoinksLastTransactionHash: null,
            swapOnZoinksLastTransactionConfirmed: null,
            // applyTWAP
            applyTWAPSendTxTime: null,
            applyTWAPLastTransactionHash: null,
            applyTWAPLastTransactionConfirmed: null,
        };
    }

    componentDidMount() {
        try {
            // Runs after the first render() lifecycle
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(ZoinksTokenAddress, ZoinksTokenAbi.abi, provider);

                // Get signer & contract for next calls
                const contractWithSigner = new ethers.Contract(ZoinksTokenAddress, ZoinksTokenAbi.abi, provider.getSigner());
                const contractBUSDWithSigner = new ethers.Contract(BUSDAddress, BUSDAbi.abi, provider.getSigner());

                this.setState({
                    provider: provider,
                    contract: contract,
                    contractWithSigner: contractWithSigner
                });

                this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing, true, this, provider);
                this.utilsBUSD = new BlockchainUtils(contractBUSDWithSigner, null, this.transactionProcessing, false, this, provider);
            } else {
                console.warn("Please install MetaMask");
            }
        } catch (error) {
            console.error(`Error in componentDidMount: ${error}`);
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
                <h2>ZoinksToken</h2>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    const _amount = this.utils.inputToBigNumber("zoinksMint", event.target._amount.value);
                    // approve(address spender, uint256 amount)
                    const sender = ZoinksTokenAddress;
                    await this.utilsBUSD.methodSend("approve", sender, _amount);
                    // zoinksMint(uint256 _amount)
                    this.utils.methodSend("zoinksMint", _amount);
                }}>
                    <h3>Zoinks mint</h3>

                    <label><strong>Amount</strong></label>
                    <input type="text" placeholder="Input amount" name="_amount" /><br />

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.zoinksMintSendTxTime}
                        lastTransactionHash={this.state.zoinksMintLastTransactionHash}
                        lastTransactionConfirmed={this.state.zoinksMintLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={async (event) => {
                    event.preventDefault();
                    const _amount = this.utils.inputToBigNumber("swapOnZoinks", event.target._amount.value);
                    
                    // approve(address spender, uint256 amount)
                    const sender = ZoinksTokenAddress;
                    await this.utilsBUSD.methodSend("approve", sender, _amount);

                    // swapOnZoinks(uint256 _amount, uint256 _amountZoinksMin, uint256 _deadline)
                    const _amountZoinksMin = this.utils.inputToBigNumber("swapOnZoinks", event.target._amountZoinksMin.value);
                    const _deadline = event.target._deadline.value;
                    this.utils.methodSend("swapOnZoinks", _amount, _amountZoinksMin, _deadline);
                }}>
                    <h3>Swap on zoinks</h3>

                    <label><strong>Amount</strong></label>
                    <input type="text" placeholder="Input Zoinks amount" name="_amount" /><br />

                    <label><strong>Minimim accepted amount</strong></label>
                    <input type="text" placeholder="Input Zoinks min amount" name="_amountZoinksMin" /><br />

                    <label><strong>Deadline in UNIX {this.utils?.getDateTimeUNIX(60)}</strong></label>
                    <input type="text" placeholder="Input unix timestamp deadline" name="_deadline" /><br />

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.swapOnZoinksSendTxTime}
                        lastTransactionHash={this.state.swapOnZoinksLastTransactionHash}
                        lastTransactionConfirmed={this.state.swapOnZoinksLastTransactionConfirmed} />
                </form>

                <form className="form" action="#" onSubmit={(event) => {
                    event.preventDefault();
                    // applyTWAP()
                    this.utils.methodSend("applyTWAP");
                }}>
                    <h3>Apply TWAP</h3>

                    <input type="submit" value="Run" />
                    <TransactionInfo
                        sendTxTime={this.state.applyTWAPSendTxTime}
                        lastTransactionHash={this.state.applyTWAPLastTransactionHash}
                        lastTransactionConfirmed={this.state.applyTWAPLastTransactionConfirmed} />
                </form>
            </>
        );
    }
}

export default ZoinksTokenMPV;