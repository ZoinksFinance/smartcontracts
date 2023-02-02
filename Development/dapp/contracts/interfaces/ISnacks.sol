// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/// @title Необходимый интерфейс для контрактов, использующих контракт Snacks.
interface ISnacks {
    function notifyBtcSnacksFeeAmount(uint256 feeAmount) external;
    function notifyEthSnacksFeeAmount(uint256 feeAmount) external;
}
