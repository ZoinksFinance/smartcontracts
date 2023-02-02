// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/// @title Необходимый интерфейс для контрактов, использующих контракт Pair.
interface IPair {
    function sync() external;
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price1CumulativeLast() external view returns (uint256);
}
