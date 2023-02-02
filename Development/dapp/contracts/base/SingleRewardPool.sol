// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
* @title Абстрактный стейкинг контракт,
* реализующий логику вознаграждения стейкеров в одном наградном токене.
* @dev Является базовым контрактом для всех стейкинг пулов,
* которые вознаграждают стейкеров одним наградным токеном.
*/
abstract contract SingleRewardPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    uint256 public rewardsDuration = 12 hours;
    uint256 public totalSupply;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;
    uint256 public rewardRate;
    address public stakingToken;
    address public poolRewardDistributor;
    address public seniorage;
    address public rewardToken;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public userLastDepositTime;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    
    modifier onlyPoolRewardDistributor {
        require(
            msg.sender == poolRewardDistributor,
            "SingleRewardPool: caller is not the PoolRewardDistributor contract"
        );
        _;
    }
    
    modifier updateReward(address user_) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (user_ != address(0)) {
            rewards[user_] = earned(user_);
            userRewardPerTokenPaid[user_] = rewardPerTokenStored;
        }
        _;
    }
    
    /// @param stakingToken_ Адрес токена, который стейкают пользователи.
    /// @param rewardToken_ Адрес наградного токена.
    /// @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    /// @param seniorage_ Адрес контракта Seniorage.
    constructor(
        address stakingToken_,
        address rewardToken_,
        address poolRewardDistributor_,
        address seniorage_
    ) {
        stakingToken = stakingToken_;
        rewardToken = rewardToken_;
        poolRewardDistributor = poolRewardDistributor_;
        seniorage = seniorage_;
    }

    /// @notice Функция, реализующая логику переустановки адреса контракта PoolRewardDistributor.
    /// @dev Функция может быть вызвана только владельцем контракта.
    /// @param poolRewardDistributor_ Адрес нового контракта PoolRewardDistributor.
    function setPoolRewardDistributor(address poolRewardDistributor_) external onlyOwner {
        poolRewardDistributor = poolRewardDistributor_;
    }
    
    /// @notice Функция, реализующая логику переустановки адреса контракта Seniorage.
    /// @dev Функция может быть вызвана только владельцем контракта.
    /// @param seniorage_ Адрес нового контракта Seniorage.
    function setSeniorage(address seniorage_) external onlyOwner {
        seniorage = seniorage_;
    }
    
    /**
    * @notice Функция, реализующая логику переустановки `rewardsDuration`.
    * @dev Функция может быть вызвана только владельцем контракта
    * и не раньше срока окончания `periodFinish`.
    * @param rewardsDuration_ Новое значение для `rewardsDuration` в секундах.
    */
    function setRewardsDuration(uint256 rewardsDuration_) external onlyOwner {
        require(
            block.timestamp > periodFinish,
            "SingleRewardPool: duration cannot be changed now"
        );
        rewardsDuration = rewardsDuration_;
        emit RewardsDurationUpdated(rewardsDuration);
    }
    
    /// @notice Функция, реализующая логику стейкинга пользователем.
    /// @param amount_ Количество токенов для стейка.
    function stake(
        uint256 amount_
    ) 
        external 
        nonReentrant 
        updateReward(msg.sender) 
    {
        require(
            amount_ > 0, 
            "SingleRewardPool: can not stake 0"
        );
        totalSupply += amount_;
        balances[msg.sender] += amount_;
        userLastDepositTime[msg.sender] = block.timestamp;
        IERC20(stakingToken).safeTransferFrom(msg.sender, address(this), amount_);
        emit Staked(msg.sender, amount_);
    }
    
    /**
    * @notice Функция, реализующая логику вывода всего стейка
    * и снятия заработанной пользователем награды.
    */
    function exit() external {
        withdraw(balances[msg.sender]);
        getReward();
    }
    
    /**
    * @notice Функция, реализующая логику уведомления стейкинг пула о пришедшей награде,
    * а также пересчета скорости раздачи награды.
    * @dev Функция может быть вызвана только контрактом PoolRewardDistributor раз в 12 часов.
    * @param reward_ Размер награды.
    */
    function notifyRewardAmount(
        uint256 reward_
    ) 
        external 
        onlyPoolRewardDistributor 
        updateReward(address(0)) 
    {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward_ / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward_ + leftover) / rewardsDuration;
        }
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));
        require(
            rewardRate <= balance / rewardsDuration, 
            "SingleRewardPool: provided reward too high"
        );
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward_);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета общей награды,
    * которая заработается за `rewardsDuration`.
    * @dev Скорость раздачи награды может поменяться спустя время,
    * поэтому эта функция не претендует на точность.
    */
    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * rewardsDuration;
    }
    
    /**
    * @notice Функция, реализующая логику вывода из стейкинга
    * произвольного количества токенов пользователем.
    * @param amount_ Количество токенов для вывода.
    */
    function withdraw(uint256 amount_) public nonReentrant updateReward(msg.sender) {
        require(
            amount_ > 0, 
            "SingleRewardPool: can not withdraw 0"
        );
        totalSupply -= amount_;
        balances[msg.sender] -= amount_;
        uint256 seniorageFeeAmount;
        if (block.timestamp <= userLastDepositTime[msg.sender] + 1 days) {
            seniorageFeeAmount = amount_ / 2;
            IERC20(stakingToken).safeTransfer(seniorage, seniorageFeeAmount);
            IERC20(stakingToken).safeTransfer(msg.sender, amount_ - seniorageFeeAmount);
        } else {
            seniorageFeeAmount = amount_ / 10;
            IERC20(stakingToken).safeTransfer(seniorage, seniorageFeeAmount);
            IERC20(stakingToken).safeTransfer(msg.sender, amount_ - seniorageFeeAmount);
        }
        emit Withdrawn(msg.sender, amount_ - seniorageFeeAmount);
    }

    /// @notice Функция, реализующая логику снятия заработанной пользователем награды.
    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            IERC20(rewardToken).safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    /**
    * @notice Функция, реализующая логику корректного вычисления разницы во времени
    * между последним обновлением `lastUpdateTime` и `periodFinish`.
    */
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }
    
    /**
    * @notice Функция, реализующая логику вычисления количества награды
    * за один стейкнутый токен.
    */
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            (lastTimeRewardApplicable() - lastUpdateTime)
            * rewardRate
            * 1e18
            / totalSupply
            + rewardPerTokenStored;
    }
    
    /**
    * @notice Функция, реализующая логику вычисления количества
    * заработанной пользователем награды.
    * @param user_ Адрес пользователя.
    */
    function earned(address user_) public view returns (uint256) {
        return
            balances[user_]
            * (rewardPerToken() - userRewardPerTokenPaid[user_])
            / 1e18
            + rewards[user_];
    }
}
