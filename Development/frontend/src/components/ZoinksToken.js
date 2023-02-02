import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import ZoinksTokenAbi from "../abis/ZoinksToken.json";
import { ZoinksTokenAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";
import TransactionInfo from "./common/TransactionInfo.js";
import BlockchainUtils from "./common/BlockchainUtils.js";

class ZoinksToken extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // Blockchain connection
            provider: null,
            contract: null,
            contractWithSigner: null,

            // General
            loading: false,

            // Propierties from left side
            busd: null, // Proof of concept
            decimals: null,
            INITIAL_PULSE_SUPPLY: null, // Proof of concept
            INITIAL_ZOINKS_SUPPLY: null, // Proof of concept
            isInitialized: null, // Proof of concept
            name: null,
            owner: null,
            pulse: null, // Proof of concept
            router: null, // Proof of concept
            snacks: null, // Proof of concept
            symbol: null,
            totalSupply: null,
            zoinks: null, // Proof of concept
            inflationRewards: null, // Like method(index) Proof of concept

            // Methods read only
            allowance: null,
            balanceOf: null,
            calculateBuyAmount: null,

            // Results (Methods read only)
            allowanceResult: null,

            // Methods write
            approve: null,
            burnZoinks: null, // Proof of concept
            buySnaks: null, // Proof of concept
            decreaseAllowance: null,
            increaseAllowance: null,
            initialize: null, // Proof of concept
            mint: null, // Proof of concept
            rebaseInflations: null, // Proof of concept
            renounceOwnership: null,
            resetInflationRewards: null,
            setInflationReward: null, // Proof of concept
            setRebaseContract: null,
            swapZoinks: null, // Proof of concept
            transfer: null, // Proof of concept
            transferFrom: null,
            transferOwnership: null,
            zoinksMint: null, // Proof of concept

            // Results (Methods write)

            // inflationRewards
            inflationRewardsSendTxTime: null,
            inflationRewardsLastTransactionHash: null,
            inflationRewardsLastTransactionConfirmed: null,
            // initialize
            initializeSendTxTime: null,
            initializeLastTransactionHash: null,
            initializeLastTransactionConfirmed: null,
            // zoinksMint
            zoinksMintSendTxTime: null,
            zoinksMintLastTransactionHash: null,
            zoinksMintLastTransactionConfirmed: null,
            // buySnacks
            buySnacksSendTxTime: null,
            buySnacksLastTransactionHash: null,
            buySnacksLastTransactionConfirmed: null,
            // swapZoinks
            swapZoinksSendTxTime: null,
            swapZoinksLastTransactionHash: null,
            swapZoinksLastTransactionConfirmed: null,
            // mint
            mintSendTxTime: null,
            mintLastTransactionHash: null,
            mintLastTransactionConfirmed: null,
            // burnZoinks
            burnZoinksSendTxTime: null,
            burnZoinksLastTransactionHash: null,
            burnZoinksLastTransactionConfirmed: null,
            // rebaseInflations
            rebaseInflationsSendTxTime: null,
            rebaseInflationsLastTransactionHash: null,
            rebaseInflationsLastTransactionConfirmed: null,
            // setInflationReward
            setInflationRewardSendTxTime: null,
            setInflationRewardLastTransactionHash: null,
            setInflationRewardLastTransactionConfirmed: null,
            // transfer
            transferSendTxTime: null,
            transferLastTransactionHash: null,
            transferLastTransactionConfirmed: null
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

                this.setState({
                    provider: provider,
                    contract: contract,
                    contractWithSigner: contractWithSigner
                });

                this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing);
            } else {
                console.warn("Please install MetaMask");
            }
        } catch (error) {
            console.error(`Error in componentDidMount: ${error}`)
        }
    }

    // Reading all props from blockchain and show it's on page
    async readProps(method) {
        try {
            // Log
            console.log(`Calling ${method}`);
            // Loader
            this.setState({ loading: true });
            // Work
            await checkChainId();
            // Read props
            const allProps = {
                busd: await this.state.contract.busd(),
                INITIAL_PULSE_SUPPLY: await this.state.contract.INITIAL_PULSE_SUPPLY(),
                INITIAL_ZOINKS_SUPPLY: await this.state.contract.INITIAL_ZOINKS_SUPPLY(),
                isInitialized: await this.state.contract.isInitialized(),
                pulse: await this.state.contract.pulse(),
                router: await this.state.contract.router(),
                snacks: await this.state.contract.snacks(),
                zoinks: await this.state.contract.zoinks(),

                inflationRewards: await this.state.contract.inflationRewards(0).catch((error) => {
                    console.warn("inflationRewards empty");
                })
            };

            this.setState({
                busd: allProps.busd.toString(),
                INITIAL_PULSE_SUPPLY: allProps.INITIAL_PULSE_SUPPLY.toString(),
                INITIAL_ZOINKS_SUPPLY: allProps.INITIAL_ZOINKS_SUPPLY.toString(),
                isInitialized: allProps.isInitialized.toString(),
                pulse: allProps.pulse.toString(),
                router: allProps.router.toString(),
                snacks: allProps.snacks.toString(),
                zoinks: allProps.zoinks.toString(),
                inflationRewards: allProps.inflationRewards ? allProps.inflationRewards.toString() : "[]"
            });
        } catch (error) {
            await this.utils.showError(method, error);
        } finally {
            this.setState({ loading: false });
        }
    }

    // ! Processing part
    // Set tx state values and wait for confirmations
    async transactionProcessing(method, tx) {
        this.setState({ [method + "LastTransactionConfirmed"]: 0 });
        this.setState({
            [method + "SendTxTime"]: tx.timestamp ?? "Error",
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
        // Loading
        let loadingShow = this.state.loading ? <p>Calling transaction</p> : null;

        return (
            <>
                <div className="container">
                    <div className="propsContainer">
                        {loadingShow}
                        <h2>Properties</h2>

                        <button onClick={(event) => {
                            event.preventDefault();
                            this.readProps("readProps");
                        }}>Refresh Properties</button>

                        <p>INITIAL_ZOINKS_SUPPLY</p>
                        <p><span>{this.state.INITIAL_ZOINKS_SUPPLY ?? "Empty"}</span></p>
                        <p>INITIAL_PULSE_SUPPLY</p>
                        <p><span>{this.state.INITIAL_PULSE_SUPPLY ?? "Empty"}</span></p>
                        <p>BUSD</p>
                        <p><span>{this.state.busd ?? "Empty"}</span></p>
                        <p>Zoinks</p>
                        <p><span>{this.state.zoinks ?? "Empty"}</span></p>
                        <p>Snacks</p>
                        <p><span>{this.state.snacks ?? "Empty"}</span></p>
                        <p>Router</p>
                        <p><span>{this.state.router ?? "Empty"}</span></p>
                        <p>Pulse address</p>
                        <p><span>{this.state.pulse ?? "Empty"}</span></p>
                        <p>Initialized</p>
                        <p><span>{this.state.isInitialized ?? "Empty"}</span></p>
                        <p>Inflation Rewards</p>
                        <p><span>{this.state.inflationRewards ?? "Empty"}</span></p>
                    </div>

                    <div className="methods">
                        <h2>Methods</h2>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _router = event.target._router.value;
                            const _snacks = event.target._snacks.value;
                            const _pulse = event.target._pulse.value;
                            this.utils.methodSend("initialize", _router, _snacks, _pulse);
                        }}>
                            <h3>initialize</h3>

                            <label><strong>IZoinksRouter _router</strong></label>
                            <input type="text" placeholder="Input router" name="_router" /><br />

                            <label><strong>IERC20 _snacks</strong></label>
                            <input type="text" placeholder="Input snacks" name="_snacks" /><br />

                            <label><strong>address _pulse</strong></label>
                            <input type="text" placeholder="Input address" name="_pulse" /><br />

                            <input type="submit" value="Run Initialize" />
                            <TransactionInfo
                                sendTxTime={this.state.initializeSendTxTime}
                                lastTransactionHash={this.state.initializeLastTransactionHash}
                                lastTransactionConfirmed={this.state.initializeLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _amount = this.utils.inputToBigNumber("zoinksMint", event.target._amount.value);
                            this.utils.methodSend("zoinksMint", _amount);
                        }}>
                            <h3>zoinksMint</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input type="text" placeholder="Input amount" name="_amount" /><br />

                            <input type="submit" value="Run zoinksMint" />
                            <TransactionInfo
                                sendTxTime={this.state.zoinksMintSendTxTime}
                                lastTransactionHash={this.state.zoinksMintLastTransactionHash}
                                lastTransactionConfirmed={this.state.zoinksMintLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _amount = this.utils.inputToBigNumber("buySnacks", event.target._amount.value);
                            this.utils.methodSend("buySnacks", _amount);
                        }}>
                            <h3>buySnacks</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input type="text" placeholder="Input amount" name="_amount" /><br />

                            <input type="submit" value="Run buySnacks" />
                            <TransactionInfo
                                sendTxTime={this.state.buySnacksSendTxTime}
                                lastTransactionHash={this.state.buySnacksLastTransactionHash}
                                lastTransactionConfirmed={this.state.buySnacksLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const amount = this.utils.inputToBigNumber("swapZoinks", event.target.amount.value);
                            this.utils.methodSend("swapZoinks", amount);
                        }}>
                            <h3>swapZoinks</h3>

                            <label><strong>uint256 amount</strong></label>
                            <input type="text" placeholder="Input amount" name="amount" /><br />

                            <input type="submit" value="Run swapZoinks" />
                            <TransactionInfo
                                sendTxTime={this.state.swapZoinksSendTxTime}
                                lastTransactionHash={this.state.swapZoinksLastTransactionHash}
                                lastTransactionConfirmed={this.state.swapZoinksLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>calculateBuyAmount</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input type="text" placeholder="Input amount" /><br />

                            <input type="submit" value="Run calculateBuyAmount" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _address = event.target._address.value;
                            const _amount = this.utils.inputToBigNumber("mint", event.target._amount.value);
                            this.utils.methodSend("mint", _address, _amount);
                        }}>
                            <h3>mint</h3>

                            <label><strong>address _address</strong></label>
                            <input type="text" placeholder="Input address" name="_address" /><br />

                            <label><strong>uint256 _amount</strong></label>
                            <input type="text" placeholder="Input amount" name="_amount" /><br />

                            <input type="submit" value="Run mint" />
                            <TransactionInfo
                                sendTxTime={this.state.mintSendTxTime}
                                lastTransactionHash={this.state.mintLastTransactionHash}
                                lastTransactionConfirmed={this.state.lastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _twap_percent = this.utils.inputToBigNumber("burnZoinks", event.target._twap_percent.value);
                            this.utils.methodSend("burnZoinks", _twap_percent);
                        }}>
                            <h3>burnZoinks</h3>

                            <label><strong>uint256 _twap_percent</strong></label>
                            <input type="text" placeholder="TWAP percent" name="_twap_percent" /><br />

                            <input type="submit" value="Run burnZoinks" />
                            <TransactionInfo
                                sendTxTime={this.state.burnZoinksSendTxTime}
                                lastTransactionHash={this.state.burnZoinksLastTransactionHash}
                                lastTransactionConfirmed={this.state.burnZoinksLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _twap_percent = this.utils.inputToBigNumber("rebaseInflations", event.target._twap_percent.value);
                            this.utils.methodSend("rebaseInflations", _twap_percent);
                        }}>
                            <h3>rebaseInflations</h3>

                            <label><strong>uint256 _twap_percent</strong></label>
                            <input type="text" placeholder="TWAP percent" name="_twap_percent" /><br />

                            <input type="submit" value="Run rebaseInflations" />
                            <TransactionInfo
                                sendTxTime={this.state.rebaseInflationsSendTxTime}
                                lastTransactionHash={this.state.rebaseInflationsLastTransactionHash}
                                lastTransactionConfirmed={this.state.rebaseInflationsLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>setRebaseContract</h3>

                            <label><strong>address _account</strong></label>
                            <input type="text" placeholder="Input account" /><br />

                            <input type="submit" value="Run setRebaseContract" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _account = event.target._account.value;
                            const _percentage = this.utils.inputToBigNumber("setInflationReward", event.target._percentage.value);
                            this.utils.methodSend("setInflationReward", _account, _percentage);
                        }}>
                            <h3>setInflationReward</h3>

                            <label><strong>address _account</strong></label>
                            <input type="text" placeholder="Input account" name="_account" /><br />

                            <label><strong>uint256 _percentage</strong></label>
                            <input type="text" placeholder="Input percentage" name="_percentage" /><br />

                            <input type="submit" value="Run setInflationReward" />
                            <TransactionInfo
                                sendTxTime={this.state.setInflationRewardSendTxTime}
                                lastTransactionHash={this.state.setInflationRewardLastTransactionHash}
                                lastTransactionConfirmed={this.state.setInflationRewardLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const index = this.utils.inputToBigNumber("inflationRewards", event.target.index.value);
                            this.utils.methodSend("inflationRewards", index);
                        }}>
                            <h3>inflationRewards</h3>

                            <label><strong>uint256 index</strong></label>
                            <input type="text" placeholder="Input index" name="index" /><br />

                            <input type="submit" value="Run inflationRewards" />
                            <TransactionInfo
                                sendTxTime={this.state.inflationRewardsSendTxTime}
                                lastTransactionHash={this.state.inflationRewardsLastTransactionHash}
                                lastTransactionConfirmed={this.state.inflationRewardsLastTransactionConfirmed} />
                        </form>
                    </div>

                    <div className="fromERC-20">
                        <h2>From ERC-20</h2>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>decreaseAllowance</h3>

                            <label><strong>address spender</strong></label>
                            <input type="text" placeholder="Input spender address" /><br />

                            <label><strong>uint256 subtractedValue</strong></label>
                            <input type="text" placeholder="Input subtractedValue" /><br />

                            <input type="submit" value="Run decreaseAllowance" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>increaseAllowance</h3>

                            <label><strong>address spender</strong></label>
                            <input type="text" placeholder="Input spender address" /><br />

                            <label><strong>uint256 addedValue</strong></label>
                            <input type="text" placeholder="Input amount" /><br />

                            <input type="submit" value="Run increaseAllowance" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>transferFrom</h3>

                            <label><strong>address sender</strong></label>
                            <input type="text" placeholder="Input sender address" /><br />

                            <label><strong>address recipient</strong></label>
                            <input type="text" placeholder="Input recipient address" /><br />

                            <label><strong>uint256 amount</strong></label>
                            <input type="text" placeholder="Input amount" /><br />

                            <input type="submit" value="Run transferFrom" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>approve</h3>

                            <label><strong>address spender</strong></label>
                            <input type="text" placeholder="Input spender address" /><br />

                            <label><strong>uint256 amount</strong></label>
                            <input type="text" placeholder="Input amount" /><br />

                            <input type="submit" value="Run approve" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>allowance</h3>

                            <label><strong>address owner</strong></label>
                            <input type="text" placeholder="Input owner address" /><br />

                            <label><strong>address spender</strong></label>
                            <input type="text" placeholder="Input spender address" /><br />

                            <input type="submit" value="Run allowance" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const recipient = event.target.recipient.value;
                            const amount = this.utils.inputToBigNumber("transfer", event.target.amount.value);
                            this.utils.methodSend("transfer", recipient, amount);
                        }}>
                            <h3>transfer</h3>

                            <label><strong>address recipient</strong></label>
                            <input type="text" placeholder="Input recipient address" name="recipient" /><br />

                            <label><strong>uint256 amount</strong></label>
                            <input type="text" placeholder="Input amount" name="amount" /><br />

                            <input type="submit" value="Run transfer" />
                            <TransactionInfo
                                sendTxTime={this.state.transferSendTxTime}
                                lastTransactionHash={this.state.transferLastTransactionHash}
                                lastTransactionConfirmed={this.state.transferLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>balanceOf</h3>

                            <label><strong>address account</strong></label>
                            <input type="text" placeholder="Input account address" /><br />

                            <input type="submit" value="Run balanceOf" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>decimals</h3>

                            <input type="submit" value="Run decimals_erc" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>symbol</h3>

                            <input type="submit" value="Run symbol" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                        }}>
                            <h3>name</h3>

                            <input type="submit" value="Run name" />
                        </form>
                    </div>
                </div>
            </>
        );
    }
}

export default ZoinksToken;