import React, { Component } from "react";
import "../App.css";

class TransactionInfo extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoaded: true
        };
    }

    // Render de la DApp
    render() {
        let time =
            (this.props.sendTxTime !== null && this.props.sendTxTime !== undefined) ? (
                <p>Transaction time: {this.props.sendTxTime ?? "?"}</p>
            ) : null;

        let result =
            (this.props.lastTransactionHash !== null && this.props.lastTransactionHash !== undefined) ? (
                <p>Transaction: {this.props.lastTransactionHash ?? "?"}</p>
            ) : null;

        let confirmations =
            (this.props.lastTransactionConfirmed !== null && this.props.lastTransactionConfirmed !== undefined) ? (
                <p>
                    Your transaction confirmed confirmations:
                    {this.props.lastTransactionConfirmed ?? "0"}
                </p>
            ) : null;

        return (
            <>
                <div>
                    {result}
                    {time}
                    {confirmations ?? "After sending the transaction, you need to wait for enough confirmations"}
                </div>
            </>
        );
    }
}

export default TransactionInfo;