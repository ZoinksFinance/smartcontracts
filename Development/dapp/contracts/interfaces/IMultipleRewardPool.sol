// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/**
* @title Необходимый интерфейс для контрактов,
* использующих наследников от абстрактного контракта MultipleRewardPool.
*/
interface IMultipleRewardPool {
    function notifyRewardAmount(
        address rewardToken,
        uint256 reward
    )
        external;
    function stake(uint256 amount) external;
    function getReward() external;
    function balances(address user) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}
