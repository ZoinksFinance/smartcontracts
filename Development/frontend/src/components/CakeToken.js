import React, { Component } from 'react'
import './App.css'
// import Web3 from 'web3'
// import contract from '../abis/CakeToken.json'

class CakeToken extends Component {

    async componentWillMount() {
        // Load de Web3
        await this.loadWeb3()
        // Load Blockchain data
        await this.loadBlockchainData()
    }

    async loadWeb3() {
        // TODO
    }

    async loadBlockchainData() {
        // TODO
    }

    // Constructor
    constructor(props) {
        super(props)
        this.state = {
            contract: null,
            loading: false,
            errorMessage: "",
            account: "",
            // Properties
            propDecimals: null,
            // Methods transactions
            txMint: null
        }
    }

    // Read function
    decimals = async (message) => {
        try {
            console.log(message);
            // const value = await this.state.contract.methods.decimals().call();
            const value = 18;
            // alert(value);
            this.setState({ propDecimals: value })
        } catch (err) {
            this.setState({ errorMessage: err.message })
        } finally {
            this.setState({ loading: false })
        }
    }

    // Write function
    mint = async (address, amount, message) => {
        try {
            console.log(message);
            // const web3 = window.web3;
            // const accounts = await web3.eth.getAccounts();
            // await this.state.contract.methods.Mint(address, amount).send({from: accounts[0]})
        } catch (err) {
            this.setState({ errorMessage: err.message })
        } finally {
            this.setState({ loading: false })
        }
    }

