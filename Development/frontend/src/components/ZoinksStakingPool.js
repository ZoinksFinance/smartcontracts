import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import ZoinksStakingPoolAbi from "../abis/ZoinksStakingPool.json";
import { ZoinksStakingPoolAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";
import TransactionInfo from "./common/TransactionInfo.js";
import BlockchainUtils from "./common/BlockchainUtils.js";

class ZoinksStakingPool extends Component {

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
            SMART_CHEF_FACTORY: null, // Proof of concept
            hasUserLimit: null, // Proof of concept
            isInitialized: null, // Proof of concept
            accTokenPerShare: null, // Proof of concept
            bonusEndBlock: null, // Proof of concept
            startBlock: null, // Proof of concept
            lastRewardBlock: null, // Proof of concept
            poolLimitPerUser: null, // Proof of concept
            rewardPerBlock: null, // Proof of concept
            PRECISION_FACTOR: null, // Proof of concept
            rewardToken: null, // Proof of concept
            rewardSnacksToken: null, // Proof of concept
            stakedToken: null, // Proof of concept
            seniorageAddress: null, // Proof of concept
            userInfo: null, // Proof of concept
            userAddressList: null, // Proof of concept

            // Methods read only
            owner: null,
            pendingReward: null, // Proof of concept

            // Results (Methods read only)
            pendingRewardResult: null,

            // Methods write
            deposit: null, // Proof of concept
            emergencyRewardWithdraw: null, // Proof of concept
            emergencyWithdraw: null, // Proof of concept
            initialize: null, // Proof of concept
            recoverWrongTokens: null, // Proof of concept
            renounceOwnership: null,
            setSeniorage: null,
            stopReward: null,
            transferOwnership: null,
            updatePool: null,
            updatePoolLimitPerUser: null,
            updateRewardPerBlock: null,
            updateStartAndEndBlocks: null,
            withdraw: null, // Proof of concept

            // Results (Methods write)

            // deposit
            depositSendTxTime: null,
            depositLastTransactionHash: null,
            depositLastTransactionConfirmed: null,
            // emergencyRewardWithdraw
            emergencyRewardWithdrawSendTxTime: null,
            emergencyRewardWithdrawLastTransactionHash: null,
            emergencyRewardWithdrawLastTransactionConfirmed: null,
            // emergencyWithdraw
            emergencyWithdrawSendTxTime: null,
            emergencyWithdrawLastTransactionHash: null,
            emergencyWithdrawLastTransactionConfirmed: null,
            // initialize
            initializeSendTxTime: null,
            initializeLastTransactionHash: null,
            initializeLastTransactionConfirmed: null,
            // recoverWrongTokens
            recoverWrongTokensSendTxTime: null,
            recoverWrongTokensLastTransactionHash: null,
            recoverWrongTokensLastTransactionConfirmed: null,
            // renounceOwnership
            renounceOwnershipSendTxTime: null,
            renounceOwnershipLastTransactionHash: null,
            renounceOwnershipLastTransactionConfirmed: null,
            // setSeniorage
            setSeniorageSendTxTime: null,
            setSeniorageLastTransactionHash: null,
            setSeniorageLastTransactionConfirmed: null,
            // stopReward
            stopRewardSendTxTime: null,
            stopRewardLastTransactionHash: null,
            stopRewardLastTransactionConfirmed: null,
            // transferOwnership
            transferOwnershipSendTxTime: null,
            transferOwnershipLastTransactionHash: null,
            transferOwnershipLastTransactionConfirmed: null,
            // updatePool
            updatePoolSendTxTime: null,
            updatePoolLastTransactionHash: null,
            updatePoolLastTransactionConfirmed: null,
            // updatePoolLimitPerUser
            updatePoolLimitPerUserSendTxTime: null,
            updatePoolLimitPerUserLastTransactionHash: null,
            updatePoolLimitPerUserLastTransactionConfirmed: null,
            // updateRewardPerBlock
            updateRewardPerBlockSendTxTime: null,
            updateRewardPerBlockLastTransactionHash: null,
            updateRewardPerBlockLastTransactionConfirmed: null,
            // updateStartAndEndBlocks
            updateStartAndEndBlocksSendTxTime: null,
            updateStartAndEndBlocksLastTransactionHash: null,
            updateStartAndEndBlocksLastTransactionConfirmed: null,
            // withdraw
            withdrawSendTxTime: null,
            withdrawLastTransactionHash: null,
            withdrawLastTransactionConfirmed: null
        };
    }

    componentDidMount() {
        try {
            // Runs after the first render() lifecycle
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(ZoinksStakingPoolAddress, ZoinksStakingPoolAbi.abi, provider);

                // Get signer & contract for next calls
                const contractWithSigner = new ethers.Contract(ZoinksStakingPoolAddress, ZoinksStakingPoolAbi.abi, provider.getSigner());

                this.setState({
                    provider: provider,
                    contract: contract,
                    contractWithSigner: contractWithSigner
                });

                this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing);
            } else {
                const msgError1 = "Please install MetaMask";
                console.error(msgError1)
                alert(msgError1);
            }
        } catch (error) {
            const msgError2 = `Error in ZoinksStakingPool componentDidMount: ${error}`;
            console.error(msgError2)
            alert(msgError2);
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
                SMART_CHEF_FACTORY: await this.state.contract.SMART_CHEF_FACTORY(),
                hasUserLimit: await this.state.contract.hasUserLimit(),
                isInitialized: await this.state.contract.isInitialized(),
                accTokenPerShare: await this.state.contract.accTokenPerShare(),
                bonusEndBlock: await this.state.contract.bonusEndBlock(),
                startBlock: await this.state.contract.startBlock(),
                lastRewardBlock: await this.state.contract.lastRewardBlock(),
                poolLimitPerUser: await this.state.contract.poolLimitPerUser(),
                rewardPerBlock: await this.state.contract.rewardPerBlock(),
                PRECISION_FACTOR: await this.state.contract.PRECISION_FACTOR(),
                rewardToken: await this.state.contract.rewardToken(),
                rewardSnacksToken: await this.state.contract.rewardSnacksToken(),
                stakedToken: await this.state.contract.stakedToken(),
                seniorageAddress: await this.state.contract.seniorageAddress(),
                userInfo: await this.state.contract.userInfo("0x0000000000000000000000000000000000000000"),

                userAddressList: await this.state.contract.userAddressList(0).catch((error) => {
                    console.warn("userAddressList empty");
                })
            };

            this.setState({
                SMART_CHEF_FACTORY: allProps.SMART_CHEF_FACTORY.toString(),
                hasUserLimit: allProps.hasUserLimit.toString(),
                isInitialized: allProps.isInitialized.toString(),
                accTokenPerShare: allProps.accTokenPerShare.toString(),
                bonusEndBlock: allProps.bonusEndBlock.toString(),
                startBlock: allProps.startBlock.toString(),
                lastRewardBlock: allProps.lastRewardBlock.toString(),
                poolLimitPerUser: allProps.poolLimitPerUser.toString(),
                rewardPerBlock: allProps.rewardPerBlock.toString(),
                PRECISION_FACTOR: allProps.PRECISION_FACTOR.toString(),
                rewardToken: allProps.rewardToken.toString(),
                rewardSnacksToken: allProps.rewardSnacksToken.toString(),
                stakedToken: allProps.stakedToken.toString(),
                seniorageAddress: allProps.seniorageAddress.toString(),
                userInfo: allProps.userInfo.toString(),
                userAddressList: allProps.userAddressList ? allProps.userAddressList.toString() : "[]"
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

    async setPendingRewardAsync(self, value) {
        self.setState({ pendingRewardResult: value.toString() });
    }

    // Render de la DApp
    render() {
        // Loading
        let loadingShow = this.state.loading ? <p>Calling transaction</p> : null;

        const pendingRewardBlock = (this.state.pendingRewardResult !== null && this.state.pendingRewardResult !== undefined) ? (
            <p>Result: {this.state.pendingRewardResult ?? "?"}</p>
        ) : null;

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

                        <p>SMART_CHEF_FACTORY</p>
                        <p><span>{this.state.SMART_CHEF_FACTORY ?? "Empty"}</span></p>
                        <p>hasUserLimit</p>
                        <p><span>{this.state.hasUserLimit ?? "Empty"}</span></p>
                        <p>isInitialized</p>
                        <p><span>{this.state.isInitialized ?? "Empty"}</span></p>
                        <p>accTokenPerShare</p>
                        <p><span>{this.state.accTokenPerShare ?? "Empty"}</span></p>
                        <p>bonusEndBlock</p>
                        <p><span>{this.state.bonusEndBlock ?? "Empty"}</span></p>
                        <p>startBlock</p>
                        <p><span>{this.state.startBlock ?? "Empty"}</span></p>
                        <p>lastRewardBlock</p>
                        <p><span>{this.state.lastRewardBlock ?? "Empty"}</span></p>
                        <p>poolLimitPerUser</p>
                        <p><span>{this.state.poolLimitPerUser ?? "Empty"}</span></p>
                        <p>rewardPerBlock</p>
                        <p><span>{this.state.rewardPerBlock ?? "Empty"}</span></p>
                        <p>PRECISION_FACTOR</p>
                        <p><span>{this.state.PRECISION_FACTOR ?? "Empty"}</span></p>
                        <p>rewardToken</p>
                        <p><span>{this.state.rewardToken ?? "Empty"}</span></p>
                        <p>rewardSnacksToken</p>
                        <p><span>{this.state.rewardSnacksToken ?? "Empty"}</span></p>
                        <p>stakedToken</p>
                        <p><span>{this.state.stakedToken ?? "Empty"}</span></p>
                        <p>seniorageAddress</p>
                        <p><span>{this.state.seniorageAddress ?? "Empty"}</span></p>
                        <p>userInfo</p>
                        <p><span>{this.state.userInfo ?? "Empty"}</span></p>
                        <p>userAddressList</p>
                        <p><span>{this.state.userAddressList ?? "Empty"}</span></p>
                    </div>

                    <div className="methods">
                        <h2>Methods</h2>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _stakedToken = event.target._stakedToken.value;
                            const _rewardToken = event.target._rewardToken.value;
                            const _rewardSnacksToken = event.target._rewardSnacksToken.value;
                            const _poolLimitPerUser = event.target._poolLimitPerUser.value;
                            const _admin = event.target._admin.value;
                            this.utils.methodSend("initialize", _stakedToken, _rewardToken, _rewardSnacksToken, _poolLimitPerUser, _admin);
                        }}>
                            <h3>initialize</h3>

                            <label><strong>IBEP20 _stakedToken</strong></label>
                            <input type="text" name="_stakedToken" placeholder="Input the staked token" /><br />

                            <label><strong>IBEP20 _rewardToken</strong></label>
                            <input type="text" name="_rewardToken" placeholder="Input the reward token" /><br />

                            <label><strong>IBEP20 _rewardSnacksToken</strong></label>
                            <input type="text" name="_rewardSnacksToken" placeholder="Input reward snacks token" /><br />

                            <label><strong>uint256 _poolLimitPerUser</strong></label>
                            <input type="text" name="_poolLimitPerUser" placeholder="Input pool limit per user" /><br />

                            <label><strong>address _admin</strong></label>
                            <input type="text" name="_admin" placeholder="Input admin address" /><br />

                            <input type="submit" value="Run Initialize" />
                            <TransactionInfo
                                sendTxTime={this.state.initializeSendTxTime}
                                lastTransactionHash={this.state.initializeLastTransactionHash}
                                lastTransactionConfirmed={this.state.initializeLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _amount = this.utils.inputToBigNumber("deposit", event.target._amount.value);
                            this.utils.methodSend("deposit", _amount);
                        }}>
                            <h3>deposit</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input type="text" name="_amount" placeholder="Input ammount" /><br />

                            <input type="submit" value="Run Deposit" />
                            <TransactionInfo
                                sendTxTime={this.state.depositSendTxTime}
                                lastTransactionHash={this.state.depositLastTransactionHash}
                                lastTransactionConfirmed={this.state.depositLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _amount = this.utils.inputToBigNumber("withdraw", event.target._amount.value);
                            this.utils.methodSend("withdraw", _amount);
                        }}>
                            <h3>withdraw</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input type="text" name="_amount" placeholder="Input ammount" /><br />

                            <input type="submit" value="Run Withdraw" />
                            <TransactionInfo
                                sendTxTime={this.state.withdrawSendTxTime}
                                lastTransactionHash={this.state.withdrawLastTransactionHash}
                                lastTransactionConfirmed={this.state.withdrawLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            this.utils.methodSend("emergencyWithdraw");
                        }}>
                            <h3>emergencyWithdraw</h3>

                            <input type="submit" value="Run emergencyWithdraw" />
                            <TransactionInfo
                                sendTxTime={this.state.emergencyWithdrawSendTxTime}
                                lastTransactionHash={this.state.emergencyWithdrawLastTransactionHash}
                                lastTransactionConfirmed={this.state.emergencyWithdrawLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            this.utils.methodSend("emergencyRewardWithdraw");
                        }}>
                            <h3>emergencyRewardWithdraw</h3>

                            <input type="submit" value="Run emergencyRewardWithdraw" />
                            <TransactionInfo
                                sendTxTime={this.state.emergencyRewardWithdrawSendTxTime}
                                lastTransactionHash={this.state.emergencyRewardWithdrawLastTransactionHash}
                                lastTransactionConfirmed={this.state.emergencyRewardWithdrawLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _tokenAddress = event.target._tokenAddress.value;
                            const _tokenAmount = this.utils.inputToBigNumber("recoverWrongTokens", event.target._tokenAmount.value);
                            this.utils.methodSend("recoverWrongTokens", _tokenAddress, _tokenAmount);
                        }}>
                            <h3>recoverWrongTokens</h3>

                            <label><strong>address _tokenAddress</strong></label><br />
                            <input type="text" name="_tokenAddress" placeholder="Input token address" /> <br />

                            <label><strong>uint256 _tokenAmount</strong></label>
                            <input type="text" name="_tokenAmount" placeholder="Input ammount" /> <br />

                            <input type="submit" value="Run recoverWrongTokens" />
                            <TransactionInfo
                                sendTxTime={this.state.recoverWrongTokensSendTxTime}
                                lastTransactionHash={this.state.recoverWrongTokensLastTransactionHash}
                                lastTransactionConfirmed={this.state.recoverWrongTokensLastTransactionConfirmed} />
                        </form>

                        <form action="#" method="post" id="updatePoolLimitPerUser" className="form">
                            <h3>updatePoolLimitPerUser</h3>
                            <p><strong>hasUserLimit</strong></p>
                            <select name="hasUserLimit">
                                <option value=""></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                            <br />

                            <label><strong>poolLimitPerUser</strong></label>
                            <input name="poolLimitPerUser" type="text" placeholder="Input pool limit ammount" /><br />
                            <input type="submit" value="Run hasUserLimit" />
                        </form>

                        <form action="#" method="post" id="updateStartAndEndBlocks" className="form">
                            <h3>updateStartAndEndBlocks</h3>
                            <label></label>
                            <input name="start_block" type="text" placeholder="Input start block" /> <br />

                            <label></label>
                            <input name="end_block" type="text" placeholder="Input end block" /> <br />
                            <input type="submit" value="Run updateStartAndEndBlocks" />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _user = event.target._user.value;
                            this.utils.methodCall("pendingReward", async (value) => {
                                const result = value.toString();
                                const time = this.utils.getTime();
                                this.setState({ pendingRewardResult: `${result} (${time})` });
                            }, _user);
                        }}>
                            <h3>pendingReward</h3>

                            <label><strong>address _user</strong></label><br />
                            <input type="text" name="_user" placeholder="Input user address" /> <br />

                            <input type="submit" value="Run pendingReward" />
                            {pendingRewardBlock}
                        </form>

                        <form action="#" method="post" id="setSeniorage" className="form">
                            <h3>setSeniorage</h3>
                            <label><strong>seniorage_address</strong></label
                            ><br />
                            <input type="text" name="seniorage_address" placeholder="Input seniorage address" /> <br />
                            <input type="submit" value="Run setSeniorage" />
                        </form>
                    </div>

                </div>
            </>
        );
    }
}

export default ZoinksStakingPool;