import React, { Component } from 'react'
import './App.css'
// import Web3 from 'web3'
// import contract from '../abis/CakePulse.json'

class CakePulse extends Component {

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
        return (
            <>
                <div className="container">
                    <div className="propsContainer">
                        <h2>Properties</h2>
                        <button id="refreshProps">Refresh Properties</button>

                        <p>isInitialized</p>
                        <p>
                            <span id="isInitialized">!!!No data!!! Please refresh above</span>
                        </p>
                        <p>IRC20z</p>
                        <p>
                            <span id="IRC20z">!!!No data!!! Please refresh above</span>
                        </p>
                        <p>IRC20s</p>
                        <p><span id="IRC20s">!!!No data!!! Please refresh above</span></p>
                        <p>IRouterZ</p>
                        <p><span id="IRouterZ">!!!No data!!! Please refresh above</span></p>
                        <p>IRouterP</p>
                        <p><span id="IRouterP">!!!No data!!! Please refresh above</span></p>
                        <p>addressS</p>
                        <p><span id="addressS">!!!No data!!! Please refresh above</span></p>
                        <p>addressC</p>
                        <p><span id="addressC">!!!No data!!! Please refresh above</span></p>
                        <p>IERC20b</p>
                        <p><span id="IERC20b">!!!No data!!! Please refresh above</span></p>
                        <p>IERC20c</p>
                        <p><span id="IERC20c">!!!No data!!! Please refresh above</span></p>
                    </div>

                    <div className="methods">
                        <h2>Methods</h2>

                        <form action="#" method="post" id="initialize" className="form">
                            <h3>initialize</h3>

                            <label htmlFor="IRouter"><strong>IRouter</strong></label>
                            <input type="text" name="IRouter" placeholder="Input the router" /><br />

                            <label htmlFor="IERC20_zoinks"><strong>IERC20_zoinks</strong></label>
                            <input type="text" name="IERC20_zoinks" placeholder="Input data" /><br />

                            <label htmlFor="IERC20_snacks"><strong>IERC20_snacks</strong></label>
                            <input type="text" name="IERC20_snacks" placeholder="Input data" /><br />

                            <label htmlFor="address"><strong>Snackspool address</strong></label>
                            <input type="text" name="address" placeholder="Input snackspool address" /><br />

                            <input type="submit" value="Run Initialize" />
                        </form>

                        <form data-returns="true" action="#" method="post" id="circulate" className="form">
                            <h3>circulate</h3>

                            <input type="submit" value="Run circulate" />
                        </form>

                        <form action="#" method="post" id="buySnacks" className="form">
                            <h3>buySnacks</h3>
                            <label htmlFor="IERC20_snacks"><strong>IERC20_snacks</strong></label>
                            <input name="IERC20_snacks" type="text" placeholder="Input data" /><br />

                            <label htmlFor="uint256"><strong>uint256_ammount</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <label htmlFor="uint256_rate"><strong>uint256_rate</strong></label>
                            <input name="uint256_rate" type="text" placeholder="Input rate" /><br />

                            <input type="submit" value="Run buySnacks" />
                        </form>

                        <form action="#" method="post" id="redeemSnacks" className="form">
                            <h3>redeemSnacks</h3>
                            <label htmlFor="ERC20_snacks"><strong>ERC20_snacks</strong></label>
                            <input name="ERC20_snacks" type="text" placeholder="Input data" /><br />
                            <label htmlFor="uint256"><strong>uint256_ammount</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />
                            <input type="submit" value="Run redeemSnacks" />
                        </form>

                        <form action="#" method="post" id="deposit" className="form">
                            <h3>deposit</h3>

                            <label htmlFor="address"><strong>Address pool</strong></label>
                            <input name="address" type="text" placeholder="Input pool addres" /><br />

                            <label htmlFor="uint256"><strong>Ammount</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input type="submit" value="Run deposit" />
                        </form>

                        <form action="#" method="post" id="updatePool" className="form">
                            <h3>updatePool</h3>
                            <label htmlFor="address"></label>
                            <input name="address" type="text" placeholder="Input pool addres" /><br />
                            <input type="submit" value="Run updatePool" />
                        </form>

                        <form data-returns="true" action="#" method="post" id="swap" className="form">
                            <h3>swap</h3>

                            <label htmlFor="IRouter"><strong>IRouter</strong></label
                            ><br />
                            <input type="text" name="IRouter" placeholder="Input router" /><br />
                            <label htmlFor="address_to"><strong>address_to</strong></label>
                            <input name="address_to" type="text" placeholder="Input addres to" /><br />
                            <label htmlFor="address_form"><strong>address_form</strong></label>
                            <input name="address_from" type="text" placeholder="Input addres from" /><br />
                            <label htmlFor="uint256"><strong>Ammount</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />
                            <input type="submit" value="Run Swap" />
                        </form>

                        <form data-returns="true" action="#" method="post" id="addLiquidity" className="form">
                            <h3>addLiquidity</h3>
                            <label htmlFor="IRouter"><strong>IRouter</strong></label
                            ><br />
                            <input type="text" name="IRouter" placeholder="Input router" /><br />

                            <label htmlFor="uint256"><strong>Ammount</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input type="submit" value="Run addLiquidity" />
                        </form>

                        <form data-returns="true" action="#" method="post" id="calculateBuyAmount" className="form">
                            <h3>calculateBuyAmount</h3>
                            <label htmlFor="ERC20_snacks"><strong>ERC20_snacks</strong></label>
                            <input name="ERC20_snacks" type="text" placeholder="Input data" /><br />

                            <label htmlFor="uint256"><strong>uint256_ammount</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <label htmlFor="uint256_rate"><strong>uint256_rate</strong></label>
                            <input name="uint256_rate" type="text" placeholder="Input rate" /><br />
                            <input type="submit" value="Run calculateBuyAmount" />
                        </form>
                    </div>

                    <div className="fromERC-20">
                        <h2>From ERC-20</h2>

                        <form data-returns="true" className="form" id="decreaseAllowance" action="#" method="POST">
                            <h3>decreaseAllowance</h3>

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="spender_address" type="text" placeholder="Input spender address" /><br />

                            <label htmlFor="uint256"><strong>uint256</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run decreaseAllowance" />
                        </form>

                        <form data-returns="true" className="form" id="increaseAllowance" action="#" method="POST">
                            <h3>increaseAllowance</h3>

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="spender_address" type="text" placeholder="Input spender address" /><br />

                            <label htmlFor="uint256"><strong>uint256</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run increaseAllowance" />
                        </form>

                        <form data-returns="true" className="form" id="transferFrom" action="#" method="POST">
                            <h3>transferFrom</h3>

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="sender_address" type="text" placeholder="Input sender address" /><br />

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="recipient_address" type="text" placeholder="Input recipient address" /><br />

                            <label htmlFor="uint256"><strong>uint256</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run transferFrom" />
                        </form>

                        <form data-returns="true" className="form" id="approve" action="#" method="POST">
                            <h3>approve</h3>

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="spender_address" type="text" placeholder="Input spender address" /><br />

                            <label htmlFor="uint256"><strong>uint256</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run approve" />
                        </form>

                        <form data-returns="true" className="form" id="allowance" action="#" method="POST">
                            <h3>allowance</h3>

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="owner_address" type="text" placeholder="Input owner address" /><br />

                            <label htmlFor="address"><strong>address</strong></label>
                            <input name="spender_address" type="text" placeholder="Input spender address" /><br />

                            <input id="" type="submit" value="Run allowance" />
                        </form>

                        <form data-returns="true" className="form" id="transfer" action="#" method="POST">
                            <h3>transfer</h3>

                            <label htmlFor="recipient"><strong>address</strong></label>
                            <input name="recipient_address" type="text" placeholder="Input recipient address" /><br />

                            <label htmlFor="uint256"><strong>uint256</strong></label>
                            <input name="uint256" type="text" placeholder="Input ammount" /><br />

                            <input id="" type="submit" value="Run transfer" />
                        </form>

                        <form data-returns="true" className="form" id="balanceOf" action="#" method="POST">
                            <h3>balanceOf</h3>

                            <label htmlFor="balanceOf_address"><strong>address</strong></label>
                            <input name="balanceOf_address" type="text" placeholder="Input account address" /><br />

                            <input id="" type="submit" value="Run balanceOf" />
                        </form>

                        <form data-returns="true" className="form" id="decimals_erc" action="#" method="POST">
                            <h3>decimals_erc</h3>

                            <input id="" type="submit" value="Run decimals_erc" />
                        </form>

                        <form data-returns="true" className="form" id="symbol" action="#" method="POST">
                            <h3>symbol</h3>

                            <input id="" type="submit" value="Run symbol" />
                        </form>

                        <form data-returns="true" className="form" id="name" action="#" method="POST">
                            <h3>name</h3>

                            <input id="" type="submit" value="Run name" />
                        </form>
                    </div>
                </div>
            </>
        );
    }
}

export default CakePulse;