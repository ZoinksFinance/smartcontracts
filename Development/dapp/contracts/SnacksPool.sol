// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@prb/math/contracts/PRBMathUD60x18.sol";

import "./base/MultipleRewardPool.sol";
import "./interfaces/ILunchBox.sol";
import "./interfaces/ISnacksBase.sol";

/// @title Стейкинг контракт для держателей SNACKS токенов.
contract SnacksPool is MultipleRewardPool {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    using PRBMathUD60x18 for uint256;

    address public lunchBox;
    address public snacks;
    address public btcSnacks;
    address public ethSnacks;
    
    mapping(address => uint256) public userLastLunchBoxActivationTime;
    EnumerableSet.AddressSet private _lunchBoxParticipants;
    
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
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки
    * в случае редеплоя контрактов.
    * @dev Если редеплоится какой-то один контракт, то на место тех адресов,
    * которые не редеплоились, передаются старые значения.
    * @param lunchBox_ Адрес контракта LunchBox.
    * @param snacks_ Адрес SNACKS токена.
    * @param btcSnacks_ Адрес BTCSNACKS токена.
    * @param ethSnacks_ Адрес ETHSNACKS токена.
    */
    function configure(
        address lunchBox_,
        address snacks_,
        address btcSnacks_,
        address ethSnacks_
    )
        external
        onlyOwner
    {
        lunchBox = lunchBox_;
        snacks = snacks_;
        btcSnacks = btcSnacks_;
        ethSnacks = ethSnacks_;
        if (IERC20(snacks_).allowance(address(this), lunchBox_) == 0) {
            IERC20(snacks_).approve(lunchBox_, type(uint256).max);
        }
        if (IERC20(btcSnacks_).allowance(address(this), lunchBox_) == 0) {
            IERC20(btcSnacks_).approve(lunchBox_, type(uint256).max);
        }
        if (IERC20(ethSnacks_).allowance(address(this), lunchBox_) == 0) {
            IERC20(ethSnacks_).approve(lunchBox_, type(uint256).max);
        }
    }
    
    /// @notice Функция, реализующая логику активации программы risk free.
    function activateLunchBox() external {
        require(
            _balances[msg.sender] > 0,
            "SnacksPool: only active stakers are able to activate LunchBox"
        );
        require(
            _lunchBoxParticipants.add(msg.sender),
            "SnacksPool: already activated"
        );
        userLastLunchBoxActivationTime[msg.sender] = block.timestamp;
    }
    
    /**
    * @notice Функция, реализующая логику проверки, является ли пользователь
    * участником программы risk free.
    */
    function isLunchBoxParticipant(address user_) external view returns (bool) {
        return _lunchBoxParticipants.contains(user_);
    }

    function getBalance(address user_) external view override returns (uint256) {
        return _balances[user_].mul(ISnacksBase(snacks).adjustmentFactor());
    }

    function getTotalSupply() external view override returns (uint256) {
        return _totalSupply.mul(ISnacksBase(snacks).adjustmentFactor());
    }

    /// @notice Функция, реализующая логику деактивации программы risk free.
    function deactivateLunchBox() public {
        require(
            block.timestamp >= userLastLunchBoxActivationTime[msg.sender] + 1 days,
            "SnacksPool: too early deactivation"
        );
        require(
            _lunchBoxParticipants.remove(msg.sender),
            "SnacksPool: not activated"
        );
        ILunchBox(lunchBox).exit(msg.sender);
    }
    
    /**
    * @notice Функция, реализующая логику вывода из стейкинга
    * произвольного количества токенов пользователем.
    * @param amount_ Количество токенов для вывода.
    */
    function withdraw(
        uint256 amount_
    )
        public
        override
        nonReentrant
        updateReward(msg.sender)
    {
        require(
            amount_ > 0,
            "MultipleRewardPool: can not withdraw 0"
        );
        uint256 adjustedAmount = amount_.div(ISnacksBase(snacks).adjustmentFactor());
        _totalSupply -= adjustedAmount;
        _balances[msg.sender] -= adjustedAmount;
        if (_lunchBoxParticipants.contains(msg.sender) && _balances[msg.sender] == 0) {
            deactivateLunchBox();
        }
        uint256 seniorageFeeAmount;
        if (block.timestamp < userLastDepositTime[msg.sender] + 1 days) {
            seniorageFeeAmount = amount_ / 2;
            IERC20(stakingToken).safeTransfer(seniorage, seniorageFeeAmount);
            IERC20(stakingToken).safeTransfer(msg.sender, amount_ - seniorageFeeAmount);
            emit Withdrawn(msg.sender, amount_ - seniorageFeeAmount);
        } else {
            IERC20(stakingToken).safeTransfer(msg.sender, amount_);
            emit Withdrawn(msg.sender, amount_);
        }
    }
    
    /// @notice Функция, реализующая логику снятия заработанных пользователем наград.
    function getReward() public override nonReentrant updateReward(msg.sender) {
        uint256 snacksReward;
        uint256 btcSnacksReward;
        uint256 ethSnacksReward;
        for (uint256 i = 0; i < _rewardTokens.length(); i++) {
            address rewardToken = _rewardTokens.at(i);
            uint256 reward = rewards[msg.sender][rewardToken];
            if (reward > 0) {
                rewards[msg.sender][rewardToken] = 0;
                if (rewardToken == snacks) {
                    snacksReward =
                        reward.mul(ISnacksBase(snacks).adjustmentFactor());
                } else if (rewardToken == btcSnacks) {
                    btcSnacksReward =
                        reward.mul(ISnacksBase(btcSnacks).adjustmentFactor());
                } else {
                    ethSnacksReward =
                        reward.mul(ISnacksBase(ethSnacks).adjustmentFactor());
                }
            }
        }
        if (_lunchBoxParticipants.contains(msg.sender)) {
            ILunchBox(lunchBox).getReward(msg.sender);
            if (snacksReward != 0 || btcSnacksReward != 0 || ethSnacksReward != 0) {
                ILunchBox(lunchBox).stake(msg.sender, snacksReward, btcSnacksReward, ethSnacksReward);
            }
        } else {
            if (snacksReward != 0) {
                IERC20(snacks).safeTransfer(msg.sender, snacksReward);
                emit RewardPaid(snacks, msg.sender, snacksReward);
            }
            if (btcSnacksReward != 0) {
                IERC20(btcSnacks).safeTransfer(msg.sender, btcSnacksReward);
                emit RewardPaid(btcSnacks, msg.sender, btcSnacksReward);
            }
            if (ethSnacksReward != 0) {
                IERC20(ethSnacks).safeTransfer(msg.sender, ethSnacksReward);
                emit RewardPaid(ethSnacks, msg.sender, ethSnacksReward);
            }
        }
    }
    
    /**
    * @notice Функция, реализующая логику уведомления стейкинг пула о пришедшей награде
    * для одного из наградных токенов, а также пересчета скорости раздачи награды.
    * @dev Функция может быть вызвана только контрактом PoolRewardDistributor раз в 12 часов.
    * Переопределена в связи с тем, что один из наградных токенов совпадает со стейкинг токеном.
    * @param rewardToken_ Адрес одного из наградных токенов, для которого пришла награда.
    * @param reward_ Размер награды.
    */
    function notifyRewardAmount(
        address rewardToken_,
        uint256 reward_
    )
        external
        override
        onlyPoolRewardDistributor
        onlyValidToken(rewardToken_)
        updateRewardPerToken(rewardToken_, address(0))
    {
        if (block.timestamp >= periodFinishPerToken[rewardToken_]) {
            rewardRates[rewardToken_] = reward_ / rewardsDuration;
        } else {
            uint256 remaining = periodFinishPerToken[rewardToken_] - block.timestamp;
            uint256 leftover = remaining * rewardRates[rewardToken_];
            rewardRates[rewardToken_] = (reward_ + leftover) / rewardsDuration;
        }
        uint256 balance;
        if (rewardToken_ == stakingToken) {
            balance =
                IERC20(rewardToken_).balanceOf(address(this))
                - _totalSupply.mul(ISnacksBase(rewardToken_).adjustmentFactor());
        } else {
            balance = IERC20(rewardToken_).balanceOf(address(this));
        }
        require(
            rewardRates[rewardToken_] <= balance / rewardsDuration,
            "SnacksPool: provided reward too high"
        );
        lastUpdateTimePerToken[rewardToken_] = block.timestamp;
        periodFinishPerToken[rewardToken_] = block.timestamp + rewardsDuration;
        emit RewardAdded(rewardToken_, reward_);
    }
}
