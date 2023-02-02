import React, { Component } from "react";
import "./App.css";

import { ethers } from "ethers";
import PulseAbi from "../abis/Pulse.json";
import { PulseAddress } from "./addresses.js";
import { checkChainId } from "./connectWallet";

class Pulse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      provider: null,
      contract: null,

      loading: false,

      // Propierties from left side
      isInitialized: null,
      isZoinksPairSet: null,
      zoinks: null,
      zoinksPair: null,
      snacks: null,
      ethSnacks: null,
      btcSnacks: null,
      master: null,
      router: null,
      snackspool: null,
      busd: null,
      btc: null,
      eth: null,

      // ERC-20
      decimals: null,
      symbol: null,
      name: null,
      balanceOf: null,
      allowance: null,
      approveTx: null,
      transferFromTx: null,
      increaseAllowanceTx: null,
      decreaseAllowanceTx: null,

      // Methods props
      calculateBuyAmountValue: null,
      initializeTx: null,
      circulateTx: null,

      lastTransferTxHash: null,
      lastTransferTxTime: null,
      lastTransferTxConfirmations: null,

      initializeTxHash: null,
      initializeTxTime: null,
      initializeTxConfirmations: null,

      harvestTxHash: null,
      harvestTxTime: null,
      harvestTxConfirmations: null,

      setZoinksPairTxHash: null,
      setZoinksPairTxTime: null,
      setZoinksPairTxConfirmations: null,

      buySnacksTxHash: null,
      buySnacksTxTime: null,
      buySnacksTxConfirmations: null,

      redeemSnacksTxHash: null,
      redeemSnacksTxTime: null,
      redeemSnacksTxConfirmations: null,

      depositSnacksTxHash: null,
      depositSnacksTxTime: null,
      depositSnacksTxConfirmations: null,

      swapBusdTxHash: null,
      swapBusdTxTime: null,
      swapBusdTxConfirmations: null,

      addLiquidityTxHash: null,
      addLiquidityTxTime: null,
      addLiquidityTxConfirmations: null,

      depositLPTxHash: null,
      depositLPTxTime: null,
      depositLPTxConfirmations: null,
    };
  }

  // Started when page rendered
  static async getDerivedStateFromProps(props, state) {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        provider
      );

      state.provider = provider;
      state.contract = contract;
    } else {
      console.warn("Please install MetaMask");
    }
  }

  // Reading all props from blockchain and show it's on page
  async readProps() {
    const allProps = {
      isInitialized: (await this.state.contract.isInitialized()).toString(),
      isZoinksPairSet: (await this.state.contract.isZoinksPairSet()).toString(),
      zoinks: await this.state.contract.zoinks(),
      zoinksPair: await this.state.contract.zoinksPair(),
      snacks: await this.state.contract.snacks(),
      ethSnacks: await this.state.contract.ethSnacks(),
      btcSnacks: await this.state.contract.btcSnacks(),
      master: await this.state.contract.master(),
      router: await this.state.contract.router(),
      snackspool: await this.state.contract.snackspool(),
      busd: await this.state.contract.busd(),
      btc: await this.state.contract.btc(),
      eth: await this.state.contract.eth(),
    };

    this.setState({
      isInitialized: allProps.isInitialized,
      isZoinksPairSet: allProps.isZoinksPairSet,
      zoinks: allProps.zoinks,
      zoinksPair: allProps.zoinksPair,
      snacks: allProps.snacks,
      ethSnacks: allProps.ethSnacks,
      btcSnacks: allProps.btcSnacks,
      master: allProps.master,
      router: allProps.router,
      snackspool: allProps.snackspool,
      busd: allProps.busd,
      btc: allProps.btc,
      eth: allProps.eth,
    });
  }

  // ! From ERC20 part
  // Read function
  async decimals() {
    try {
      await checkChainId();
      const value = await this.state.contract.decimals();
      this.setState({ decimals: value });
    } catch (error) {
      this.showError("decimals", error);
    }
  }

  async symbol() {
    try {
      await checkChainId();
      const value = await this.state.contract.symbol();
      this.setState({ symbol: value });
    } catch (error) {
      this.showError("symbol", error);
    }
  }

  async name() {
    try {
      await checkChainId();
      const value = await this.state.contract.name();
      this.setState({ name: value });
    } catch (error) {
      this.showError("name", error);
    }
  }

  async balanceOf(inputAddress) {
    try {
      await checkChainId();
      const value = (
        await this.state.contract.balanceOf(inputAddress)
      ).toString();

      this.setState({ balanceOf: value });
    } catch (error) {
      this.showError("balanceOf", error);
    }
  }

  async transfer(to, amount) {
    try {
      this.setState({ loading: true });

      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      // Call mint function & and set state
      const transaction = await contractWithSigner.transfer(to, amount);

      if (transaction.code !== 4001) {
        // Set txTime, txHash, txConfirmations
        await this.transferTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("transfer", error);
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
      this.showError("allowance", error);
    }
  }

  async approve(spender, amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.approve(spender, amount);
      this.setState({ approveTx: transaction.hash });
    } catch (error) {
      this.showError("approve", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async transferFrom(from, to, amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.transferFrom(
        from,
        to,
        amount
      );

      this.setState({ transferFromTx: transaction.hash });
    } catch (error) {
      this.showError("transferFrom", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async increaseAllowance(spender, amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.increaseAllowance(
        spender,
        amount
      );

      this.setState({ increaseAllowanceTx: transaction.hash });
    } catch (error) {
      this.showError("increaseAllowance", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async decreaseAllowance(spender, amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.decreaseAllowance(
        spender,
        amount
      );

      this.setState({ decreaseAllowanceTx: transaction.hash });
    } catch (error) {
      this.showError("decreaseAllowance", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  // ! End of ERC20

  async initialize(
    master,
    router,
    zoinks,
    snacks,
    ethSnacks,
    btcSnacks,
    snackspool
  ) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.initialize(
        master,
        router,
        zoinks,
        snacks,
        ethSnacks,
        btcSnacks,
        snackspool
      );

      if (transaction.code !== 4001) {
        this.initializeTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("initialize", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async calculateBuyAmount(snacks, amount, rate) {
    try {
      const result = await this.state.contract.calculateBuyAmount(
        snacks,
        amount,
        rate
      );

      this.setState({
        calculateBuyAmountValue: result.toString(),
      });
    } catch (error) {
      this.showError("calculateBuyAmount", error);
    }
  }

  async setZoinksPair(newZoinks) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.setZoinksPair(newZoinks);

      if (transaction.code !== 4001) {
        this.setZoinksPairTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("setZoinksPair", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async harvest() {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.harvest();

      if (transaction.code !== 4001) {
        this.setState({ harvestTx: transaction.hash });
      }
    } catch (error) {
      this.showError("harvest", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async circulate() {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.circulate();

      if (transaction.code !== 4001) {
        this.setState({ circulateTx: transaction.hash });
      }
    } catch (error) {
      this.showError("circulate", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async buySnacks(snacks, amount, rate) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.buySnacks(
        snacks,
        amount,
        rate
      );

      if (transaction.code !== 4001) {
        this.buySnacksTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("buySnacks", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async redeemSnacks(snacks, amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.redeemSnacks(snacks, amount);

      if (transaction.code !== 4001) {
        this.redeemSnacksTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("redeemSnacks", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async depositSnacks(amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.depositSnacks(amount);

      if (transaction.code !== 4001) {
        this.depositSnacksTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("depositSnacks", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async swapBusd(amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.swapBusd(amount);

      if (transaction.code !== 4001) {
        this.swapBusdTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("swapBusd", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async addLiquidity(amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.addLiquidity(amount);

      if (transaction.code !== 4001) {
        this.addLiquidityTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("addLiquidity", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  async depositLP(amount) {
    try {
      this.setState({ loading: true });
      await checkChainId();

      // Get signer & contract for next call
      const signer = await this.state.provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        PulseAddress,
        PulseAbi.abi,
        signer
      );

      const transaction = await contractWithSigner.depositLP(amount);

      if (transaction.code !== 4001) {
        this.depositLPTransactionProcessing(transaction);
      }
    } catch (error) {
      this.showError("depositLP", error);
    } finally {
      this.setState({ loading: false });
    }
  }

  // ! Tx proccesing
  // Set tx state values and wait for confirmations
  async transferTransactionProcessing(tx) {
    this.setState({
      sendTransferTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      lastTransferTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            lastTransferTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  // Set tx state values and wait for confirmations
  async initializeTransactionProcessing(tx) {
    this.setState({
      initializeTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      initializeTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            initializeTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  // Set tx state values and wait for confirmations
  async harvestTransactionProcessing(tx) {
    this.setState({
      harvestTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      harvestTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            harvestTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  // Set tx state values and wait for confirmations
  async setZoinksPairTransactionProcessing(tx) {
    this.setState({
      setZoinksPairTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      setZoinksPairTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            setZoinksPairTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  // Set tx state values and wait for confirmations
  async buySnacksTransactionProcessing(tx) {
    this.setState({
      buySnacksTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      buySnacksTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            buySnacksTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  async redeemSnacksTransactionProcessing(tx) {
    this.setState({
      redeemSnacksTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      redeemSnacksTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            redeemSnacksTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  async depositSnacksTransactionProcessing(tx) {
    this.setState({
      depositSnacksTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      depositSnacksTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            depositSnacksTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  async swapBusdTransactionProcessing(tx) {
    this.setState({
      swapBusdTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      swapBusdTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            swapBusdTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  async addLiquidityTransactionProcessing(tx) {
    this.setState({
      addLiquidityTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      addLiquidityTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            addLiquidityTxConfirmations: transactionReceipt.confirmations,
          });
        } else {
          this.state.provider.removeAllListeners();
        }
        resolve();
      });
    });
  }

  async depositLPTransactionProcessing(tx) {
    this.setState({
      depositLPTxTime: tx.timestamp ?? `Error`,
    });
    this.setState({
      depositLPTxHash: tx.hash ?? `Error`,
    });
    return new Promise((resolve) => {
      this.state.provider.on(tx.hash, (transactionReceipt) => {
        if (transactionReceipt.confirmations <= 12) {
          this.setState({
            depositLPTxConfirmations: transactionReceipt.confirmations,
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
    const decimalsResult =
      this.state.decimals !== null ? (
        <p>Return result: {this.state.decimals}</p>
      ) : null;

    const symbolResult =
      this.state.symbol !== null ? (
        <p>Return result: {this.state.symbol}</p>
      ) : null;

    const nameResult =
      this.state.name !== null ? <p>Return result: {this.state.name}</p> : null;

    const balanceOfResult =
      this.state.balanceOf !== null ? (
        <p>Return result: {this.state.balanceOf}</p>
      ) : null;

    const transferTxHash =
      this.state.lastTransferTxHash !== null ? (
        <p>Transaction hash: {this.state.lastTransferTxHash}</p>
      ) : null;

    const transferTxTime =
      this.state.lastTransferTxTime !== null ? (
        <p>Transaction time: {this.state.lastTransferTxTime}</p>
      ) : null;

    const transferTxConfirmations =
      this.state.lastTransferTxConfirmations !== null ? (
        <p>
          Your transaction confirmed, confirmations:
          {this.state.lastTransferTxConfirmations}
        </p>
      ) : null;

    const allowanceResult =
      this.state.allowance !== null ? (
        <p>Return result: {this.state.allowance}</p>
      ) : null;

    const approveTx =
      this.state.approveTx !== null ? (
        <p> Transaction hash: {this.state.approveTx}</p>
      ) : null;

    const transfeFromTx =
      this.state.transferFromTx !== null ? (
        <p> Transaction hash: {this.state.transferFromTx}</p>
      ) : null;

    const increaseAllowanceTx =
      this.state.increaseAllowanceTx !== null ? (
        <p> Transaction hash: {this.state.increaseAllowanceTx}</p>
      ) : null;

    const decreaseAllowanceTx =
      this.state.decreaseAllowanceTx !== null ? (
        <p> Transaction hash: {this.state.decreaseAllowanceTx}</p>
      ) : null;

    const initializeTx =
      this.state.initializeTxHash !== null ? (
        <p> Transaction hash: {this.state.initializeTxHash}</p>
      ) : null;

    const initializeTxTime =
      this.state.initializeTxTime !== null ? (
        <p> Transaction time: {this.state.initializeTxTime}</p>
      ) : null;

    const initializeConfirmations =
      this.state.initializeTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.initializeTxConfirmations}
        </p>
      ) : null;

    const harvestTx =
      this.state.harvestTxHash !== null ? (
        <p> Transaction hash: {this.state.harvestTxHash}</p>
      ) : null;

    const harvestTxTime =
      this.state.harvestTxTime !== null ? (
        <p> Transaction time: {this.state.harvestTxTime}</p>
      ) : null;

    const harvestConfirmations =
      this.state.harvestTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.harvestTxConfirmations}
        </p>
      ) : null;

    const setZoinksPairTx =
      this.state.setZoinksPairTxHash !== null ? (
        <p> Transaction hash: {this.state.setZoinksPairTxHash}</p>
      ) : null;

    const setZoinksPairTime =
      this.state.setZoinksPairTxTime !== null ? (
        <p> Transaction time: {this.state.setZoinksPairTxTime}</p>
      ) : null;

    const setZoinksPairConfirmations =
      this.state.setZoinksPairTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.setZoinksPairTxConfirmations}
        </p>
      ) : null;

    const calculateBuyAmountResult =
      this.state.calculateBuyAmountValue !== null ? (
        <p> Return result: {this.state.calculateBuyAmountValue}</p>
      ) : null;

    const circulateTx =
      this.state.circulateTx !== null ? (
        <p> Transaction hash: {this.state.circulateTx}</p>
      ) : null;

    const buySnacksTx =
      this.state.buySnacksTxHash !== null ? (
        <p> Transaction hash: {this.state.buySnacksTxHash}</p>
      ) : null;

    const buySnacksTxTime =
      this.state.buySnacksTxTime !== null ? (
        <p> Transaction time: {this.state.buySnacksTxTime}</p>
      ) : null;

    const buySnacksTxConfirmations =
      this.state.buySnacksTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.buySnacksTxConfirmations}
        </p>
      ) : null;

    const redeemSnacksHash =
      this.state.redeemSnacksTxHash !== null ? (
        <p> Transaction hash: {this.state.redeemSnacksTxHash}</p>
      ) : null;

    const redeemSnacksTime =
      this.state.redeemSnacksTxTime !== null ? (
        <p> Transaction time: {this.state.redeemSnacksTxTime}</p>
      ) : null;

    const redeemSnacksConfirmations =
      this.state.redeemSnacksTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.redeemSnacksTxConfirmations}
        </p>
      ) : null;

    const depositSnacksHash =
      this.state.depositSnacksTxHash !== null ? (
        <p> Transaction hash: {this.state.depositSnacksTxHash}</p>
      ) : null;

    const depositSnacksTime =
      this.state.depositSnacksTxTime !== null ? (
        <p> Transaction time: {this.state.depositSnacksTxTime}</p>
      ) : null;

    const depositSnacksConfirmations =
      this.state.depositSnacksTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.depositSnacksTxConfirmations}
        </p>
      ) : null;

    const swapBusdHash =
      this.state.swapBusdTxHash !== null ? (
        <p> Transaction hash: {this.state.swapBusdTxHash}</p>
      ) : null;

    const swapBusdTime =
      this.state.swapBusdTxTime !== null ? (
        <p> Transaction time: {this.state.swapBusdTxTime}</p>
      ) : null;

    const swapBusdConfirmations =
      this.state.swapBusdTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.swapBusdTxConfirmations}
        </p>
      ) : null;

    const addLiquidityHash =
      this.state.addLiquidityTxHash !== null ? (
        <p> Transaction hash: {this.state.addLiquidityTxHash}</p>
      ) : null;

    const addLiquidityTime =
      this.state.addLiquidityTxTime !== null ? (
        <p> Transaction time: {this.state.addLiquidityTxTime}</p>
      ) : null;

    const addLiquidityConfirmations =
      this.state.addLiquidityTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.addLiquidityTxConfirmations}
        </p>
      ) : null;

    const depositLPHash =
      this.state.depositLPTxHash !== null ? (
        <p> Transaction hash: {this.state.depositLPTxHash}</p>
      ) : null;

    const depositLPTime =
      this.state.depositLPTxTime !== null ? (
        <p> Transaction time: {this.state.depositLPTxTime}</p>
      ) : null;

    const depositLPConfirmations =
      this.state.depositLPTxConfirmations !== null ? (
        <p>
          Your transaction confirmed confirmations:
          {this.state.depositLPTxConfirmations}
        </p>
      ) : null;

    return (
      <>
        <div className="container">
          <div className="propsContainer">
            <button
              id="refreshProps"
              onClick={(event) => {
                event.preventDefault();
                this.readProps();
              }}
            >
              Refresh Properties
            </button>

            <p>isInitialized:</p>

            <p>
              <span id="isInitialized">
                {this.state.isInitialized ?? "Empty"}
              </span>
            </p>

            <p>isZoinksPairSet:</p>

            <p>
              <span id="isZoinksPairSet">
                {this.state.isZoinksPairSet ?? "Empty"}
              </span>
            </p>

            <p>Zoinks address:</p>

            <p>
              <span id="zoinks">{this.state.zoinks ?? "Empty"}</span>
            </p>

            <p>ZoinksPair address:</p>

            <p>
              <span id="zoinksPair">{this.state.zoinksPair ?? "Empty"}</span>
            </p>

            <p>Snacks address:</p>

            <p>
              <span id="snacks">{this.state.snacks ?? "Empty"}</span>
            </p>

            <p>EthSnacks address:</p>

            <p>
              <span id="ethSnacks">{this.state.ethSnacks ?? "Empty"}</span>
            </p>

            <p>BtcSnacks address:</p>

            <p>
              <span id="btcSnacks">{this.state.btcSnacks ?? "Empty"}</span>
            </p>

            <p>Master address:</p>

            <p>
              <span id="master">{this.state.master ?? "Empty"}</span>
            </p>

            <p>Router address:</p>

            <p>
              <span id="router">{this.state.router ?? "Empty"}</span>
            </p>

            <p>Snackspool address:</p>

            <p>
              <span id="snackspool">{this.state.snackspool ?? "Empty"}</span>
            </p>

            <p>Busd address:</p>

            <p>
              <span id="busd">{this.state.busd ?? "Empty"}</span>
            </p>

            <p>Btc address:</p>

            <p>
              <span id="btc">{this.state.btc ?? "Empty"}</span>
            </p>

            <p>Eth address:</p>

            <p>
              <span id="eth">{this.state.eth ?? "Empty"}</span>
            </p>
          </div>

          <div className="methods">
            <h2>Methods</h2>

            <form
              data-returns="true"
              className="form"
              id="initialize"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const master = this.initialize_master.value;
                const router = this.initialize_router.value;
                const zoinks = this.initialize_zoinks.value;
                const snacks = this.initialize_snacks.value;
                const ethSnacks = this.initialize_ethSnacks.value;
                const btcSnacks = this.initialize_btcSnacks.value;
                const snackspool = this.initialize_snackspool.value;

                this.initialize(
                  master,
                  router,
                  zoinks,
                  snacks,
                  ethSnacks,
                  btcSnacks,
                  snackspool
                );
              }}
            >
              <h3>initialize</h3>

              <label htmlFor="address_master">
                <strong>master:</strong>
              </label>

              <input
                type="text"
                name="address_master"
                placeholder="Input master address"
                ref={(input) => (this.initialize_master = input)}
              />

              <br />

              <label htmlFor="IZoinksRouter">
                <strong>router: </strong>
              </label>

              <input
                type="text"
                name="IZoinksRouter"
                placeholder="Input router address"
                ref={(input) => (this.initialize_router = input)}
              />

              <br />

              <label htmlFor="IERC20_zoinks">
                <strong>zoinks: </strong>
              </label>

              <input
                type="text"
                name="IERC20_zoinks"
                placeholder="Input zoinks address"
                ref={(input) => (this.initialize_zoinks = input)}
              />

              <br />

              <label htmlFor="IERC20_snacks">
                <strong>snacks: </strong>
              </label>

              <input
                type="text"
                name="IERC20_snacks"
                placeholder="Input snaks address"
                ref={(input) => (this.initialize_snacks = input)}
              />

              <br />

              <label htmlFor="IERC20_ethSnacks">
                <strong>ethSnacks:</strong>
              </label>

              <input
                type="text"
                name="IERC20_ethSnacks"
                placeholder="Input ethSnacks address"
                ref={(input) => (this.initialize_ethSnacks = input)}
              />

              <br />

              <label htmlFor="IERC20_btcSnacks">
                <strong>btcSnacks:</strong>
              </label>

              <input
                type="text"
                name="IERC20_btcSnacks"
                placeholder="Input btcSnack address"
                ref={(input) => (this.initialize_btcSnacks = input)}
              />

              <br />

              <label htmlFor="address_snackspool">
                <strong>snackspool:</strong>
              </label>

              <input
                type="text"
                name="address_snackspool"
                placeholder="Input snackspool address"
                ref={(input) => (this.initialize_snackspool = input)}
              />

              <br />

              <input type="submit" value="Run Initialize" />

              {initializeTx}
              {initializeTxTime}
              {initializeConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="setZoinksPair"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const newZoinks = this.setZoinksPair_ZoinksAddress.value;
                this.setZoinksPair(newZoinks);
              }}
            >
              <h3>setZoinksPair</h3>

              <label htmlFor="IERC20_zoinksPair">
                <strong>New ZoinksPair address:</strong>
              </label>

              <input
                name="IERC20_zoinksPair"
                type="text"
                placeholder="Input new Zoinks address"
                ref={(input) => (this.setZoinksPair_ZoinksAddress = input)}
              />

              <br />

              <input type="submit" value="Run setZoinksPair" />

              {setZoinksPairTx}
              {setZoinksPairTime}
              {setZoinksPairConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="harvest"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                this.harvest();
              }}
            >
              <h3>harvest</h3>

              <input type="submit" value="Run harvest" />

              {harvestTx}
              {harvestTxTime}
              {harvestConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="circulate"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                this.circulate();
              }}
            >
              <h3>circulate</h3>

              <input type="submit" value="Run circulate" />
              {circulateTx}
            </form>

            <form
              data-returns="true"
              action="#"
              id="buySnacks"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const snacks = this.buySnacks_snacks.value;
                const amount = this.buySnacks_amount.value;
                const rate = this.buySnacks_rate.value;

                this.buySnacks(snacks, amount, rate);
              }}
            >
              <h3>buySnacks</h3>

              <label htmlFor="IERC20_snacks">
                <strong>Snacks address: </strong>
              </label>

              <input
                name="IERC20_snacks"
                type="text"
                placeholder="Input snacks address"
                ref={(input) => (this.buySnacks_snacks = input)}
              />

              <br />

              <label htmlFor="uint256_amount">
                <strong>Amount: </strong>
              </label>

              <input
                name="uint256_amount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.buySnacks_amount = input)}
              />

              <br />

              <label htmlFor="uint256_rate">
                <strong>Rate: </strong>
              </label>

              <input
                name="uint256_rate"
                type="text"
                placeholder="Input rate"
                ref={(input) => (this.buySnacks_rate = input)}
              />

              <br />

              <input type="submit" value="Run buySnacks" />

              {buySnacksTx}
              {buySnacksTxTime}
              {buySnacksTxConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="redeemSnacks"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const snacks = this.redeemSnacks_snacks.value;
                const amount = this.redeemSnacks_amount.value;

                this.redeemSnacks(snacks, amount);
              }}
            >
              <h3>redeemSnacks</h3>

              <label htmlFor="IERC20_snacks">
                <strong>Snacks: </strong>
              </label>

              <input
                name="IERC20_snacks"
                type="text"
                placeholder="Input snacks address"
                ref={(input) => (this.redeemSnacks_snacks = input)}
              />

              <br />

              <label htmlFor="uint256_amount">
                <strong>Amount: </strong>
              </label>

              <input
                name="uint256_amount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.redeemSnacks_amount = input)}
              />

              <br />

              <input type="submit" value="Run redeemSnacks" />

              {redeemSnacksHash}
              {redeemSnacksTime}
              {redeemSnacksConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="depositSnacks"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const amount = this.depositSnacks_amount.value;
                this.depositSnacks(amount);
              }}
            >
              <h3>depositSnacks</h3>

              <label htmlFor="uint256_amount">
                <strong>Amount:</strong>
              </label>

              <input
                name="uint256_amount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.depositSnacks_amount = input)}
              />

              <br />

              <input type="submit" value="Run depositSnacks" />

              {depositSnacksHash}
              {depositSnacksTime}
              {depositSnacksConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="swapBusd"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const amount = this.swapBusd_amount.value;
                this.swapBusd(amount);
              }}
            >
              <h3>swapBusd</h3>

              <label htmlFor="uint256_amount">
                <strong>Amount: </strong>
              </label>

              <input
                name="uint256_amount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.swapBusd_amount = input)}
              />

              <br />

              <input type="submit" value="Run swapBusd" />

              {swapBusdHash}
              {swapBusdTime}
              {swapBusdConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="addLiquidity"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const amount = this.addLiquidity_amount.value;
                this.addLiquidity(amount);
              }}
            >
              <h3>addLiquidity</h3>

              <label htmlFor="uint256_ammount">
                <strong>Amount:</strong>
              </label>

              <input
                name="uint256_ammount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.addLiquidity_amount = input)}
              />

              <br />

              <input type="submit" value="Run addLiquidity" />

              {addLiquidityHash}
              {addLiquidityTime}
              {addLiquidityConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="depositLP"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const amount = this.depositLP_amount.value;
                this.depositLP(amount);
              }}
            >
              <h3>depositLP</h3>

              <label htmlFor="uint256_ammount">
                <strong>Amount: </strong>
              </label>

              <input
                name="uint256_ammount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.depositLP_amount = input)}
              />

              <br />

              <input type="submit" value="Run depositLP" />

              {depositLPHash}
              {depositLPTime}
              {depositLPConfirmations}
            </form>

            <form
              data-returns="true"
              action="#"
              id="calculateBuyAmount"
              className="form"
              onSubmit={(event) => {
                event.preventDefault();

                const snacks = this.calculateAmount_snacks.value;
                const amount = this.calculateBuyAmount_amount.value;
                const rate = this.calculateBuyAmount_rate.value;

                this.calculateBuyAmount(snacks, amount, rate);
              }}
            >
              <h3>calculateBuyAmount</h3>

              <label htmlFor="IERC20_snacks">
                <strong>Snacks:</strong>
              </label>

              <input
                name="snacks"
                type="text"
                placeholder="Input snacks address"
                ref={(input) => (this.calculateAmount_snacks = input)}
              />

              <br />

              <label htmlFor="uint256_ammount">
                <strong>Amount:</strong>
              </label>

              <input
                name="uint256_amount"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.calculateBuyAmount_amount = input)}
              />

              <br />

              <label htmlFor="uint256_rate">
                <strong>Rate:</strong>
              </label>

              <input
                name="rate"
                type="text"
                placeholder="Input rate amount"
                ref={(input) => (this.calculateBuyAmount_rate = input)}
              />

              <br />

              <input type="submit" value="Run calculateBuyAmount" />
              {calculateBuyAmountResult}
            </form>
          </div>

          <div className="fromERC-20">
            <h2>From ERC-20</h2>

            <form
              data-returns="true"
              className="form"
              id="decreaseAllowance"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const spender = this.decreaseAllowance_spender.value;
                const amount = this.decreaseAllowance_amount.value;

                this.decreaseAllowance(spender, amount);
              }}
            >
              <h3>decreaseAllowance</h3>

              <label htmlFor="address">
                <strong>spender: </strong>
              </label>

              <input
                name="spender_address"
                type="text"
                placeholder="Input spender address"
                ref={(input) => (this.decreaseAllowance_spender = input)}
              />

              <br />

              <label htmlFor="uint256">
                <strong>amount: </strong>
              </label>

              <input
                name="uint256"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.decreaseAllowance_amount = input)}
              />

              <br />

              <input id="" type="submit" value="Run decreaseAllowance" />
              {decreaseAllowanceTx}
            </form>

            <form
              data-returns="true"
              className="form"
              id="increaseAllowance"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                const spender = this.increaseAllowance_spender.value;
                const amount = this.increaseAllowance_amount.value;
                this.increaseAllowance(spender, amount);
              }}
            >
              <h3>increaseAllowance</h3>

              <label htmlFor="address">
                <strong>spender: </strong>
              </label>

              <input
                name="spender_address"
                type="text"
                placeholder="Input spender address"
                ref={(input) => (this.increaseAllowance_spender = input)}
              />

              <br />

              <label htmlFor="uint256">
                <strong>amount: </strong>
              </label>

              <input
                name="uint256"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.increaseAllowance_amount = input)}
              />

              <br />

              <input id="" type="submit" value="Run increaseAllowance" />
              {increaseAllowanceTx}
            </form>

            <form
              data-returns="true"
              className="form"
              id="transferFrom"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const from = this.tranferFrom_from.value;
                const to = this.tranferFrom_to.value;
                const amount = this.tranferFrom_amount.value;

                this.transferFrom(from, to, amount);
              }}
            >
              <h3>transferFrom</h3>

              <label htmlFor="address">
                <strong>address from:</strong>
              </label>

              <input
                name="sender_address"
                type="text"
                placeholder="Input from address"
                ref={(input) => (this.tranferFrom_from = input)}
              />

              <br />

              <label htmlFor="address">
                <strong>address to:</strong>
              </label>

              <input
                name="recipient_address"
                type="text"
                placeholder="Input recipient address"
                ref={(input) => (this.tranferFrom_to = input)}
              />

              <br />

              <label htmlFor="uint256">
                <strong>amount: </strong>
              </label>

              <input
                name="uint256"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.tranferFrom_amount = input)}
              />

              <br />

              <input id="" type="submit" value="Run transferFrom" />
              {transfeFromTx}
            </form>

            <form
              data-returns="true"
              className="form"
              id="approve"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const spender = this.approve_sender.value;
                const amount = this.approve_amount.value;

                this.approve(spender, amount);
              }}
            >
              <h3>approve</h3>

              <label htmlFor="address">
                <strong>spender:</strong>
              </label>

              <input
                name="spender_address"
                type="text"
                placeholder="Input spender address"
                ref={(input) => (this.approve_sender = input)}
              />

              <br />

              <label htmlFor="uint256">
                <strong>amount:</strong>
              </label>

              <input
                name="uint256"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.approve_amount = input)}
              />

              <br />

              <input id="" type="submit" value="Run approve" />
              {approveTx}
            </form>

            <form
              data-returns="true"
              className="form"
              id="allowance"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const owner = this.allowanca_owner.value;
                const spender = this.allowanca_spender.value;

                this.allowance(owner, spender);
              }}
            >
              <h3>allowance</h3>

              <label htmlFor="address">
                <strong>owner:</strong>
              </label>

              <input
                name="owner_address"
                type="text"
                placeholder="Input owner address"
                ref={(input) => (this.allowanca_owner = input)}
              />

              <br />

              <label htmlFor="address">
                <strong>spender:</strong>
              </label>

              <input
                name="spender_address"
                type="text"
                placeholder="Input spender address"
                ref={(input) => (this.allowanca_spender = input)}
              />

              <br />

              <input id="" type="submit" value="Run allowance" />

              {allowanceResult}
            </form>

            <form
              data-returns="true"
              className="form"
              id="transfer"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const addressTo = this.transfer_to.value;
                const amount = this.transfer_amount.value;

                this.transfer(addressTo, amount);
              }}
            >
              <h3>transfer</h3>

              <label htmlFor="recipient">
                <strong>address to:</strong>
              </label>

              <input
                name="recipient_address"
                type="text"
                placeholder="Input recipient address"
                ref={(input) => (this.transfer_to = input)}
              />

              <br />

              <label htmlFor="uint256">
                <strong>amount:</strong>
              </label>

              <input
                name="uint256"
                type="text"
                placeholder="Input amount"
                ref={(input) => (this.transfer_amount = input)}
              />

              <br />

              <input id="" type="submit" value="Run transfer" />

              {transferTxHash}
              {transferTxTime}
              {transferTxConfirmations}
            </form>

            <form
              data-returns="true"
              className="form"
              id="balanceOf"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();

                const address = this.balanceOf_Input.value;
                this.balanceOf(address);
              }}
            >
              <h3>balanceOf</h3>

              <label htmlFor="balanceOf_address">
                <strong>account: </strong>
              </label>

              <input
                name="balanceOf"
                type="text"
                placeholder="Input account address"
                ref={(address) => (this.balanceOf_Input = address)}
              />

              <br />

              <input id="balanceInput" type="submit" value="Run balanceOf" />
              {balanceOfResult}
            </form>

            <form
              data-returns="true"
              className="form"
              id="decimals"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                this.decimals();
              }}
            >
              <h3>decimals</h3>

              <input id="" type="submit" value="Run decimals" />
              {decimalsResult}
            </form>

            <form
              data-returns="true"
              className="form"
              id="symbol"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                this.symbol();
              }}
            >
              <h3>symbol</h3>

              <input id="" type="submit" value="Run symbol" />
              {symbolResult}
            </form>

            <form
              data-returns="true"
              className="form"
              id="name"
              action="#"
              onSubmit={(event) => {
                event.preventDefault();
                this.name();
              }}
            >
              <h3>name</h3>

              <input id="" type="submit" value="Run name" />
              {nameResult}
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default Pulse;
