import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import EthSnackAbi from "../abis/EthSnacks.json";
import { EthSnackAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";
import TransactionInfo from "./common/TransactionInfo.js";
import BlockchainUtils from "./common/BlockchainUtils.js";

class EthSnacks extends Component {

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
      decimals: null,
      FEE_BTCETH_SNACK_HOLDERS: null,
      FEE_MASTERCHEF: null,
      FEE_PULSE: null,
      FEE_SENIORAGE: null,
      FEE_SNACK_HOLDERS: null,
      FEE_SNACKS_STAKING: null,
      FEE_ZOINKS_STAKING: null,
      feeBTCETHSnacksHolders: null,
      feeMasterChef: null,
      feePulse: null,
      feeSeniorage: null,
      feeSnacksHolders: null,
      feeSnacksStakingPool: null,
      feeZoinksStakingPool: null,
      isInitilized: null,
      masterChef: null,
      multiplier: null,
      name: null,
      numberOfHolders: null,
      ONE_SNACK: null,
      owner: null,
      payToken: null, // ETH
      pulse: null,
      seniorageAddress: null,
      snacks: null,
      SNACKS_MULTIPLIER: null,
      snacksStakingPool: null,
      symbol: null,
      TAX_PERCENT_FOR_BUY: null,
      TAX_PERCENT_FOR_REDEEM: null,
      totalSupply: null,
      undistributedFeeSnacks: null,

      // Methods read only
      allowance: null,
      balanceOf: null,
      calculateBuyAmount: null,
      calculateRedeemAmount: null,
      holderList: null,

      // Results (Methods read only)
      allowanceResult: null,
      balanceOfResult: null,
      calculateBuyAmountResult: null,
      calculateRedeemAmountResult: null,
      holderListResult: null,

      // Methods write
      approve: null,
      buy: null,
      decreaseAllowance: null,
      distributeFee: null,
      increaseAllowance: null,
      init: null,
      redeem: null,
      renounceOwnership: null,
      setSeniorage: null,
      transfer: null,
      transferFrom: null,
      transferOwnership: null,

      // Results (Methods write)

      // approve
      approveSendTxTime: null,
      approveLastTransactionHash: null,
      approveLastTransactionConfirmed: null,
      // buy
      buySendTxTime: null,
      buyLastTransactionHash: null,
      buyLastTransactionConfirmed: null,
      // decreaseAllowance
      decreaseAllowanceSendTxTime: null,
      decreaseAllowanceLastTransactionHash: null,
      decreaseAllowanceLastTransactionConfirmed: null,
      // distributeFee
      distributeFeeSendTxTime: null,
      distributeFeeLastTransactionHash: null,
      distributeFeeLastTransactionConfirmed: null,
      // increaseAllowance
      increaseAllowanceSendTxTime: null,
      increaseAllowanceLastTransactionHash: null,
      increaseAllowanceLastTransactionConfirmed: null,
      // init
      initSendTxTime: null,
      initLastTransactionHash: null,
      initLastTransactionConfirmed: null,
      // redeem
      redeemSendTxTime: null,
      redeemLastTransactionHash: null,
      redeemLastTransactionConfirmed: null,
      // renounceOwnership
      renounceOwnershipSendTxTime: null,
      renounceOwnershipLastTransactionHash: null,
      renounceOwnershipLastTransactionConfirmed: null,
      // setSeniorage
      setSeniorageSendTxTime: null,
      setSeniorageLastTransactionHash: null,
      setSeniorageLastTransactionConfirmed: null,
      // transfer
      transferSendTxTime: null,
      transferLastTransactionHash: null,
      transferLastTransactionConfirmed: null,
      // transferFrom
      transferFromSendTxTime: null,
      transferFromLastTransactionHash: null,
      transferFromLastTransactionConfirmed: null,
      // transferOwnership
      transferOwnershipSendTxTime: null,
      transferOwnershipLastTransactionHash: null,
      transferOwnershipLastTransactionConfirmed: null,
    };
  }

  componentDidMount() {
    try {
      // Runs after the first render() lifecycle
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(EthSnackAddress, EthSnackAbi.abi, provider);

        // Get signer & contract for next calls
        const contractWithSigner = new ethers.Contract(EthSnackAddress, EthSnackAbi.abi, provider.getSigner());

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
        decimals: await this.state.contract.decimals(),
        FEE_BTCETH_SNACK_HOLDERS: await this.state.contract.FEE_BTCETH_SNACK_HOLDERS(),
        FEE_MASTERCHEF: await this.state.contract.FEE_MASTERCHEF(),
        FEE_PULSE: await this.state.contract.FEE_PULSE(),
        FEE_SENIORAGE: await this.state.contract.FEE_SENIORAGE(),
        FEE_SNACK_HOLDERS: await this.state.contract.FEE_SNACK_HOLDERS(),
        FEE_SNACKS_STAKING: await this.state.contract.FEE_SNACKS_STAKING(),
        FEE_ZOINKS_STAKING: await this.state.contract.FEE_ZOINKS_STAKING(),
        feeBTCETHSnacksHolders: await this.state.contract.feeBTCETHSnacksHolders(),
        feeMasterChef: await this.state.contract.feeMasterChef(),
        feePulse: await this.state.contract.feePulse(),
        feeSeniorage: await this.state.contract.feeSeniorage(),
        feeSnacksHolders: await this.state.contract.feeSnacksHolders(),
        feeSnacksStakingPool: await this.state.contract.feeSnacksStakingPool(),
        feeZoinksStakingPool: await this.state.contract.feeZoinksStakingPool(),
        isInitilized: await this.state.contract.isInitilized(),
        masterChef: await this.state.contract.masterChef(),
        multiplier: await this.state.contract.multiplier(),
        name: await this.state.contract.name(),
        numberOfHolders: await this.state.contract.numberOfHolders(),
        ONE_SNACK: await this.state.contract.ONE_SNACK(),
        owner: await this.state.contract.owner(),
        payToken: await this.state.contract.payToken(),
        pulse: await this.state.contract.pulse(),
        seniorageAddress: await this.state.contract.seniorageAddress(),
        snacks: await this.state.contract.snacks(),
        SNACKS_MULTIPLIER: await this.state.contract.SNACKS_MULTIPLIER(),
        snacksStakingPool: await this.state.contract.snacksStakingPool(),
        symbol: await this.state.contract.symbol(),
        TAX_PERCENT_FOR_BUY: await this.state.contract.TAX_PERCENT_FOR_BUY(),
        TAX_PERCENT_FOR_REDEEM: await this.state.contract.TAX_PERCENT_FOR_REDEEM(),
        totalSupply: await this.state.contract.totalSupply(),
        undistributedFeeSnacks: await this.state.contract.undistributedFeeSnacks(),
      };

      this.setState({
        decimals: allProps.decimals.toString(),
        FEE_BTCETH_SNACK_HOLDERS: allProps.FEE_BTCETH_SNACK_HOLDERS.toString(),
        FEE_MASTERCHEF: allProps.FEE_MASTERCHEF.toString(),
        FEE_PULSE: allProps.FEE_PULSE.toString(),
        FEE_SENIORAGE: allProps.FEE_SENIORAGE.toString(),
        FEE_SNACK_HOLDERS: allProps.FEE_SNACK_HOLDERS.toString(),
        FEE_SNACKS_STAKING: allProps.FEE_SNACKS_STAKING.toString(),
        FEE_ZOINKS_STAKING: allProps.FEE_ZOINKS_STAKING.toString(),
        feeBTCETHSnacksHolders: allProps.feeBTCETHSnacksHolders.toString(),
        feeMasterChef: allProps.feeMasterChef.toString(),
        feePulse: allProps.feePulse.toString(),
        feeSeniorage: allProps.feeSeniorage.toString(),
        feeSnacksHolders: allProps.feeSnacksHolders.toString(),
        feeSnacksStakingPool: allProps.feeSnacksStakingPool.toString(),
        feeZoinksStakingPool: allProps.feeZoinksStakingPool.toString(),
        isInitilized: allProps.isInitilized.toString(),
        masterChef: allProps.masterChef.toString(),
        multiplier: allProps.multiplier.toString(),
        name: allProps.name.toString(),
        numberOfHolders: allProps.numberOfHolders.toString(),
        ONE_SNACK: allProps.ONE_SNACK.toString(),
        owner: allProps.owner.toString(),
        payToken: allProps.payToken.toString(),
        pulse: allProps.pulse.toString(),
        seniorageAddress: allProps.seniorageAddress.toString(),
        snacks: allProps.snacks.toString(),
        SNACKS_MULTIPLIER: allProps.SNACKS_MULTIPLIER.toString(),
        snacksStakingPool: allProps.snacksStakingPool.toString(),
        symbol: allProps.symbol.toString(),
        TAX_PERCENT_FOR_BUY: allProps.TAX_PERCENT_FOR_BUY.toString(),
        TAX_PERCENT_FOR_REDEEM: allProps.TAX_PERCENT_FOR_REDEEM.toString(),
        totalSupply: allProps.totalSupply.toString(),
        undistributedFeeSnacks: allProps.undistributedFeeSnacks.toString(),
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

    const allowanceBlock = (this.state.allowanceResult !== null && this.state.allowanceResult !== undefined) ? (
      <p>Result: {this.state.allowanceResult ?? "?"}</p>
    ) : null;

    const balanceOfBlock = (this.state.balanceOfResult !== null && this.state.balanceOfResult !== undefined) ? (
      <p>Result: {this.state.balanceOfResult ?? "?"}</p>
    ) : null;

    const calculateBuyAmountBlock = (this.state.calculateBuyAmountResult !== null && this.state.calculateBuyAmountResult !== undefined) ? (
      <p>Result: {this.state.calculateBuyAmountResult ?? "?"}</p>
    ) : null;

    const calculateRedeemAmountBlock = (this.state.calculateRedeemAmountResult !== null && this.state.calculateRedeemAmountResult !== undefined) ? (
      <p>Result: {this.state.calculateRedeemAmountResult ?? "?"}</p>
    ) : null;

    const holderListBlock = (this.state.holderListResult !== null && this.state.holderListResult !== undefined) ? (
      <p>Result: {this.state.holderListResult ?? "?"}</p>
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

            <p>decimals</p>
            <p><span>{this.state.decimals ?? "Empty"}</span></p>
            <p>feeBTCETHSnacksHolders</p>
            <p><span>{this.state.feeBTCETHSnacksHolders ?? "Empty"}</span></p>
            <p>feeMasterChef</p>
            <p><span>{this.state.feeMasterChef ?? "Empty"}</span></p>
            <p>feePulse</p>
            <p><span>{this.state.feePulse ?? "Empty"}</span></p>
            <p>feeSeniorage</p>
            <p><span>{this.state.feeSeniorage ?? "Empty"}</span></p>
            <p>feeSnacksHolders</p>
            <p><span>{this.state.feeSnacksHolders ?? "Empty"}</span></p>
            <p>feeSnacksStakingPool</p>
            <p><span>{this.state.feeSnacksStakingPool ?? "Empty"}</span></p>
            <p>feeZoinksStakingPool</p>
            <p><span>{this.state.feeZoinksStakingPool ?? "Empty"}</span></p>
            <p>isInitilized</p>
            <p><span>{this.state.isInitilized ?? "Empty"}</span></p>
            <p>masterChef</p>
            <p><span>{this.state.masterChef ?? "Empty"}</span></p>
            <p>multiplier</p>
            <p><span>{this.state.multiplier ?? "Empty"}</span></p>
            <p>name</p>
            <p><span>{this.state.name ?? "Empty"}</span></p>
            <p>numberOfHolders</p>
            <p><span>{this.state.numberOfHolders ?? "Empty"}</span></p>
            <p>owner</p>
            <p><span>{this.state.owner ?? "Empty"}</span></p>
            <p>payToken</p>
            <p><span>{this.state.payToken ?? "Empty"}</span></p>
            <p>pulse</p>
            <p><span>{this.state.pulse ?? "Empty"}</span></p>
            <p>seniorageAddress</p>
            <p><span>{this.state.seniorageAddress ?? "Empty"}</span></p>
            <p>snacks</p>
            <p><span>{this.state.snacks ?? "Empty"}</span></p>
            <p>snacksStakingPool</p>
            <p><span>{this.state.snacksStakingPool ?? "Empty"}</span></p>
            <p>symbol</p>
            <p><span>{this.state.symbol ?? "Empty"}</span></p>
            <p>totalSupply</p>
            <p><span>{this.state.totalSupply ?? "Empty"}</span></p>
            <p>undistributedFeeSnacks</p>
            <p><span>{this.state.undistributedFeeSnacks ?? "Empty"}</span></p>
          </div>

          <div className="methods">
            <h2>Methods: read</h2>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const owner = event.target.owner.value;
              const spender = event.target.spender.value;
              this.utils.methodCall("allowance", async (value) => {
                const result = value.toString();
                const time = this.utils.getTime();
                this.setState({ allowanceResult: `${result} (${time})` });
              }, owner, spender);
            }}>
              <h3>allowance</h3>

              <label><strong>address owner</strong></label>
              <input name="owner" type="text" placeholder="Input owner" /><br />
              <label><strong>address spender</strong></label>
              <input name="spender" type="text" placeholder="Input spender" /><br />
              <input type="submit" value="Run allowance" />
              {allowanceBlock}
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const account = event.target.account.value;
              this.utils.methodCall("balanceOf", async (value) => {
                const result = value.toString();
                const time = this.utils.getTime();
                this.setState({ balanceOfResult: `${result} (${time})` });
              }, account);
            }}>
              <h3>balanceOf</h3>

              <label><strong>address account</strong></label>
              <input name="account" type="text" placeholder="Input owner" /><br />

              <input type="submit" value="Run balanceOf" />
              {balanceOfBlock}
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const currentTotalSupply = this.utils.inputToBigNumber("calculateBuyAmount", event.target.currentTotalSupply.value);
              const amountSnacksToMint = this.utils.inputToBigNumber("calculateBuyAmount", event.target.amountSnacksToMint.value);
              this.utils.methodCall("calculateBuyAmount", async (value) => {
                const result = value.toString();
                const time = this.utils.getTime();
                this.setState({ calculateBuyAmountResult: `${result} (${time})` });
              }, currentTotalSupply, amountSnacksToMint);
            }}>
              <h3>calculateBuyAmount</h3>

              <label><strong>uint256 currentTotalSupply</strong></label>
              <input name="currentTotalSupply" type="text" placeholder="Input data" /><br />
              <label><strong>uint256 amountSnacksToMint</strong></label>
              <input name="amountSnacksToMint" type="text" placeholder="Input data" /><br />
              <input type="submit" value="Run calculateBuyAmount" />
              {calculateBuyAmountBlock}
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const currentTotalSupply = this.utils.inputToBigNumber("calculateRedeemAmount", event.target.currentTotalSupply.value);
              const amountSnacksToBurn = this.utils.inputToBigNumber("calculateRedeemAmount", event.target.amountSnacksToBurn.value);
              this.utils.methodCall("calculateRedeemAmount", async (value) => {
                const result = value.toString();
                const time = this.utils.getTime();
                this.setState({ calculateRedeemAmountResult: `${result} (${time})` });
              }, currentTotalSupply, amountSnacksToBurn);
            }}>
              <h3>calculateRedeemAmount</h3>

              <label><strong>uint256 currentTotalSupply</strong></label>
              <input name="currentTotalSupply" type="text" placeholder="Input data" /><br />
              <label><strong>uint256 amountSnacksToBurn</strong></label>
              <input name="amountSnacksToBurn" type="text" placeholder="Input data" /><br />
              <input type="submit" value="Run calculateRedeemAmount" />
              {calculateRedeemAmountBlock}
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const index = event.target.index.value;
              this.utils.methodCall("holderList", async (value) => {
                const result = value.toString();
                const time = this.utils.getTime();
                this.setState({ allowanceResult: `${result} (${time})` });
              }, index);
            }}>
              <h3>holderList</h3>

              <label><strong>uint256 index</strong></label>
              <input name="index" type="text" placeholder="Input data" /><br />
              <input type="submit" value="Run holderList" />
              {holderListBlock}
            </form>

          </div>

          <div className="fromERC-20">
            <h2>Methods: write</h2>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const spender = event.target.spender.value;
              const amount = this.utils.inputToBigNumber("approve", event.target.amount.value);
              this.utils.methodSend("approve", spender, amount);
            }}>
              <h3>approve</h3>

              <label><strong>address spender</strong></label>
              <input name="spender" type="text" placeholder="Input data" /><br />
              <label><strong>uint256 amount</strong></label>
              <input name="amount" type="text" placeholder="Input data" /><br />

              <input type="submit" value="Run approve" />
              <TransactionInfo
                sendTxTime={this.state.approveSendTxTime}
                lastTransactionHash={this.state.approveLastTransactionHash}
                lastTransactionConfirmed={this.state.approveLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const amountSnacksToMint = this.utils.inputToBigNumber("buy", event.target.amountSnacksToMint.value);
              this.utils.methodSend("buy", amountSnacksToMint);
            }}>
              <h3>buy</h3>

              <label><strong>uint256 amountSnacksToMint</strong></label>
              <input name="amountSnacksToMint" type="text" placeholder="Input data" /><br />

              <input type="submit" value="Run buy" />
              <TransactionInfo
                sendTxTime={this.state.buySendTxTime}
                lastTransactionHash={this.state.buyLastTransactionHash}
                lastTransactionConfirmed={this.state.buyLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const spender = event.target.spender.value;
              const subtractedValue = this.utils.inputToBigNumber("decreaseAllowance", event.target.subtractedValue.value);
              this.utils.methodSend("decreaseAllowance", spender, subtractedValue);
            }}>
              <h3>decreaseAllowance</h3>

              <label><strong>address spender</strong></label>
              <input name="spender" type="text" placeholder="Input data" /><br />
              <label><strong>uint256 subtractedValue</strong></label>
              <input name="subtractedValue" type="text" placeholder="Input data" /><br />

              <input type="submit" value="Run decreaseAllowance" />
              <TransactionInfo
                sendTxTime={this.state.decreaseAllowanceSendTxTime}
                lastTransactionHash={this.state.decreaseAllowanceLastTransactionHash}
                lastTransactionConfirmed={this.state.decreaseAllowanceLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              this.utils.methodSend("distributeFee");
            }}>
              <h3>distributeFee</h3>

              <input type="submit" value="Run distributeFee" />
              <TransactionInfo
                sendTxTime={this.state.distributeFeeSendTxTime}
                lastTransactionHash={this.state.distributeFeeLastTransactionHash}
                lastTransactionConfirmed={this.state.distributeFeeLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const spender = event.target.spender.value;
              const addedValue = this.utils.inputToBigNumber("increaseAllowance", event.target.addedValue.value);
              this.utils.methodSend("increaseAllowance", spender, addedValue);
            }}>
              <h3>increaseAllowance</h3>

              <label><strong>address spender</strong></label>
              <input name="spender" type="text" placeholder="Input data" /><br />
              <label><strong>uint256 addedValue</strong></label>
              <input name="addedValue" type="text" placeholder="Input data" /><br />

              <input type="submit" value="Run increaseAllowance" />
              <TransactionInfo
                sendTxTime={this.state.increaseAllowanceSendTxTime}
                lastTransactionHash={this.state.increaseAllowanceLastTransactionHash}
                lastTransactionConfirmed={this.state.increaseAllowanceLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const snacks_ = event.target.snacks_.value;
              this.utils.methodSend("init", snacks_);
            }}>
              <h3>init</h3>

              <label><strong>address snacks_</strong></label>
              <input name="snacks_" type="text" placeholder="Input address" /><br />

              <input type="submit" value="Run init" />
              <TransactionInfo
                sendTxTime={this.state.initSendTxTime}
                lastTransactionHash={this.state.initLastTransactionHash}
                lastTransactionConfirmed={this.state.initLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const amountSnacksToBurn = this.utils.inputToBigNumber("redeem", event.target.amountSnacksToBurn.value);
              this.utils.methodSend("redeem", amountSnacksToBurn);
            }}>
              <h3>redeem</h3>

              <label><strong>address amountSnacksToBurn</strong></label>
              <input name="amountSnacksToBurn" type="text" placeholder="Input data" /><br />

              <input type="submit" value="Run redeem" />
              <TransactionInfo
                sendTxTime={this.state.redeemSendTxTime}
                lastTransactionHash={this.state.redeemLastTransactionHash}
                lastTransactionConfirmed={this.state.redeemLastTransactionConfirmed} />
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
              const seniorage = event.target.seniorage.value;
              this.utils.methodSend("setSeniorage", seniorage);
            }}>
              <h3>setSeniorage</h3>

              <label><strong>address seniorage</strong></label>
              <input name="seniorage" type="text" placeholder="Input data" /><br />

              <input type="submit" value="Run setSeniorage" />
              <TransactionInfo
                sendTxTime={this.state.setSeniorageSendTxTime}
                lastTransactionHash={this.state.setSeniorageLastTransactionHash}
                lastTransactionConfirmed={this.state.setSeniorageLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const recipient = event.target.recipient.value;
              const amount = this.utils.inputToBigNumber("transfer", event.target.amount.value);
              this.utils.methodSend("transfer", recipient, amount);
            }}>
              <h3>transfer</h3>

              <label><strong>address recipient</strong></label>
              <input name="recipient" type="text" placeholder="Input recipient address" /><br />

              <label><strong>uint256 amount</strong></label>
              <input name="amount" type="text" placeholder="Input amount" /><br />

              <input type="submit" value="Run transfer" />
              <TransactionInfo
                sendTxTime={this.state.transferSendTxTime}
                lastTransactionHash={this.state.transferLastTransactionHash}
                lastTransactionConfirmed={this.state.transferLastTransactionConfirmed} />
            </form>

            <form className="form" action="#" onSubmit={(event) => {
              event.preventDefault();
              const sender = event.target.sender.value;
              const recipient = event.target.recipient.value;
              const amount = this.utils.inputToBigNumber("transferFrom", event.target.amount.value);
              this.utils.methodSend("transferFrom", sender, recipient, amount);
            }}>
              <h3>transferFrom</h3>

              <label><strong>address sender</strong></label>
              <input name="sender" type="text" placeholder="Input sender address" /><br />

              <label><strong>address recipient</strong></label>
              <input name="recipient" type="text" placeholder="Input recipient address" /><br />

              <label><strong>uint256 amount</strong></label>
              <input name="amount" type="text" placeholder="Input amount" /><br />

              <input type="submit" value="Run transferFrom" />
              <TransactionInfo
                sendTxTime={this.state.transferFromSendTxTime}
                lastTransactionHash={this.state.transferFromLastTransactionHash}
                lastTransactionConfirmed={this.state.transferFromLastTransactionConfirmed} />
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
          </div>
        </div>
      </>
    );
  }
}

export default EthSnacks;
