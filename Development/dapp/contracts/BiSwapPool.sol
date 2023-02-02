// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "./base/SingleRewardPool.sol";

/// @title Стейкинг контракт для держателей BiSwap LP токенов.
contract BiSwapPool is SingleRewardPool {
    /// @param stakingToken_ Адрес токена, который стейкают пользователи.
    /// @param rewardToken_ Адрес наградного токена.
    /// @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    /// @param seniorage_ Адрес контракта Seniorage.
    constructor(
        address stakingToken_,
        address rewardToken_,
        address poolRewardDistributor_,
        address seniorage_
    )
        SingleRewardPool(
            stakingToken_,
            rewardToken_,
            poolRewardDistributor_,
            seniorage_
        )
    {}
}
