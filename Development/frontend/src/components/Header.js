import React, { Component } from 'react'
import logo from '../logo.png'
import { detectEthereumProvider, connect, checkChainId } from "./connectWallet.js"

class Header extends Component {

    static async getDerivedStateFromProps(props, state) {
        detectEthereumProvider();
    }

    async connectToWallet() {
        const address = await connect();
        this.setState({ wallet: address });
    }

    constructor(props) {
        super(props);
        this.state = {
            name: "header",
            wallet: "?"
        }
    }

    render() {
        return (
            <>
                <div className="menu_container">
                    <div className="logo_wrapper">
                        <img src={logo} alt="Zoinks" />
                        Testing interface v.:Alpha v.3.10
                    </div>
                    <ul className="pure-menu-list custom-restricted-width">
                        <li className="menu_itm"><a className="menu_itm_link" href="/ZoinksToken">Zoinks Token</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/ZoinksERC20">Zoinks ERC20</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/ZoinksPair">Zoinks Pair</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/ZoinksStakingPool">Zoinks Staking Pool</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/ZoinksFactory">Zoinks Factory</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/Snacks">Snacks</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/SnacksStakingPool">Snacks Staking Pool</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/">Btc Snacks</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/EthSnacks">Eth Snacks</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/Pulse">Pulse</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/MasterChef">Master Chef</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/CakeToken">Cake Token</a></li>
                        <li className="menu_itm"><a className="menu_itm_link" href="/CakePulse">Cake Pulse</a></li>
                    </ul>
                </div>

                <div className="container">
                    <b>{this.state.wallet}</b><br />
                    <button id="connectWallet" type="button" onClick={(event) => {
                        event.preventDefault();
                        this.connectToWallet();
                        checkChainId();
                    }}>
                        Connect Wallet
                    </button>
                </div>
            </>
        );
    }
}


export default Header;


