// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

/**
* @title Необходимый интерфейс для контрактов,
* использующих наследников от абстрактного контракта SingleRewardPool.
*/
interface ISingleRewardPool {
    function notifyRewardAmount(uint256 reward) external;
}
