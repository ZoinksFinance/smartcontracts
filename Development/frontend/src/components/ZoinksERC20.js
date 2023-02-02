import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import ZoinksERC20Abi from "../abis/ZoinksERC20.json";
import { ZoinksERC20Address } from "./addresses.js";
import { checkChainId } from "./connectWallet";

class ZoinksERC20 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Blockchain connection
      provider: null,
      contract: null,

      // General
      loading: false,

      // Propierties from left side
      name: null,
      symbol: null,
      decimals: null,
      totalSupply: null,
      balanceOf: null,
      allowance: null,
      DOMAIN_SEPARATOR: null,
      PERMIT_TYPEHASH: null,
      nonces: null,

      // transfer
      transferSendTxTime: null,
      transferLastTransactionHash: null,
      transferLastTransactionConfirmed: null,

      // permit
      permitSendTxTime: null,
      permitLastTransactionHash: null,
      permitLastTransactionConfirmed: null,
    };
  }

  componentDidMount() {
    try {
      // Runs after the first render() lifecycle
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          ZoinksERC20Address,
          ZoinksERC20Abi.abi,
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
      name: await this.state.contract.name(),
      symbol: await this.state.contract.symbol(),
      decimals: await this.state.contract.decimals(),
      totalSupply: await this.state.contract.totalSupply(),
      DOMAIN_SEPARATOR: await this.state.contract.DOMAIN_SEPARATOR(),
      PERMIT_TYPEHASH: await this.state.contract.PERMIT_TYPEHASH(),
    };

    this.setState({
      name: allProps.name.toString(),
      symbol: allProps.symbol.toString(),
      decimals: allProps.decimals.toString(),
      totalSupply: allProps.totalSupply.toString(),
      DOMAIN_SEPARATOR: allProps.DOMAIN_SEPARATOR.toString(),
      PERMIT_TYPEHASH: allProps.PERMIT_TYPEHASH.toString(),
    });
  }

  // Read function
  async balanceOf(targetAddress) {
    try {
      await checkChainId();
      const value = (
        await this.state.contract.balanceOf(targetAddress)
      ).toString();
      this.setState({ balanceOf: value });
    } catch (error) {
      await this.showError("balanceOf", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async allowance(owner, spender) {
    try {
      await checkChainId();
      const value = (
        await this.state.contract.allowance(owner, spender)
      ).toString();
      this.setState({ allowance: value });
    } catch (error) {
      await this.showError("allowance", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async nonces(targetAddress) {
    try {
      await checkChainId();
      const value = (
        await this.state.contract.nonces(targetAddress)
      ).toString();
      this.setState({ nonces: value });
    } catch (error) {
      await this.showError("nonces", error);
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
        ZoinksERC20Address,
        ZoinksERC20Abi.abi,
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
    let balanceOfResult =
      this.state.balanceOf !== null ? (
        <p>
          Returned result:
          {this.state.balanceOf ?? "?"}
        </p>
      ) : null;

    let allowanceResult =
      this.state.allowance !== null ? (
        <p>
          Returned result:
          {this.state.allowance ?? "?"}
        </p>
      ) : null;

    let noncesResult =
      this.state.nonces !== null ? (
        <p>
          Returned result:
          {this.state.nonces ?? "?"}
        </p>
      ) : null;

    // transfer
    let transferTime =
      this.state.transferSendTxTime !== null ? (
        <p>Transaction time: {this.state.transferSendTxTime ?? "?"}</p>
      ) : null;

    let transferResult =
      this.state.transferLastTransactionHash !== null ? (
        <p>Transaction: {this.state.transferLastTransactionHash ?? "?"}</p>
      ) : null;

    let transferConfirmations =
      this.state.transferLastTransactionConfirmed !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.transferLastTransactionConfirmed ?? "0"}
        </p>
      ) : null;

    // permit
    let permitTime =
      this.state.permitSendTxTime !== null ? (
        <p>Transaction time: {this.state.permitSendTxTime ?? "?"}</p>
      ) : null;

    let permitResult =
      this.state.permitLastTransactionHash !== null ? (
        <p>Transaction: {this.state.permitLastTransactionHash ?? "?"}</p>
      ) : null;

    let permitConfirmations =
      this.state.permitLastTransactionConfirmed !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.permitLastTransactionConfirmed ?? "0"}
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
            <p>Name: </p>
            <p>
              <span>{this.state.name ?? "Empty"}</span>
            </p>
            <p>Symbol:</p>
            <p>
              <span>{this.state.symbol ?? "Empty"}</span>
            </p>
            <p>Decimals:</p>
            <p>
              <span>{this.state.decimals ?? "Empty"}</span>
            </p>
            <p>TotalSupply:</p>
            <p>
              <span>{this.state.totalSupply ?? "Empty"}</span>
            </p>
            <p>DOMAIN_SEPARATOR:</p>
            <p>
              <span>{this.state.DOMAIN_SEPARATOR ?? "Empty"}</span>
            </p>
            <p>PERMIT_TYPEHASH:</p>
            <p>
              <span>{this.state.PERMIT_TYPEHASH ?? "Empty"}</span>
            </p>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const targetAddress = event.target.targetAddress.value;
                this.balanceOf(targetAddress);
              }}
            >
              <h3>balanceOf:</h3>

              <label>
                <strong>Address:</strong>
              </label>
              <input
                type="text"
                placeholder="Input address"
                name="targetAddress"
              />

              <br />

              <input type="submit" value="Run balanceOf" />
              {balanceOfResult}
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const ownerAddress = event.target.ownerAddress.value;
                const spenderAddress = event.target.spenderAddress.value;
                this.allowance(ownerAddress, spenderAddress);
              }}
            >
              <h3>Allowance:</h3>

              <label>
                <strong>Address owner:</strong>
              </label>
              <input
                type="text"
                placeholder="Input owner address"
                name="ownerAddress"
              />

              <br />
              <label>
                <strong>Address spender:</strong>
              </label>
              <input
                type="text"
                placeholder="Input spender address"
                name="spenderAddress"
              />

              <br />

              <input type="submit" value="Run allowance" />
              {allowanceResult}
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const targetAddress = event.target.targetAddress.value;
                this.nonces(targetAddress);
              }}
            >
              <h3>Nonces:</h3>

              <label>
                <strong>Address:</strong>
              </label>
              <input
                type="text"
                placeholder="Input address"
                name="targetAddress"
              />

              <br />

              <input type="submit" value="Run balanceOf" />
              {noncesResult}
            </form>
          </div>

          <div className="methods">
            <h2>Methods</h2>

            <form
              data-returns="true"
              action="#"
              method="post"
              id="approve"
              className="form"
            >
              <h3>approve</h3>

              <label htmlFor="address_spender">
                <strong>address_spender</strong>
              </label>
              <input
                type="text"
                name="address_spender"
                placeholder="Input spender address"
              />
              <br />

              <label htmlFor="uint_value">
                <strong>uint_value</strong>
              </label>
              <input
                type="text"
                name="uint_value"
                placeholder="Input uint value"
              />
              <br />

              <input type="submit" value="Run approve" />
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const recipient = event.target.recipient.value;

                const amount = this.inputToBigNumber(
                  "transfer",
                  event.target.amount.value
                );

                this.methodSend("transfer", recipient, amount);
              }}
            >
              <h3>transfer</h3>

              <label>
                <strong>Recipient:</strong>
              </label>
              <input
                type="text"
                placeholder="Input recipient address"
                name="recipient"
              />

              <br />

              <label>
                <strong>Amount:</strong>
              </label>

              <input type="text" placeholder="Input amount" name="amount" />

              <br />

              <input type="submit" value="Run transfer" />

              <br />

              {transferResult}
              {transferTime}
              {transferConfirmations ??
                "After sending the transaction, you need to wait for enough confirmations"}
            </form>

            <form
              data-returns="true"
              action="#"
              method="post"
              id="transferFrom"
              className="form"
            >
              <h3>transferFrom</h3>

              <label htmlFor="address_from">
                <strong>address_from</strong>
              </label>
              <input
                name="address_from"
                type="text"
                placeholder="Input address from"
              />
              <br />

              <label htmlFor="address_to">
                <strong>address_to</strong>
              </label>
              <input
                name="address_to"
                type="text"
                placeholder="Input address to"
              />
              <br />

              <label htmlFor="uint_value">
                <strong>uint_value</strong>
              </label>
              <input
                name="uint_value"
                type="text"
                placeholder="Input uint value"
              />
              <br />

              <input type="submit" value="Run transferFrom" />
            </form>

            <form
              className="form"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const owner = event.target.ownerAddress.value;
                const spender = event.target.spenderAddress.value;

                const amount = this.inputToBigNumber(
                  "permit",
                  event.target.amount.value
                );

                const deadline = event.target.deadline.value;
                const v = event.target.v.value;
                const r = event.target.r.value;
                const s = event.target.s.value;

                this.methodSend(
                  "permit",
                  owner,
                  spender,
                  amount,
                  deadline,
                  v,
                  r,
                  s
                );
              }}
            >
              <h3>Permit</h3>

              <label>
                <strong>Owner address:</strong>
              </label>
              <input
                name="ownerAddress"
                type="text"
                placeholder="Input owner address"
              />
              <br />

              <label>
                <strong>Spender address:</strong>
              </label>
              <input
                name="spenderAddress"
                type="text"
                placeholder="Input spender address"
              />
              <br />

              <label>
                <strong>Amount:</strong>
              </label>
              <input name="amount" type="text" placeholder="Input amount" />
              <br />

              <label>
                <strong>Deadline:</strong>
              </label>
              <input name="deadline" type="text" placeholder="Input deadline" />
              <br />

              <label>
                <strong>V:</strong>
              </label>
              <input name="v" type="text" placeholder="Input v data" />
              <br />

              <label>
                <strong>R:</strong>
              </label>
              <input name="r" type="text" placeholder="Input r data" />
              <br />

              <label>
                <strong>S</strong>
              </label>
              <input name="s" type="text" placeholder="Input s data" />
              <br />

              <input type="submit" value="Run permit" />
              <br />

              {permitResult}
              {permitTime}
              {permitConfirmations ??
                "After sending the transaction, you need to wait for enough confirmations"}
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default ZoinksERC20;
