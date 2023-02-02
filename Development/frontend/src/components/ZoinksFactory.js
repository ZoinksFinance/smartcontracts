import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import ZoinksFactoryAbi from "../abis/ZoinksFactory.json";
import { ZoinksFactoryAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";

class ZoinksFactory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Blockchain connection
      provider: null,
      contract: null,

      // General
      loading: false,

      // Propierties from left side
      INIT_CODE_PAIR_HASH: null,
      feeTo: null,
      feeToSetter: null,

      getPair: null, // mapping
      allPairs: null, // array
      allPairsLength: null, // funcResult

      // transfer
      createPairSendTxTime: null,
      createPairLastTransactionHash: null,
      createPairLastTransactionConfirmed: null,
    };
  }

  componentDidMount() {
    try {
      // Runs after the first render() lifecycle
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          ZoinksFactoryAddress,
          ZoinksFactoryAbi.abi,
          provider
        );

        this.setState({
          provider: provider,
          contract: contract,
        });
      } else {
        console.warn("Please install MetaMask");
      }
    } catch (error) {
      console.error(`Error in componentDidMount: ${error}`);
    }
  }

  // Reading all props from blockchain and show it's on page
  async readProps() {
    const allProps = {
      INIT_CODE_PAIR_HASH: await this.state.contract.INIT_CODE_PAIR_HASH(),
      feeTo: await this.state.contract.feeTo(),
      feeToSetter: await this.state.contract.feeToSetter(),

      allPairs: await this.state.contract.allPairs(0).catch(() => {
        console.warn("allPairs is empty");
      }),
    };

    this.setState({
      INIT_CODE_PAIR_HASH: allProps.INIT_CODE_PAIR_HASH.toString(),
      feeTo: allProps.feeTo.toString(),
      feeToSetter: allProps.feeToSetter.toString(),
      allPairs: allProps.allPairs ?? "[]",
    });
  }

  async getPair(firstToken, secondToken) {
    try {
      await checkChainId();
      const address = (
        await this.state.contract.getPair(firstToken, secondToken)
      ).toString();
      this.setState({ getPair: address });
    } catch (error) {
      await this.showError("getPair", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  // ! change
  async allPairsLength() {
    try {
      await checkChainId();

      const length = (await this.state.contract.allPairsLength()).toString();

      this.setState({ allPairsLength: length });
    } catch (error) {
      await this.showError("allPairsLength", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  // Write function
  async methodSend(method, ...rest) {
    // Example ...rest: address, amount; method: mint
    try {
      // Get signer & contract for next calls
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        ZoinksFactoryAddress,
        ZoinksFactoryAbi.abi,
        signer
      );

      // Log
      console.debug("methodSend.1");
      console.log(`Calling ${method}`, ...rest);
      // Loader
      console.debug("methodSend.2");
      this.setState({ loading: true });
      // Work
      console.debug("methodSend.3");
      await checkChainId();
      // Call function & and set state
      console.debug("methodSend.4");
      const transaction = await contractWithSigner[method](...rest);
      console.debug("methodSend.5");
      if (transaction.code !== 4001) {
        // Set txTime, txHash, txConfirmations
        console.debug("methodSend.5.1");
        await this.transactionProcessing(method, transaction);
      }
      console.debug("methodSend.6");
    } catch (error) {
      console.debug("methodSend.7");
      await this.showError(method, error);
      console.debug("methodSend.8");
    } finally {
      console.debug("methodSend.9");
      this.setState({ loading: false });
      console.debug("methodSend.10");
    }
  }

  // ! Processing part
  // Set tx state values and wait for confirmations
  async transactionProcessing(method, tx) {
    this.setState({ [method + "LastTransactionConfirmed"]: 0 });
    this.setState({
      [method + "SendTxTime"]: tx.timestamp ?? "Error",
      [method + "LastTransactionHash"]: tx.hash ?? "Error",
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        this.setState({
          [method + "LastTransactionConfirmed"]:
            transactionReceipt.confirmations,
        });
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

  // Show error to user in alert and in console
  async showError(method, error) {
    let isErrorToShow = false;
    let msg = "";
    if (error) {
      if (error.reason) {
        msg = `Error in ${method}. Details: ${error.reason}`;
        isErrorToShow = true;
      } else {
        msg = `Error in ${method}. Details: ${error}`;
        isErrorToShow = true;
      }
    } else {
      msg = `Error in ${method}.`;
      isErrorToShow = true;
    }
    if (isErrorToShow) {
      console.error(msg);
      alert(msg);
    }
  }

  // Render de la DApp
  render() {
    let getPairResult =
      this.state.getPair !== null ? (
        <p>
          Returned result:
          {this.state.getPair ?? "?"}
        </p>
      ) : null;

    let allPairsLength =
      this.state.allPairsLength !== null ? (
        <p>
          Returned result:
          {this.state.allPairsLength ?? "?"}
        </p>
      ) : null;

    // createPair
    let createPairTime =
      this.state.createPairSendTxTime !== null ? (
        <p>Transaction time: {this.state.createPairSendTxTime ?? "?"}</p>
      ) : null;

    let createPairResult =
      this.state.createPairLastTransactionHash !== null ? (
        <p>Transaction: {this.state.createPairLastTransactionHash ?? "?"}</p>
      ) : null;

    let createPairConfirmations =
      this.state.createPairLastTransactionConfirmed !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.createPairLastTransactionConfirmed ?? "0"}
        </p>
      ) : null;
    return (
      <>
        <div className="container">
          <div className="propsContainer">
            <h2>Properties</h2>
            <button
              onClick={(event) => {
                event.preventDefault();
                this.readProps();
              }}
            >
              Refresh Properties
            </button>

            <p>INIT_CODE_PAIR_HASH: </p>
            <p>
              <span>{this.state.INIT_CODE_PAIR_HASH ?? "Empty"}</span>
            </p>
            <p>feeTo:</p>
            <p>
              <span>{this.state.feeTo ?? "Empty"}</span>
            </p>
            <p>feeToSetter:</p>
            <p>
              <span>{this.state.feeToSetter ?? "Empty"}</span>
            </p>

            <p>AllPairs:</p>
            <p>
              <span>{this.state.allPairs ?? "Empty"}</span>
            </p>

            <br />

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const firstToken = event.target.firstToken.value;
                const secondToken = event.target.secondToken.value;
                this.getPair(firstToken, secondToken);
              }}
            >
              <h3>GetPair:</h3>

              <label>
                <strong>First token address:</strong>
              </label>
              <input
                type="text"
                placeholder="Input first token address"
                name="firstToken"
              />

              <br />
              <label>
                <strong>Second token address:</strong>
              </label>
              <input
                type="text"
                placeholder="Input second token address"
                name="secondToken"
              />

              <br />

              <input type="submit" value="Run getPair" />
              {getPairResult}
            </form>
          </div>

          <div className="methods">
            <h2>Methods</h2>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                this.allPairsLength();
              }}
            >
              <h3>allPairsLength</h3>

              <input type="submit" value="Run allPairsLength" />

              {allPairsLength}
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const tokenA = event.target.tokenA.value;
                const tokenB = event.target.tokenB.value;

                this.methodSend("createPair", tokenA, tokenB);
              }}
            >
              <h3>createPair</h3>

              <label>
                <strong>Token A address:</strong>
              </label>
              <input
                name="tokenA"
                type="text"
                placeholder="Input token A address"
              />
              <br />

              <label>
                <strong>Token B address</strong>
              </label>
              <input
                name="tokenB"
                type="text"
                placeholder="Input token B address"
              />
              <br />

              <input type="submit" value="Run createPair" />

              <br />

              {createPairResult}
              {createPairTime}
              {createPairConfirmations ??
                "After sending the transaction, you need to wait for enough confirmations"}
            </form>

            <form action="#" method="post" id="setFeeTo" className="form">
              <h3>setFeeTo</h3>

              <label htmlFor="address_feeTo">
                <strong>address_feeTo</strong>
              </label>
              <input
                name="address_feeTo"
                type="text"
                placeholder="Input address feeTo"
              />
              <br />

              <input type="submit" value="Run setFeeTo" />
            </form>

            <form action="#" method="post" id="setFeeToSetter" className="form">
              <h3>setFeeToSetter</h3>

              <label htmlFor="address_feeToSetter">
                <strong>address_feeToSetter</strong>
              </label>
              <input
                name="address_feeToSetter"
                type="text"
                placeholder="Input Fee setter address"
              />
              <br />

              <input type="submit" value="Run setFeeToSetter" />
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default ZoinksFactory;
