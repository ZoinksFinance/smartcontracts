// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "./base/MultipleRewardPool.sol";

/// @title Стейкинг контракт для держателей PancakeSwap LP токенов.
contract PancakeSwapPool is MultipleRewardPool {
    /// @param stakingToken_ Адрес токена, который стейкают пользователи.
    /// @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    /// @param seniorage_ Адрес контракта Seniorage.
    /// @param rewardTokens_ Адреса наградных токенов.
    constructor(
        address stakingToken_,
        address poolRewardDistributor_,
        address seniorage_,
        address[] memory rewardTokens_
    )
        MultipleRewardPool(
            stakingToken_,
            poolRewardDistributor_,
            seniorage_,
            rewardTokens_
        )
    {}
}