    // Render de la DApp
    render() {

        // const decimalsResult = this.state.propDecimals !== null ? (
        //     <p>Return result: {this.state.propDecimals}</p>
        // ) : null;

        // const mintResult = this.state.txMint !== null ? (
        //     <p>Transaction: {this.state.txMint}</p>
        // ) : null;

        return (
            <>
                <div className="container">
                    <div className="propsContainer">
                        <h2>Properties</h2>
                        <button id="refreshProps">Refresh Properties</button>

                        <p>mapping_pub_check</p>
                        <p>
                            <span id="mapping_pub_check">!!!No data!!! Please refresh above</span>
                        </p>
                        <p>mapping_num_pub_check</p>
                        <p>
                            <span id="mapping_num_pub_check">!!!No data!!! Please refresh above</span>
                        </p>
                        <p>bytes32_pub_constant_DOMAIN_TYPEHASH</p>
                        <p><span id="bytes32_pub_constant_DOMAIN_TYPEHASH">!!!No data!!! Please refresh above</span></p>
                        <p>bytes32_pub_constant_DELEGATION_TYPEHASH</p>
                        <p><span id="bytes32_pub_constant_DELEGATION_TYPEHASH">!!!No data!!! Please refresh above</span></p>
                        <p>mapping_pub_nonces</p>
                        <p><span id="mapping_pub_nonces">!!!No data!!! Please refresh above</span></p>

                    </div>

                    <div className="methods">
                        <h2>Methods</h2>

                        <form action="#" method="post" id="mint_cake" className="form">

                            <h3>mint_cake</h3>

                            <label htmlFor="address_to"><strong>address_to</strong></label>
                            <input name="address_to" type="text" placeholder="Input address to" /><br />

                            <label htmlFor="uint256_amount"><strong>uint256_amount</strong></label>
                            <input name="uint256_amount" type="text" placeholder="Input amount" /><br />

                            <input type="submit" value="Run mint_cake" />

                        </form>

                        <form data-returns="true" action="#" method="post" id="delegates" className="form">

                            <h3>delegates</h3>

                            <label htmlFor="address_delegator"><strong>address_delegator</strong></label>
                            <input name="address_delegator" type="text" placeholder="Input delegator address" /><br />

                            <input type="submit" value="Run delegates" />

                        </form>

                        <form action="#" method="post" id="delegate" className="form">

                            <h3>delegate</h3>

                            <label htmlFor="address_delegatee"><strong>address_delegatee</strong></label>
                            <input name="address_delegatee" type="text" placeholder="Input delegatee address" /><br />

                            <input type="submit" value="Run delegate" />

                        </form>

                        <form action="#" method="post" id="delegateBySig" className="form">

                            <h3>delegateBySig</h3>

                            <label htmlFor="address_delegatee"><strong>address_delegatee</strong></label>
                            <input name="address_delegatee" type="text" placeholder="Input delegatee address" /><br />

                            <label htmlFor="uint_nonce"><strong>uint_nonce</strong></label>
                            <input name="uint_nonce" type="text" placeholder="Input data" /><br />

                            <label htmlFor="uint_expiry"><strong>uint_expiry</strong></label>
                            <input name="uint_expiry" type="text" placeholder="Input data" /><br />

                            <label htmlFor="uint8_v"><strong>uint8_v</strong></label>
                            <input name="uint8_v" type="text" placeholder="Input data" /><br />

                            <label htmlFor="bytes32_r"><strong>bytes32_r</strong></label>
                            <input name="bytes32_r" type="text" placeholder="Input data" /><br />

                            <label htmlFor="bytes32_s"><strong>bytes32_s</strong></label>
                            <input name="bytes32_s" type="text" placeholder="Input data" /><br />

                            <input type="submit" value="Run delegateBySig" />

                        </form>

                        <form data-returns="true" action="#" method="post" id="getCurrentVotes" className="form">

                            <h3>getCurrentVotes</h3>

                            <label htmlFor="address_account"><strong>address_account</strong></label>
                            <input name="address_account" type="text" placeholder="Input account address" /><br />

                            <input type="submit" value="Run getCurrentVotes" />

                        </form>

                        <form data-returns="true" action="#" method="post" id="getPriorVotes" className="form">

                            <h3>getPriorVotes</h3>

                            <label htmlFor="address_account"><strong>address_account</strong></label>
                            <input name="address_account" type="text" placeholder="Input account address" /><br />

                            <label htmlFor="uint_blockNumber"><strong>uint_blockNumber</strong></label>
                            <input name="uint_blockNumber" type="text" placeholder="Input blockNumber" /><br />

                            <input type="submit" value="Run getPriorVotes" />

                        </form>

                    </div>

                    <div className="fromBEP-20">
                        <h2>From BEP-20</h2>

                        <form data-returns="true" className="form" id="getOwner" action="#" method="POST">

                            <h3>getOwner</h3>

                            <input id="" type="submit" value="Run getOwner" />

                        </form>

                        <form data-returns="true" className="form" id="name" action="#" method="POST">

                            <h3>name</h3>

                            <input id="" type="submit" value="Run name" />

                        </form>

                        <form data-returns="true" className="form" id="decimals" action="#" method="POST">

                            <h3>decimals</h3>

                            <input id="" type="submit" value="Run decimals" />

                        </form>

                        <form data-returns="true" className="form" id="symbol" action="#" method="POST">

                            <h3>symbol</h3>

                            <input id="" type="submit" value="Run symbol" />

                        </form>

                        <form data-returns="true" className="form" id="totalSupply" action="#" method="POST">

                            <h3>totalSupply</h3>

                            <input id="" type="submit" value="Run totalSupply" />

                        </form>

                        <form data-returns="true" className="form" id="balanceOf" action="#" method="POST">

                            <h3>balanceOf</h3>

                            <label htmlFor="address_account"><strong>address account</strong></label>
                            <input name="address_account" type="text" placeholder="Input account address" /><br />

                            <input id="" type="submit" value="Run balanceOf" />

                        </form>

                        <form data-returns="true" className="form" id="transfer" action="#" method="POST">
                            <h3>transfer</h3>

                            <label htmlFor="address_recipient"><strong>address_recipient</strong></label>
                            <input name="address_recipient" type="text" placeholder="Input recipient address" /><br />

                            <label htmlFor="uint256_ammount"><strong>uint256_ammount</strong></label>
                            <input name="uint256_ammount" type="text" placeholder="Input ammount" /><br />


                            <input id="" type="submit" value="Run transfer" />
                        </form>

                        <form data-returns="true" className="form" id="allowance" action="#" method="POST">
                            <h3>allowance</h3>

                            <label htmlFor="address_owner"><strong>address_owner</strong></label>
                            <input name="address_owner" type="text" placeholder="Input owner address" /><br />

                            <label htmlFor="address_spender"><strong>address_spender</strong></label>
                            <input name="address_spender" type="text" placeholder="Input spender address" /><br />

                            <input id="" type="submit" value="Run allowance" />
                        </form>

                        <form data-returns="true" className="form" id="approve" action="#" method="POST">
                            <h3>approve</h3>

                            <label htmlFor="address_spender"><strong>address_spender</strong></label>
                            <input name="address_spender" type="text" placeholder="Input spender address" /><br />

                            <label htmlFor="uint256_ammount"><strong>uint256_ammount</strong></label>
                            <input name="uint256_ammount" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run approve" />
                        </form>

                        <form data-returns="true" className="form" id="transferFrom" action="#" method="POST">
                            <h3>transferFrom</h3>

                            <label htmlFor="address_sender"><strong>address_sender</strong></label>
                            <input name="address_sender" type="text" placeholder="Input sender address" /><br />

                            <label htmlFor="address_recipient"><strong>address_recipient</strong></label>
                            <input name="address_recipient" type="text" placeholder="Input recipient address" /><br />

                            <label htmlFor="uint256_ammount"><strong>uint256_ammount</strong></label>
                            <input name="uint256_ammount" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run transferFrom" />
                        </form>

                        <form data-returns="true" className="form" id="increaseAllowance" action="#" method="POST">
                            <h3>increaseAllowance</h3>

                            <label htmlFor="address_spender"><strong>address_spender</strong></label>
                            <input name="address_spender" type="text" placeholder="Input spender address" /><br />

                            <label htmlFor="uint256_addedValue"><strong>uint256_addedValue</strong></label>
                            <input name="uint256_addedValue" type="text" placeholder="Input addedValue" /><br />

                            <input id="" type="submit" value="Run increaseAllowance" />
                        </form>

                        <form data-returns="true" className="form" id="decreaseAllowance" action="#" method="POST">
                            <h3>decreaseAllowance</h3>

                            <label htmlFor="address_spender"><strong>address_spender</strong></label>
                            <input name="address_spender" type="text" placeholder="Input spender address" /><br />

                            <label htmlFor="uint256_subtractedValue"><strong>uint256_subtractedValue</strong></label>
                            <input name="uint256_subtractedValue" type="text" placeholder="Input subtracted value" /><br />

                            <input id="" type="submit" value="Run decreaseAllowance" />
                        </form>

                        <form data-returns="true" className="form" id="mint" action="#" method="POST">
                            <h3>mint</h3>

                            <label htmlFor="uint256_amount"><strong>uint256_amount</strong></label>
                            <input name="uint256_amount" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run mint" />
                        </form>

                    </div>

                </div>
            </>
        );
    }
}

export default CakeToken;