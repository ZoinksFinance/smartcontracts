// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/// @title Необходимый интерфейс для контрактов, использующих контракт AveragePriceOracle.
interface IAveragePriceOracle {
    function update() external;
    function twapLast() external view returns (uint256);
}
