// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/// @title Необходимый интерфейс для контрактов, использующих контракт LunchBox.
interface ILunchBox {
    function stake(uint256 busdAmount) external;
    function stake(
        uint256 zoinksAmount,
        uint256 btcAmount,
        uint256 ethAmount,
        uint256 snacksAmount,
        uint256 btcSnacksAmount,
        uint256 ethSnacksAmount
    )
        external;
    function stake(
        address user,
        uint256 snacksAmount,
        uint256 btcSnacksAmount,
        uint256 ethSnacksAmount
    )
        external;
    function getReward(address user) external;
    function exit(address user) external;
}
