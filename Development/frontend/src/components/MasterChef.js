import React, { Component } from 'react'
import './App.css'

import { ethers } from "ethers";
import MasterChefAbi from "../abis/MasterChef.json";
import { MasterChefAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";
import TransactionInfo from "./common/TransactionInfo.js";
import BlockchainUtils from "./common/BlockchainUtils.js";

class MasterChef extends Component {

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
            SMART_CHEF_FACTORY: null,
            cake: null,
            zoinks: null,
            snacks: null,
            ethSnacks: null,
            btcSnacks: null,
            BONUS_MULTIPLIER: null, // ? Proof of concept
            migrator: null,
            poolInfo: null, // Like method(index)
            userInfo: null, // (uint256 => mapping(address => UserInfo))
            userAddressList: null, // Like method(index)
            seniorageAddress: null,
            isInitialized: null,
            owner: null,

            // Methods read only
            getMultiplier: null,
            pendingCake: null,
            poolLength: null,

            // Results (Methods read only)
            getMultiplierResult: null,
            pendingCakeResult: null,
            poolLengthResult: null,

            // Methods write
            add: null,
            emergencyWithdraw: null,
            enterStaking: null,
            initialize: null,
            leaveStaking: null,
            massUpdatePools: null,
            migrate: null,
            renounceOwnership: null,
            setMigrator: null,
            setSeniorage: null,
            transferOwnership: null,
            updateMultiplier: null,
            withdraw: null,

            // Results (Methods write)

            // add
            addSendTxTime: null,
            addLastTransactionHash: null,
            addLastTransactionConfirmed: null,
            // emergencyWithdraw
            emergencyWithdrawSendTxTime: null,
            emergencyWithdrawLastTransactionHash: null,
            emergencyWithdrawLastTransactionConfirmed: null,
            // enterStaking
            enterStakingSendTxTime: null,
            enterStakingLastTransactionHash: null,
            enterStakingLastTransactionConfirmed: null,
            // initialize
            initializeSendTxTime: null,
            initializeLastTransactionHash: null,
            initializeLastTransactionConfirmed: null,
            // leaveStaking
            leaveStakingSendTxTime: null,
            leaveStakingLastTransactionHash: null,
            leaveStakingLastTransactionConfirmed: null,
            // massUpdatePools
            massUpdatePoolsSendTxTime: null,
            massUpdatePoolsLastTransactionHash: null,
            massUpdatePoolsLastTransactionConfirmed: null,
            // migrate
            migrateSendTxTime: null,
            migrateLastTransactionHash: null,
            migrateLastTransactionConfirmed: null,
            // renounceOwnership
            renounceOwnershipSendTxTime: null,
            renounceOwnershipLastTransactionHash: null,
            renounceOwnershipLastTransactionConfirmed: null,
            // setMigrator
            setMigratorSendTxTime: null,
            setMigratorLastTransactionHash: null,
            setMigratorLastTransactionConfirmed: null,
            // setSeniorage
            setSeniorageSendTxTime: null,
            setSeniorageLastTransactionHash: null,
            setSeniorageLastTransactionConfirmed: null,
            // transferOwnership
            transferOwnershipSendTxTime: null,
            transferOwnershipLastTransactionHash: null,
            transferOwnershipLastTransactionConfirmed: null,
            // updateMultiplier
            updateMultiplierSendTxTime: null,
            updateMultiplierLastTransactionHash: null,
            updateMultiplierLastTransactionConfirmed: null,
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
                const contract = new ethers.Contract(MasterChefAddress, MasterChefAbi.abi, provider);

                // Get signer & contract for next calls
                const contractWithSigner = new ethers.Contract(MasterChefAddress, MasterChefAbi.abi, provider.getSigner());

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
                SMART_CHEF_FACTORY: await this.state.contract.SMART_CHEF_FACTORY(),
                cake: await this.state.contract.cake(),
                zoinks: await this.state.contract.zoinks(),
                snacks: await this.state.contract.snacks(),
                ethSnacks: await this.state.contract.ethSnacks(),
                btcSnacks: await this.state.contract.btcSnacks(),
                BONUS_MULTIPLIER: await this.state.contract.BONUS_MULTIPLIER(),
                migrator: await this.state.contract.migrator(),
                seniorageAddress: await this.state.contract.seniorageAddress(),
                isInitialized: await this.state.contract.isInitialized(),
                owner: await this.state.contract.owner(),

                poolInfo: await this.state.contract.poolInfo(0).catch((error) => {
                    console.warn("poolInfo empty");
                }),
                userInfo: await this.state.contract.userInfo(0, '0x0c55000eaa1F3e6c47F59678d6eB7Eb8856ACC01').catch((error) => {
                    console.warn("userInfo empty");
                }),
                userAddressList: await this.state.contract.userAddressList(0).catch((error) => {
                    console.warn("userAddressList empty");
                }),
            };

            this.setState({
                SMART_CHEF_FACTORY: allProps.SMART_CHEF_FACTORY.toString(),
                cake: allProps.cake.toString(),
                zoinks: allProps.zoinks.toString(),
                snacks: allProps.snacks.toString(),
                ethSnacks: allProps.ethSnacks.toString(),
                btcSnacks: allProps.btcSnacks.toString(),
                BONUS_MULTIPLIER: allProps.BONUS_MULTIPLIER.toString(),
                migrator: allProps.migrator.toString(),
                seniorageAddress: allProps.seniorageAddress.toString(),
                isInitialized: allProps.isInitialized.toString(),
                owner: allProps.owner.toString(),

                poolInfo: allProps.poolInfo ? allProps.poolInfo.toString() : "[]",
                userInfo: allProps.userInfo ? allProps.userInfo.toString() : "[]",
                userAddressList: allProps.userAddressList ? allProps.userAddressList.toString() : "[]",
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

        const getMultiplierBlock = (this.state.getMultiplierResult !== null && this.state.getMultiplierResult !== undefined) ? (
            <p>Result: {this.state.getMultiplierResult ?? "?"}</p>
        ) : null;

        const pendingCakeBlock = (this.state.pendingCakeResult !== null && this.state.pendingCakeResult !== undefined) ? (
            <p>Result: {this.state.pendingCakeResult ?? "?"}</p>
        ) : null;

        const poolLengthBlock = (this.state.poolLengthResult !== null && this.state.poolLengthResult !== undefined) ? (
            <p>Result: {this.state.poolLengthResult ?? "?"}</p>
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
                        <p>cake</p>
                        <p><span>{this.state.cake ?? "Empty"}</span></p>
                        <p>zoinks</p>
                        <p><span>{this.state.zoinks ?? "Empty"}</span></p>
                        <p>snacks</p>
                        <p><span>{this.state.snacks ?? "Empty"}</span></p>
                        <p>ethSnacks</p>
                        <p><span>{this.state.ethSnacks ?? "Empty"}</span></p>
                        <p>btcSnacks</p>
                        <p><span>{this.state.btcSnacks ?? "Empty"}</span></p>
                        <p>BONUS_MULTIPLIER</p>
                        <p><span>{this.state.BONUS_MULTIPLIER ?? "Empty"}</span></p>
                        <p>migrator</p>
                        <p><span>{this.state.migrator ?? "Empty"}</span></p>
                        <p>poolInfo</p>
                        <p><span>{this.state.poolInfo ?? "Empty"}</span></p>
                        <p>userInfo</p>
                        <p><span>{this.state.userInfo ?? "Empty"}</span></p>
                        <p>userAddressList</p>
                        <p><span>{this.state.userAddressList ?? "Empty"}</span></p>
                        <p>seniorageAddress</p>
                        <p><span>{this.state.seniorageAddress ?? "Empty"}</span></p>
                        <p>isInitialized</p>
                        <p><span>{this.state.isInitialized ?? "Empty"}</span></p>
                        <p>owner</p>
                        <p><span>{this.state.owner ?? "Empty"}</span></p>
                    </div>

                    <div className="methods">
                        <h2>Methods</h2>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _from = this.utils.inputToBigNumber("getMultiplier", event.target._from.value);
                            const _to = this.utils.inputToBigNumber("getMultiplier", event.target._to.value);
                            this.utils.methodCall("getMultiplier", async (value) => {
                                const result = value.toString();
                                const time = this.utils.getTime();
                                this.setState({ getMultiplierResult: `${result} (${time})` });
                            }, _from, _to);
                        }}>
                            <h3>getMultiplier</h3>

                            <label><strong>uint256 _from</strong></label>
                            <input name="_from" type="text" placeholder="Input from" /><br />
                            <label><strong>, uint256 _to</strong></label>
                            <input name="_to" type="text" placeholder="Input to" /><br />
                            <input type="submit" value="Run getMultiplier" />
                            {getMultiplierBlock}
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _pid = this.utils.inputToBigNumber("pendingCake", event.target._pid.value);
                            const _user = event.target._user.value;
                            this.utils.methodCall("pendingCake", async (value) => {
                                console.log("pendingCake ..", value);
                                const result = value.toString();
                                const time = this.utils.getTime();
                                this.setState({ pendingCakeResult: `${result} (${time})` });
                            }, _pid, _user);
                        }}>
                            <h3>pendingCake</h3>
                            <label>uint256 _pid</label>
                            <input name="_pid" type="text" placeholder="Input data" /><br />

                            <label><strong>address _user</strong></label>
                            <input name="_user" type="text" placeholder="Input address" /><br />

                            <input type="submit" value="Run pendingCake" />
                            {pendingCakeBlock}
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            this.utils.methodCall("poolLength", async (value) => {
                                const result = value.toString();
                                const time = this.utils.getTime();
                                this.setState({ poolLengthResult: `${result} (${time})` });
                            });
                        }}>
                            <h3>poolLength</h3>

                            <input type="submit" value="Run poolLength" />
                            {poolLengthBlock}
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _lpToken = event.target._lpToken.value;
                            const _withUpdate = event.target._withUpdate.value;
                            this.utils.methodSend("add", _lpToken, _withUpdate);
                        }}>
                            <h3>add</h3>
                            <label><strong>IBEP20 _lpToken</strong></label>
                            <input name="_lpToken" type="text" placeholder="Input data" /><br />
                            <h3>bool _withUpdate</h3>
                            <select name="_withUpdate">
                                <option value=""></option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                            <br />

                            <input type="submit" value="Run add" />
                            <TransactionInfo
                                sendTxTime={this.state.addSendTxTime}
                                lastTransactionHash={this.state.addLastTransactionHash}
                                lastTransactionConfirmed={this.state.addLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _pid = this.utils.inputToBigNumber("emergencyWithdraw", event.target._pid.value);
                            this.utils.methodSend("emergencyWithdraw", _pid);
                        }}>
                            <h3>emergencyWithdraw</h3>

                            <label><strong>uint256 _pid</strong></label>
                            <input name="_pid" type="text" placeholder="Input pid" /><br />

                            <input type="submit" value="Run emergencyWithdraw" />
                            <TransactionInfo
                                sendTxTime={this.state.emergencyWithdrawSendTxTime}
                                lastTransactionHash={this.state.emergencyWithdrawLastTransactionHash}
                                lastTransactionConfirmed={this.state.emergencyWithdrawLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _amount = this.utils.inputToBigNumber("enterStaking", event.target._amount.value);
                            this.utils.methodSend("enterStaking", _amount);
                        }}>
                            <h3>enterStaking</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input name="_amount" type="text" placeholder="Input ammount" /><br />

                            <input type="submit" value="Run enterStaking" />
                            <TransactionInfo
                                sendTxTime={this.state.enterStakingSendTxTime}
                                lastTransactionHash={this.state.enterStakingLastTransactionHash}
                                lastTransactionConfirmed={this.state.enterStakingLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _zoinks = event.target._zoinks.value;
                            const _snacks = event.target._snacks.value;
                            const _ethSnacks = event.target._ethSnacks.value;
                            const _btcSnacks = event.target._btcSnacks.value;
                            this.utils.methodSend("initialize", _zoinks, _snacks, _ethSnacks, _btcSnacks);
                        }}>
                            <h3>initialize</h3>

                            <label><strong>BEP20 _zoinks</strong></label>
                            <input type="text" name="_zoinks" placeholder="Input data" /><br />

                            <label><strong>BEP20 _snacks</strong></label>
                            <input type="text" name="_snacks" placeholder="Input data" /><br />

                            <label><strong>BEP20 _ethSnacks</strong></label>
                            <input type="text" name="_ethSnacks" placeholder="Input data" /><br />

                            <label><strong>BEP20 _btcSnacks</strong></label>
                            <input type="text" name="_btcSnacks" placeholder="Input data" /><br />

                            <input type="submit" value="Run Initialize" />
                            <TransactionInfo
                                sendTxTime={this.state.initializeSendTxTime}
                                lastTransactionHash={this.state.initializeLastTransactionHash}
                                lastTransactionConfirmed={this.state.initializeLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _amount = this.utils.inputToBigNumber("leaveStaking", event.target._amount.value);
                            this.utils.methodSend("leaveStaking", _amount);
                        }}>
                            <h3>leaveStaking</h3>

                            <label><strong>uint256 _amount</strong></label>
                            <input name="_amount" type="text" placeholder="Input ammount" /><br />

                            <input type="submit" value="Run leaveStaking" />
                            <TransactionInfo
                                sendTxTime={this.state.leaveStakingSendTxTime}
                                lastTransactionHash={this.state.leaveStakingLastTransactionHash}
                                lastTransactionConfirmed={this.state.leaveStakingLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            this.utils.methodSend("massUpdatePools");
                        }}>
                            <h3>massUpdatePools</h3>

                            <input type="submit" value="Run massUpdatePools" />
                            <TransactionInfo
                                sendTxTime={this.state.massUpdatePoolsSendTxTime}
                                lastTransactionHash={this.state.massUpdatePoolsLastTransactionHash}
                                lastTransactionConfirmed={this.state.massUpdatePoolsLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _pid = this.utils.inputToBigNumber("migrate", event.target._pid.value);
                            this.utils.methodSend("migrate", _pid);
                        }}>
                            <h3>migrate</h3>
                            <label>uint256 _pid</label>
                            <input name="_pid" type="text" placeholder="Input data" /><br />
                            <input type="submit" value="Run migrate" />

                            <TransactionInfo
                                sendTxTime={this.state.migrateSendTxTime}
                                lastTransactionHash={this.state.migrateLastTransactionHash}
                                lastTransactionConfirmed={this.state.migrateLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            this.utils.methodSend("renounceOwnership");
                        }}>
                            <h3>renounceOwnership</h3>

                            <input type="submit" value="Run renounceOwnership" />
                            <TransactionInfo
                                sendTxTime={this.state.renounceOwnershipSendTxTime}
                                lastTransactionHash={this.state.renounceOwnershipLastTransactionHash}
                                lastTransactionConfirmed={this.state.renounceOwnershipLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _migrator = event.target._migrator.value;
                            this.utils.methodSend("setMigrator", _migrator);
                        }}>
                            <h3>setMigrator</h3>

                            <label><strong>IMigratorChef _migrator</strong></label>
                            <input name="_migrator" type="text" placeholder="Input data" /><br />

                            <input type="submit" value="Run setMigrator" />
                            <TransactionInfo
                                sendTxTime={this.state.setMigratorSendTxTime}
                                lastTransactionHash={this.state.setMigratorLastTransactionHash}
                                lastTransactionConfirmed={this.state.setMigratorLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const seniorage = event.target.seniorage.value;
                            this.utils.methodSend("setSeniorage", seniorage);
                        }}>
                            <h3>setSeniorage</h3>

                            <label><strong>address seniorage</strong></label>
                            <input name="seniorage" type="text" placeholder="Input address" /><br />

                            <input type="submit" value="Run setSeniorage" />
                            <TransactionInfo
                                sendTxTime={this.state.setSeniorageSendTxTime}
                                lastTransactionHash={this.state.setSeniorageLastTransactionHash}
                                lastTransactionConfirmed={this.state.setSeniorageLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const newOwner = event.target.newOwner.value;
                            this.utils.methodSend("transferOwnership", newOwner);
                        }}>
                            <h3>transferOwnership</h3>

                            <label><strong>address newOwner</strong></label>
                            <input name="newOwner" type="text" placeholder="Input address" /><br />

                            <input type="submit" value="Run transferOwnership" />
                            <TransactionInfo
                                sendTxTime={this.state.transferOwnershipSendTxTime}
                                lastTransactionHash={this.state.transferOwnershipLastTransactionHash}
                                lastTransactionConfirmed={this.state.transferOwnershipLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const multiplierNumber = this.utils.inputToBigNumber("updateMultiplier", event.target.multiplierNumber.value);
                            this.utils.methodSend("updateMultiplier", multiplierNumber);
                        }}>
                            <h3>updateMultiplier</h3>

                            <label><strong>uint256 multiplierNumber</strong></label>
                            <input name="multiplierNumber" type="text" placeholder="Input multiplier" /><br />

                            <input type="submit" value="Run updateMultiplier" />
                            <TransactionInfo
                                sendTxTime={this.state.updateMultiplierSendTxTime}
                                lastTransactionHash={this.state.updateMultiplierLastTransactionHash}
                                lastTransactionConfirmed={this.state.updateMultiplierLastTransactionConfirmed} />
                        </form>

                        <form className="form" action="#" onSubmit={(event) => {
                            event.preventDefault();
                            const _pid = this.utils.inputToBigNumber("migrate", event.target._pid.value);
                            const _amount = this.utils.inputToBigNumber("migrate", event.target._amount.value);
                            this.utils.methodSend("withdraw", _pid, _amount);
                        }}>
                            <h3>withdraw</h3>
                            <label><strong>uint256 _pid</strong></label>
                            <input name="_pid" type="text" placeholder="Input pid" /><br />

                            <label><strong>uint256 _amount</strong></label>
                            <input name="_amount" type="text" placeholder="Input ammount" /><br />
                            <input type="submit" value="Run withdraw" />
                            <TransactionInfo
                                sendTxTime={this.state.withdrawSendTxTime}
                                lastTransactionHash={this.state.withdrawLastTransactionHash}
                                lastTransactionConfirmed={this.state.withdrawLastTransactionConfirmed} />
                        </form>
                    </div>
                </div>
            </>
        );
    }
}

export default MasterChef;