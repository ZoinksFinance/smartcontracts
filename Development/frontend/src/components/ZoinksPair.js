import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import ZoinksPairAbi from "../abis/ZoinksPair.json";
import { ZoinksPairAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";

class ZoinksPair extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Blockchain connection
      provider: null,
      contract: null,

      // General
      loading: false,

      // Propierties from left side

      MINIMUM_LIQUIDITY: null,
      factory: null,
      token0: null,
      token1: null,
      price0CumulativeLast: null,
      price1CumulativeLast: null,
      kLast: null,

      // getReserves
      getReserves: {
        _reserve0: null,
        _reserve1: null,
        _blockTimestampLast: null,
      },

      // initialize
      initializeSendTxTime: null,
      initializeLastTransactionHash: null,
      initializeLastTransactionConfirmed: null,

      // mint
      mintSendTxTime: null,
      mintLastTransactionHash: null,
      mintLastTransactionConfirmed: null,

      // swap
      swapSendTxTime: null,
      swapLastTransactionHash: null,
      swapLastTransactionConfirmed: null,
    };
  }

  componentDidMount() {
    try {
      // Runs after the first render() lifecycle
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          ZoinksPairAddress,
          ZoinksPairAbi.abi,
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
      MINIMUM_LIQUIDITY: await this.state.contract.MINIMUM_LIQUIDITY(),
      factory: await this.state.contract.factory(),
      token0: await this.state.contract.token0(),
      token1: await this.state.contract.token1(),
      price0CumulativeLast: await this.state.contract.price0CumulativeLast(),
      price1CumulativeLast: await this.state.contract.price1CumulativeLast(),
      kLast: await this.state.contract.kLast(),
    };

    this.setState({
      MINIMUM_LIQUIDITY: allProps.MINIMUM_LIQUIDITY.toString(),
      factory: allProps.factory.toString(),
      token0: allProps.token0.toString(),
      token1: allProps.token1.toString(),
      price0CumulativeLast: allProps.price0CumulativeLast.toString(),
      price1CumulativeLast: allProps.price1CumulativeLast.toString(),
      kLast: allProps.kLast.toString(),
    });
  }

  async getReserves() {
    try {
      await checkChainId();
      let result = await this.state.contract.getReserves();
      this.setState({ getReserves: result });
    } catch (error) {
      await this.showError("getReserves", error);
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
        ZoinksPairAddress,
        ZoinksPairAbi.abi,
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

  inputToBigNumber(method, txtInputValue) {
    try {
      console.log(`Process in ${method}:`, txtInputValue);
      const decimals = 18;
      const input = txtInputValue; // Note: this is a string, e.g. user input
      const value = ethers.utils.parseUnits(input, decimals);
      return value;
    } catch (error) {
      console.error(`Error in ${method}`, error);
      const errMsg = `Error in ${method}: ${error}`;
      alert(errMsg);
      return undefined;
    }
  }

  // Render de la DApp
  render() {
    let reserve0, reserve1, blockLastTime;
    if (this.state.getReserves._reserve0 !== null) {
      reserve0 = (
        <p>Reserve0: {this.state.getReserves._reserve0.toString() ?? "?"}</p>
      );
      reserve1 = (
        <p>Reserve1: {this.state.getReserves._reserve1.toString() ?? "?"}</p>
      );

      blockLastTime = (
        <p>
          BlockTimestampLast:
          {this.state.getReserves._blockTimestampLast.toString() ?? "?"}
        </p>
      );
    }

    // initialize
    let initializeTime =
      this.state.initializeSendTxTime !== null ? (
        <p>Transaction time: {this.state.initializeSendTxTime ?? "?"}</p>
      ) : null;

    let initializeResult =
      this.state.initializeLastTransactionHash !== null ? (
        <p>Transaction: {this.state.initializeLastTransactionHash ?? "?"}</p>
      ) : null;

    let initializeConfirmations =
      this.state.initializeLastTransactionConfirmed !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.initializeLastTransactionConfirmed ?? "0"}
        </p>
      ) : null;

    // mint
    let mintTime =
      this.state.mintSendTxTime !== null ? (
        <p>Transaction time: {this.state.mintSendTxTime ?? "?"}</p>
      ) : null;

    let mintResult =
      this.state.mintLastTransactionHash !== null ? (
        <p>Transaction: {this.state.mintLastTransactionHash ?? "?"}</p>
      ) : null;

    let mintConfirmations =
      this.state.mintLastTransactionConfirmed !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.mintLastTransactionConfirmed ?? "0"}
        </p>
      ) : null;

    // swap
    let swapTime =
      this.state.swapSendTxTime !== null ? (
        <p>Transaction time: {this.state.swapSendTxTime ?? "?"}</p>
      ) : null;

    let swapResult =
      this.state.swapLastTransactionHash !== null ? (
        <p>Transaction: {this.state.swapLastTransactionHash ?? "?"}</p>
      ) : null;

    let swapConfirmations =
      this.state.swapLastTransactionConfirmed !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.swapLastTransactionConfirmed ?? "0"}
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

            <p>MINIMUM_LIQUIDITY: </p>
            <p>
              <span>{this.state.MINIMUM_LIQUIDITY ?? "Empty"}</span>
            </p>

            <p>factory:</p>
            <p>
              <span>{this.state.factory ?? "Empty"}</span>
            </p>

            <p>token0:</p>
            <p>
              <span>{this.state.token0 ?? "Empty"}</span>
            </p>

            <p>token1:</p>
            <p>
              <span>{this.state.token1 ?? "Empty"}</span>
            </p>

            <p>price0CumulativeLast:</p>
            <p>
              <span>{this.state.price0CumulativeLast ?? "Empty"}</span>
            </p>

            <p>price1CumulativeLast:</p>
            <p>
              <span>{this.state.price1CumulativeLast ?? "Empty"}</span>
            </p>

            <p>kLast:</p>
            <p>
              <span>{this.state.kLast ?? "Empty"}</span>
            </p>
          </div>

          <div className="methods">
            <h2>Methods</h2>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                this.getReserves();
              }}
            >
              <h3>getReserves</h3>

              <input type="submit" value="Run getReserves" />

              {reserve0}
              {reserve1}
              {blockLastTime}
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const tokenA = event.target.tokenA.value;
                const tokenB = event.target.tokenB.value;

                this.methodSend("initialize", tokenA, tokenB);
              }}
            >
              <h3>initialize</h3>

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

              <input type="submit" value="Run initialize" />

              <br />

              {initializeResult}
              {initializeTime}
              {initializeConfirmations ??
                "After sending the transaction, you need to wait for enough confirmations"}
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const addressTo = event.target.mintAddress.value;

                this.methodSend("mint", addressTo);
              }}
            >
              <h3>mint</h3>

              <label>
                <strong>Address to:</strong>
              </label>
              <input
                name="mintAddress"
                type="text"
                placeholder="Input address"
              />
              <br />

              <input type="submit" value="Run mint" />

              <br />

              {mintResult}
              {mintTime}
              {mintConfirmations ??
                "After sending the transaction, you need to wait for enough confirmations"}
            </form>

            <form
              data-returns="true"
              action="#"
              method="post"
              id="burn"
              className="form"
            >
              <h3>burn</h3>

              <label htmlFor="address_to">
                <strong>address_to</strong>
              </label>
              <input
                name="address_to"
                type="text"
                placeholder="Input address to"
              />
              <br />

              <input type="submit" value="Run burn" />
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const amount0Out = event.target.amount0Out.value;
                const amount1Out = event.target.amount1Out.value;
                const addressTo = event.target.addressTo.value;
                let data = event.target.data.value;

                if (!data) {
                  data = "0x00";
                }

                this.methodSend(
                  "swap",
                  amount0Out,
                  amount1Out,
                  addressTo,
                  data
                );
              }}
            >
              <h3>swap</h3>

              <label>
                <strong>Amount0Out</strong>
              </label>

              <input
                name="amount0Out"
                type="text"
                placeholder="Input token0 output"
              />
              <br />

              <label>
                <strong>Amount1Out</strong>
              </label>

              <input
                name="amount1Out"
                type="text"
                placeholder="Input token1 output"
              />
              <br />

              <label>
                <strong>Address to:</strong>
              </label>

              <input
                name="addressTo"
                type="text"
                placeholder="Input address to"
              />
              <br />

              <label>
                <strong>Bytes Data:</strong>
              </label>

              <input name="data" type="text" placeholder="Input data" />
              <br />

              <input type="submit" value="Run swap" />

              <br />

              {swapResult}
              {swapTime}
              {swapConfirmations ??
                "After sending the transaction, you need to wait for enough confirmations"}
            </form>

            <form action="#" method="post" id="skim" className="form">
              <h3>skim</h3>

              <label htmlFor="address_to">
                <strong>address_to</strong>
              </label>
              <input
                name="address_to"
                type="text"
                placeholder="Input address to"
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

export default ZoinksPair;
