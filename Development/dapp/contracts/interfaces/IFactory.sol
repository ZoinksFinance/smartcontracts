// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/// @title Необходимый интерфейс для контрактов, использующих контракт Factory.
interface IFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}
