import React, { Component } from "react";
import "./App.css";

import ZoinksTokenMPV from "./mvp/ZoinksTokenMPV";
import ZoinksStakingPoolMVP from "./mvp/ZoinksStakingPoolMVP";
import MasterChefMVP from "./mvp/MasterChefMVP";
import SnacksStakingPoolMVP from "./mvp/SnacksStakingPoolMVP";
import PulseMVP from "./mvp/PulseMVP";
import SnacksMVP from "./mvp/SnacksMVP";
import BtcSnacksMVP from "./mvp/BtcSnacksMVP";
import EthSnacksMVP from "./mvp/EthSnacksMVP";

class MVPTest extends Component {

  constructor(props) {
    super(props);
    this.state = {
      // General
      loading: false,
    };
  }

  // Render de la DApp
  render() {
    // Loading
    let loadingShow = this.state.loading ? <p>Calling transaction</p> : null;

    return (
      <>
        <div className="container">
          <div className="methods">
            {loadingShow}
            <ZoinksTokenMPV></ZoinksTokenMPV>
          </div>

          <div className="methods">
            <MasterChefMVP></MasterChefMVP>
          </div>

          <div className="methods">
            <PulseMVP></PulseMVP>
          </div>
        </div>

        <div className="container mt-space mb-space">
          <div className="methods">
            <SnacksMVP></SnacksMVP>
          </div>

          <div className="methods">
            <BtcSnacksMVP></BtcSnacksMVP>
          </div>

          <div className="methods">
            <EthSnacksMVP></EthSnacksMVP>
          </div>
        </div>

        <div className="container mt-space mb-space">
          <div className="methods">
            <SnacksStakingPoolMVP></SnacksStakingPoolMVP>
          </div>

          <div className="methods">
            <ZoinksStakingPoolMVP></ZoinksStakingPoolMVP>
          </div>

          <div className="methods">
            <h2>-</h2>
          </div>
        </div>
      </>
    );
  }
}

export default MVPTest;
