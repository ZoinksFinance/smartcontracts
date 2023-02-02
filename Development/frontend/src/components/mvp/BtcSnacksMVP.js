import React, { Component } from "react";
import "./../App.css";

import { ethers } from "ethers";
import BtcSnacksAbi from "../../abis/BtcSnacks.json";
import BEP20Abi from "../../abis/BEP20.json";
import { BtcSnackAddress, BTCAddress } from "./../addresses.js";
import TransactionInfo from "./../common/TransactionInfo.js";
import BlockchainUtils from "./../common/BlockchainUtils.js";

class BtcSnacksMVP extends Component {

  constructor(props) {
    super(props);
    this.utils = null;
    this.utilsBTC = null;
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
      buy: null,
      redeem: null,
      distributeFee: null,

      // Results (Methods write)

      // buy
      buySendTxTime: null,
      buyLastTransactionHash: null,
      buyLastTransactionConfirmed: null,
      // redeem
      redeemSendTxTime: null,
      redeemLastTransactionHash: null,
      redeemLastTransactionConfirmed: null,
      // distributeFee
      distributeFeeSendTxTime: null,
      distributeFeeLastTransactionHash: null,
      distributeFeeLastTransactionConfirmed: null,
    };
  }

  componentDidMount() {
    try {
      // Runs after the first render() lifecycle
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(BtcSnackAddress, BtcSnacksAbi.abi, provider);

        // Get signer & contract for next calls
        const contractWithSigner = new ethers.Contract(BtcSnackAddress, BtcSnacksAbi.abi, provider.getSigner());
        const contractBTCWithSigner = new ethers.Contract(BTCAddress, BEP20Abi.abi, provider.getSigner());

        this.setState({
          provider: provider,
          contract: contract,
          contractWithSigner: contractWithSigner
        });

        this.utils = new BlockchainUtils(contractWithSigner, contract, this.transactionProcessing, true, this, provider);
        this.utilsBTC = new BlockchainUtils(contractBTCWithSigner, null, this.transactionProcessing, false, this, provider);
      } else {
        const msgError1 = "Please install MetaMask";
        console.error(msgError1)
        alert(msgError1);
      }
    } catch (error) {
      const msgError2 = `Error in BtcSnacks componentDidMount: ${error}`;
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
        <h2>BtcSnacks</h2>

        <form className="form" action="#" onSubmit={async (event) => {
          event.preventDefault();
          const amountSnacksToMint = this.utils.inputToBigNumber("buy", event.target.amountSnacksToMint.value);
          // approve(address spender, uint256 amount)
          const sender = BtcSnackAddress;
          await this.utilsBTC.methodSend("approve", sender, amountSnacksToMint);
          // buy(uint256 amountSnacksToMint)
          this.utils.methodSend("buy", amountSnacksToMint);
        }}>
          <h3>Buy</h3>

          <label><strong>Amount snacks to mint</strong></label>
          <input name="amountSnacksToMint" type="text" placeholder="Input amount" /><br />

          <input type="submit" value="Run" />
          <TransactionInfo
            sendTxTime={this.state.buySendTxTime}
            lastTransactionHash={this.state.buyLastTransactionHash}
            lastTransactionConfirmed={this.state.buyLastTransactionConfirmed} />
        </form>

        <form className="form" action="#" onSubmit={(event) => {
          event.preventDefault();
          const amountSnacksToBurn = this.utils.inputToBigNumber("redeem", event.target.amountSnacksToBurn.value);
          // redeem(uint256 amountSnacksToBurn)
          this.utils.methodSend("redeem", amountSnacksToBurn);
        }}>
          <h3>Redeem</h3>

          <label><strong>Amount snacks to burn</strong></label>
          <input name="amountSnacksToBurn" type="text" placeholder="Input amount" /><br />

          <input type="submit" value="Run" />
          <TransactionInfo
            sendTxTime={this.state.redeemSendTxTime}
            lastTransactionHash={this.state.redeemLastTransactionHash}
            lastTransactionConfirmed={this.state.redeemLastTransactionConfirmed} />
        </form>

        <form className="form" action="#" onSubmit={(event) => {
          event.preventDefault();
          // distributeFee()
          this.utils.methodSend("distributeFee");
        }}>
          <h3>Distribute fee</h3>

          <input type="submit" value="Run" />
          <TransactionInfo
            sendTxTime={this.state.distributeFeeSendTxTime}
            lastTransactionHash={this.state.distributeFeeLastTransactionHash}
            lastTransactionConfirmed={this.state.distributeFeeLastTransactionConfirmed} />
        </form>
      </>
    );
  }
}

export default BtcSnacksMVP;
