// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
* @title Абстрактный стейкинг контракт,
* реализующий логику вознаграждения стейкеров в нескольких наградных токенах.
* @dev Является базовым контрактом для всех стейкинг пулов,
* которые вознаграждают стейкеров несколькими наградными токенами.
*/
abstract contract MultipleRewardPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public rewardsDuration = 12 hours;
    uint256 internal _totalSupply;
    address public stakingToken;
    address public poolRewardDistributor;
    address public seniorage;
    
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(address => mapping(address => uint256)) public rewards;
    mapping(address => uint256) public rewardPerTokenStored;
    mapping(address => uint256) public lastUpdateTimePerToken;
    mapping(address => uint256) public periodFinishPerToken;
    mapping(address => uint256) public rewardRates;
    mapping(address => uint256) public userLastDepositTime;
    mapping(address => uint256) internal _balances;
    EnumerableSet.AddressSet internal _rewardTokens;

    event RewardAdded(address indexed rewardToken, uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed rewardToken, address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    
    modifier onlyPoolRewardDistributor {
        require(
            msg.sender == poolRewardDistributor,
            "MultipleRewardPool: caller is not the PoolRewardDistributor contract"
        );
        _;
    }
    
    modifier onlyValidToken(address rewardToken_) {
        require(
            _rewardTokens.contains(rewardToken_),
            "MultipleRewardPool: invalid token"
        );
        _;
    }
    
    modifier updateReward(address user_) {
        _updateAllRewards(user_);
        _;
    }
    
    modifier updateRewardPerToken(address rewardToken_, address user_) {
        _updateReward(rewardToken_, user_);
        _;
    }
    
    /// @param stakingToken_ Адрес токена, который стейкают пользователи.
    /// @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    /// @param seniorage_ Адрес контракта Seniorage.
    /// @param rewardTokens_ Адреса наградных токенов.
    constructor(
        address stakingToken_,
        address poolRewardDistributor_,
        address seniorage_,
        address[] memory rewardTokens_
    ) {
        stakingToken = stakingToken_;
        poolRewardDistributor = poolRewardDistributor_;
        seniorage = seniorage_;
        for (uint256 i = 0; i < rewardTokens_.length; i++) {
            _rewardTokens.add(rewardTokens_[i]);
        }
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
    * @notice Функция, реализующая логику переустановки rewardsDuration.
    * @dev Функция может быть вызвана только владельцем контракта
    * и не раньше срока окончания `periodFinishPerToken`.
    * @param rewardsDuration_ Новое значение `rewardsDuration` в секундах.
    */
    function setRewardsDuration(uint256 rewardsDuration_) external onlyOwner {
        bool finished = true;
        for (uint256 i = 0; i < _rewardTokens.length(); i++) {
            if (block.timestamp <= periodFinishPerToken[_rewardTokens.at(i)]) {
                finished = false;
            }
            require(
                finished, 
                "MultipleRewardPool: duration cannot be changed now"
            );
        }
        rewardsDuration = rewardsDuration_;
        emit RewardsDurationUpdated(rewardsDuration_);
    }
    
    /// @notice Функция, реализующая логику добавления нового наградного токена.
    /// @dev Функция может быть вызвана только владельцем контракта.
    /// @param rewardToken_ Адрес нового наградного токена.
    function addRewardToken(address rewardToken_) external onlyOwner {
        require(
            _rewardTokens.add(rewardToken_), 
            "MultipleRewardPool: already contains"
        );
    }
    
    /// @notice Функция, реализующая логику удаления одного из существующих наградных токенов.
    /// @dev Функция может быть вызвана только владельцем контракта.
    /// @param rewardToken_ Адрес одного из существующих наградных токенов.
    function removeRewardToken(address rewardToken_) external onlyOwner {
        require(
            _rewardTokens.remove(rewardToken_), 
            "MultipleRewardPool: not found"
        );
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
            "MultipleRewardPool: can not stake 0"
        );
        _totalSupply += amount_;
        _balances[msg.sender] += amount_;
        userLastDepositTime[msg.sender] = block.timestamp;
        IERC20(stakingToken).safeTransferFrom(msg.sender, address(this), amount_);
        emit Staked(msg.sender, amount_);
    }
    
    /**
    * @notice Функция, реализующая логику вывода всего стейка
    * и снятия заработанных пользователем наград.
    */
    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }
    
    /**
    * @notice Функция, реализующая логику уведомления стейкинг пула о пришедшей награде
    * для одного из наградных токенов, а также пересчета скорости раздачи награды.
    * @dev Функция может быть вызвана только контрактом PoolRewardDistributor раз в 12 часов.
    * @param rewardToken_ Адрес одного из наградных токенов, для которого пришла награда.
    * @param reward_ Размер награды.
    */
    function notifyRewardAmount(
        address rewardToken_,
        uint256 reward_
    )
        external
        virtual
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
        uint256 balance = IERC20(rewardToken_).balanceOf(address(this));
        require(
            rewardRates[rewardToken_] <= balance / rewardsDuration,
            "MultipleRewardPool: provided reward too high"
        );
        lastUpdateTimePerToken[rewardToken_] = block.timestamp;
        periodFinishPerToken[rewardToken_] = block.timestamp + rewardsDuration;
        emit RewardAdded(rewardToken_, reward_);
    }

    /// @notice Функция, реализующая логику вывода количества стейкнутых пользователем токенов.
    /// @param user_ Адрес пользователя.
    function getBalance(address user_) external view virtual returns (uint256) {
        return _balances[user_];
    }

    /// @notice Функция, реализующая логику вывода количества стейкнутых пользователями.
    function getTotalSupply() external view virtual returns (uint256) {
        return _totalSupply;
    }
    
    /**
    * @notice Функция, реализующая логику получения адреса
    * одного из существующих наградных токенов.
    * @param index_ Индекс.
    */
    function getRewardToken(uint256 index_) external view returns (address) {
        return _rewardTokens.at(index_);
    }
    
    /// @notice Функция, реализующая логику получения количества наградных токенов.
    function getRewardTokensCount() external view returns (uint256) {
        return _rewardTokens.length();
    }
    
    /**
    * @notice Функция, реализующая логику подсчета общей награды,
    * которая заработается за `rewardsDuration` для одного из наградных токенов.
    * @dev Скорость раздачи награды может поменяться спустя время,
    * поэтому эта функция не претендует на точность.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    */
    function getRewardForDuration(
        address rewardToken_
    )
        external
        view
        onlyValidToken(rewardToken_)
        returns (uint256)
    {
        return rewardRates[rewardToken_] * rewardsDuration;
    }
    
    /**
    * @notice Функция, реализующая логику подсчета награды пользователя,
    * которая заработается за произвольный промежуток времени для одного из наградных токенов.
    * @dev Скорость раздачи награды может поменяться спустя время,
    * поэтому эта функция не претендует на точность.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    * @param user_ Адрес пользователя.
    * @param duration_ Произвольный промежуток времени в секундах.
    */
    function calculatePotentialReward(
        address rewardToken_,
        address user_,
        uint256 duration_
    )
        external
        view
        onlyValidToken(rewardToken_)
        returns (uint256)
    {
        return
            _balances[user_]
            * (_rewardPerTokenForDuration(rewardToken_, duration_)
            - userRewardPerTokenPaid[rewardToken_][user_])
            / 1e18
            + rewards[user_][rewardToken_];
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
        virtual
        nonReentrant
        updateReward(msg.sender)
    {
        require(
            amount_ > 0, 
            "MultipleRewardPool: can not withdraw 0"
        );
        _totalSupply -= amount_;
        _balances[msg.sender] -= amount_;
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
    
    /// @notice Функция, реализующая логику снятия заработанных пользователем наград.
    function getReward() public virtual nonReentrant updateReward(msg.sender) {
        for (uint256 i = 0; i < _rewardTokens.length(); i++) {
            address rewardToken = _rewardTokens.at(i);
            uint256 reward = rewards[msg.sender][rewardToken];
            if (reward > 0) {
                rewards[msg.sender][rewardToken] = 0;
                IERC20(rewardToken).safeTransfer(msg.sender, reward);
                emit RewardPaid(rewardToken, msg.sender, reward);
            }
        }
    }

    /**
    * @notice Функция, реализующая логику корректного вычисления разницы во времени
    * между последним обновлением `lastUpdateTimePerToken` и `periodFinishPerToken`.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    */
    function lastTimeRewardApplicable(
        address rewardToken_
    )
        public
        view
        onlyValidToken(rewardToken_)
        returns (uint256)
    {
        return
            block.timestamp < periodFinishPerToken[rewardToken_]
            ? block.timestamp
            : periodFinishPerToken[rewardToken_];
    }
    
    /**
    * @notice Функция, реализующая логику вычисления количества награды
    * для одного из наградных токенов за один стейкнутый токен.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    */
    function rewardPerToken(
        address rewardToken_
    )
        public
        view
        onlyValidToken(rewardToken_)
        returns (uint256)
    {
        if (_totalSupply == 0) {
            return rewardPerTokenStored[rewardToken_];
        }
        return
            (lastTimeRewardApplicable(rewardToken_) - lastUpdateTimePerToken[rewardToken_])
            * rewardRates[rewardToken_]
            * 1e18
            / _totalSupply
            + rewardPerTokenStored[rewardToken_];
    }
    
    /**
    * @notice Функция, реализующая логику вычисления количества
    * заработанной пользователем награды для одного из наградных токенов.
    * @param user_ Адрес пользователя.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    */
    function earned(
        address user_,
        address rewardToken_
    )
        public
        view
        virtual
        onlyValidToken(rewardToken_)
        returns (uint256)
    {
        return
            _balances[user_]
            * (rewardPerToken(rewardToken_) - userRewardPerTokenPaid[rewardToken_][user_])
            / 1e18
            + rewards[user_][rewardToken_];
    }
    
    /// @notice Функция, реализующая логику обновления всех заработанных пользователем наград.
    /// @param user_ Адрес пользователя.
    function _updateAllRewards(address user_) private {
        for (uint256 i = 0; i < _rewardTokens.length(); i++) {
            _updateReward(_rewardTokens.at(i), user_);
        }
    }
    
    /**
    * @notice Функция, реализующая логику обновления заработанной пользователем награды
    * для одного из наградных токенов.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    * @param user_ Адрес пользователя.
    */
    function _updateReward(address rewardToken_, address user_) private {
        rewardPerTokenStored[rewardToken_] = rewardPerToken(rewardToken_);
        lastUpdateTimePerToken[rewardToken_] = lastTimeRewardApplicable(rewardToken_);
        if (user_ != address(0)) {
            rewards[user_][rewardToken_] = earned(user_, rewardToken_);
            userRewardPerTokenPaid[rewardToken_][user_] = rewardPerTokenStored[rewardToken_];
        }
    }
    
    /**
    * @notice Функция, реализующая логику функции {rewardPerToken}
    * за произвольный промежуток времени.
    * @dev Функция используется только для вычисления потенциальной награды пользователя
    * в одном из наградных токенов за произвольный промежуток времени.
    * @param rewardToken_ Адрес одного из существующих наградных токенов.
    * @param duration_ Произвольный промежуток времени в секундах.
    */
    function _rewardPerTokenForDuration(
        address rewardToken_,
        uint256 duration_
    )
        private
        view
        returns (uint256)
    {
        if (_totalSupply == 0) {
            return rewardPerTokenStored[rewardToken_];
        }
        return
            duration_
            * rewardRates[rewardToken_]
            * 1e18
            / _totalSupply
            + rewardPerTokenStored[rewardToken_];
    }
}