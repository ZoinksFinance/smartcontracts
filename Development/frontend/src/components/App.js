import React, { Component } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from './Header';
import BtcSnacks from './BtcSnacks';
import CakePulse from './CakePulse';
import CakeToken from './CakeToken';
import EthSnacks from './EthSnacks';
import MasterChef from './MasterChef';
import Pulse from './Pulse';
import Snacks from './Snacks';
import SnacksStakingPool from './SnacksStakingPool';
import ZoinksPair from './ZoinksPair';
import ZoinksERC20 from './ZoinksERC20';
import ZoinksFactory from './ZoinksFactory';
import ZoinksStakingPool from './ZoinksStakingPool';
import ZoinksToken from './ZoinksToken';
import MVPTest from './MVPTest';

class App extends Component {

  render() {
    return (
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<MVPTest />}></Route>
            <Route path="/BtcSnacks" element={<BtcSnacks />}></Route>
            <Route path="/CakePulse" element={<CakePulse />}></Route>
            <Route path="/CakeToken" element={<CakeToken />}></Route>
            <Route path="/EthSnacks" element={<EthSnacks />}></Route>
            <Route path="/MasterChef" element={<MasterChef />}></Route>
            <Route path="/Pulse" element={<Pulse />}></Route>
            <Route path="/Snacks" element={<Snacks />}></Route>
            <Route path="/SnacksStakingPool" element={<SnacksStakingPool />}></Route>
            <Route path="/ZoinksPair" element={<ZoinksPair />}></Route>
            <Route path="/ZoinksERC20" element={<ZoinksERC20 />}></Route>
            <Route path="/ZoinksFactory" element={<ZoinksFactory />}></Route>
            <Route path="/ZoinksStakingPool" element={<ZoinksStakingPool />}></Route>
            <Route path="/ZoinksToken" element={<ZoinksToken />}></Route>
          </Routes>
        </main>
      </BrowserRouter>
    );
  }

}

export default App;
