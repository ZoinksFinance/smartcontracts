import { ethers } from "ethers";
import { checkChainId } from "../connectWallet";

class BlockchainUtils {

    constructor(contractWithSigner, contract, transactionProcessing, showTransactionResult, context, provider) {
        this.contractWithSigner = contractWithSigner;
        this.contract = contract;
        this.transactionProcessing = transactionProcessing;
        this.showTransactionResult = showTransactionResult ?? true;
        this.self = context;
        this.provider = provider;
    }

    // Show error to user in alert and in console
    showError = async (method, error) => {
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

    inputToBigNumber = (method, txtInputValue) => {
        try {
            console.log(`Process in ${method}:`, txtInputValue);
            const decimals = 18;
            const input = txtInputValue; // Note: this is a string, e.g. user input
            const value = ethers.utils.parseUnits(input, decimals)
            return value;
        } catch (error) {
            console.error(`Error in ${method}`, error);
            const errMsg = `Error in ${method}: ${error}`;
            alert(errMsg);
            return undefined;
        }
    }

    // Read function
    methodCall = async (method, setStateFunctionAsync, ...rest) => {
        try {
            // Log
            console.log(`Calling ${method}`, ...rest);
            // Work
            await checkChainId();
            // Call function and get result
            const value = await this.contract[method](...rest);
            // Result
            await setStateFunctionAsync(value);
        } catch (error) {
            await this.showError(method, error);
        } finally {
            // Blank
        }
    }

    getDateTimeUNIX = (addSeconds) => {
        const m = new Date().getTime();
        const dateSeconds = Math.trunc(m / 1000);
        const changedDate = dateSeconds + addSeconds;
        const dateStringFormatSeconds = changedDate.toString();
        return dateStringFormatSeconds;
    }

    getDateTime = () => {
        const m = new Date();
        const dateString =
            ("0" + m.getUTCDate()).slice(-2) + "/" +
            ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
            m.getUTCFullYear() + " " +
            ("0" + m.getUTCHours()).slice(-2) + ":" +
            ("0" + m.getUTCMinutes()).slice(-2) + ":" +
            ("0" + m.getUTCSeconds()).slice(-2);
        return dateString;
    }

    getTime = () => {
        const m = new Date();
        const timeString =
            ("0" + m.getUTCHours()).slice(-2) + ":" +
            ("0" + m.getUTCMinutes()).slice(-2) + ":" +
            ("0" + m.getUTCSeconds()).slice(-2);
        return timeString;
    }

    // Write function
    methodSend = async (method, ...rest) => { // Example ...rest: address, amount; method: mint
        try {
            // Log
            console.debug("methodSend.1");
            console.log(`Calling ${method}`, ...rest);
            // Work
            console.debug("methodSend.3");
            await checkChainId();
            // Call function & and set state
            console.debug("methodSend.4");
            const transaction = await this.contractWithSigner[method](...rest);
            console.debug("methodSend.5");
            if (transaction.code !== 4001) {
                // Set txTime, txHash, txConfirmations
                console.debug("methodSend.5.1.code !== 4001");
                if(this.showTransactionResult) {
                    console.debug("methodSend5.2: showTransactionResult==true");
                    await this.self.transactionProcessing(method, transaction);
                } else {
                    console.debug("methodSend5.3: showTransactionResult==false start tx");
                    // Wait when finished
                    await this.txProcessing(transaction);
                    console.debug("methodSend5.3: showTransactionResult==false end tx");
                }
            }
            console.debug("methodSend.6");
        } catch (error) {
            console.debug("methodSend.7.catch");
            await this.showError(method, error);
            console.debug("methodSend.8.catch");
        } finally {
            console.debug("methodSend.9.finally");
        }
    }

    txProcessing = async (tx) => {
        return new Promise((resolve) => {
            this.provider.on(tx.hash, (transactionReceipt) => {
                // confirmations 
                if (transactionReceipt.confirmations <= 12) {
                    // Last confirmations
                } else {
                    // Finish
                    //this.state.provider.removeAllListeners();
                }
                resolve();
            });
        });
    }
}

export default BlockchainUtils;