// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./interfaces/ISnacksBase.sol";
import "./interfaces/IRouter.sol";

/// @title Контракт, реализующий механизм risk free стейкинга.
contract LunchBox is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    
    struct Recipient {
        address destination;
        uint256 percent;
    }
    
    uint256 constant private BASE_PERCENT = 10000;
    
    uint256 public rewardsDuration = 12 hours;
    uint256 public totalSupply;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;
    uint256 public rewardRate;
    address public busd;
    address public zoinks;
    address public btc;
    address public eth;
    address public snacks;
    address public btcSnacks;
    address public ethSnacks;
    address public snacksPool;
    address public poolRewardDistributor;
    address public seniorage;
    address public router;
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public userZoinksAmountStored;
    mapping(address => uint256) public userSnacksAmountStored;
    mapping(address => uint256) public userBtcSnacksAmountStored;
    mapping(address => uint256) public userEthSnacksAmountStored;
    Recipient[] public recipients;
    
    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    
    modifier onlyPoolRewardDistributor {
        require(
            msg.sender == poolRewardDistributor,
            "LunchBox: caller is not the PoolRewardDistributor contract"
        );
        _;
    }
    
    modifier onlySnacksPool {
        require(
            msg.sender == snacksPool,
            "LunchBox: caller is not the SnacksPool contract"
        );
        _;
    }
    
    modifier onlySeniorage {
        require(
            msg.sender == seniorage,
            "LunchBox: caller is not the Seniorage contract"
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
    
    /// @param busd_ Адрес BUSD токена.
    /// @param btc_ Адрес BTC токена.
    /// @param eth_ Адрес ETH токена.
    /// @param router_ Адрес PancakeSwap роутера.
    constructor(
        address busd_,
        address btc_,
        address eth_,
        address router_
    ) {
        busd = busd_;
        btc = btc_;
        eth = eth_;
        router = router_;
        IERC20(busd_).approve(router_, type(uint256).max);
        IERC20(btc_).approve(router_, type(uint256).max);
        IERC20(eth_).approve(router_, type(uint256).max);
    }
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки
    * в случае редеплоя контрактов.
    * @dev Если редеплоится какой-то один контракт, то на место тех адресов,
    * которые не редеплоились, передаются старые значения.
    * @param zoinks_ Адрес ZOINKS токена.
    * @param snacks_ Адрес SNACKS токена.
    * @param btcSnacks_ Адрес BTCSNACKS токена.
    * @param ethSnacks_ Адрес ETHSNACKS токена.
    * @param snacksPool_ Адрес контракта SnacksPool.
    * @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    * @param seniorage_ Адрес контракта Seniorage.
    */
    function configure(
        address zoinks_,
        address snacks_,
        address btcSnacks_,
        address ethSnacks_,
        address snacksPool_,
        address poolRewardDistributor_,
        address seniorage_
    )
        external
        onlyOwner
    {
        zoinks = zoinks_;
        snacks = snacks_;
        btcSnacks = btcSnacks_;
        ethSnacks = ethSnacks_;
        snacksPool = snacksPool_;
        poolRewardDistributor = poolRewardDistributor_;
        seniorage = seniorage_;
        if (IERC20(zoinks_).allowance(address(this), router) == 0) {
            IERC20(zoinks_).approve(router, type(uint256).max);
        }
        if (IERC20(zoinks_).allowance(address(this), snacks_) == 0) {
            IERC20(zoinks_).approve(snacks_, type(uint256).max);
        }
        if (IERC20(btcSnacks_).allowance(address(this), btcSnacks_) == 0) {
            IERC20(btcSnacks_).approve(btcSnacks_, type(uint256).max);
        }
        if (IERC20(ethSnacks_).allowance(address(this), ethSnacks_) == 0) {
            IERC20(ethSnacks_).approve(ethSnacks_, type(uint256).max);
        }
    }
    
    /**
    * @notice Функция, реализующая логику установки получателей BUSD
    * токенов внутри всех стейк функций.
    * @param destinations_ Адреса получателей.
    * @param percents_ Проценты получателей от общего числа распределяемых BUSD токенов.
    */
    function setRecipients(
        address[] memory destinations_,
        uint256[] memory percents_
    )
        external
        onlyOwner
    {
        uint256 length = percents_.length;
        require(
            destinations_.length == length &&
            length != 0,
            "LunchBox: invalid array lengths"
        );
        uint256 sum;
        for (uint256 i = 0; i < length; i++) {
            sum += percents_[i];
        }
        require(
            sum == BASE_PERCENT,
            "LunchBox: invalid percents sum"
        );
        delete recipients;
        for (uint256 i = 0; i < length; i++) {
            Recipient memory recipient;
            recipient.destination = destinations_[i];
            recipient.percent = percents_[i];
            recipients.push(recipient);
        }
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
            "LunchBox: duration cannot be changed now"
        );
        rewardsDuration = rewardsDuration_;
        emit RewardsDurationUpdated(rewardsDuration);
    }
    
    /// @notice Функция, реализующая логику стейкинга.
    /// @dev Может быть вызвана только контрактом Seniorage.
    /// @param busdAmount_ Количество BUSD токенов для стейка.
    function stake(
        uint256 busdAmount_
    )
        external
        nonReentrant
        onlySeniorage
        updateReward(address(0))
    {
        if (busdAmount_ != 0) {
            IERC20(busd).safeTransferFrom(msg.sender, address(this), busdAmount_);
            for (uint256 i = 0; i < recipients.length; i++) {
                IERC20(busd).safeTransfer(
                    recipients[i].destination,
                    busdAmount_ * recipients[i].percent / BASE_PERCENT
                );
            }
        }
        emit Staked(msg.sender, busdAmount_);
    }
    
    /// @notice Функция, реализующая логику стейкинга.
    /// @dev Может быть вызвана только контрактом Seniorage.
    /// @param zoinksAmount_ Количество ZOINKS токенов для стейка.
    /// @param btcAmount_ Количество BTC токенов для стейка.
    /// @param ethAmount_ Количество ETH токенов для стейка.
    /// @param snacksAmount_ Количество SNACKS токенов для стейка.
    /// @param btcSnacksAmount_ Количество BTCSNACKS токенов для стейка.
    /// @param ethSnacksAmount_ Количество ETHSNACKS токенов для стейка.
    function stake(
        uint256 zoinksAmount_,
        uint256 btcAmount_,
        uint256 ethAmount_,
        uint256 snacksAmount_,
        uint256 btcSnacksAmount_,
        uint256 ethSnacksAmount_
    )
        external
        nonReentrant
        onlySeniorage
        updateReward(address(0))
    {
        if (zoinksAmount_ != 0) {
            IERC20(zoinks).safeTransferFrom(msg.sender, address(this), zoinksAmount_);
        }
        if (btcAmount_ != 0) {
            IERC20(btc).safeTransferFrom(msg.sender, address(this), btcAmount_);
        }
        if (ethAmount_ != 0) {
            IERC20(eth).safeTransferFrom(msg.sender, address(this), ethAmount_);
        }
        if (snacksAmount_ != 0) {
            IERC20(snacks).safeTransferFrom(msg.sender, address(this), snacksAmount_);
            uint256 snacksAmountToRedeem = snacksAmount_ + userSnacksAmountStored[msg.sender];
            if (ISnacksBase(snacks).sufficientBuyTokenAmountOnRedeem(snacksAmountToRedeem)) {
                ISnacksBase(snacks).redeem(snacksAmountToRedeem);
                if (userSnacksAmountStored[msg.sender] != 0) {
                    userSnacksAmountStored[msg.sender] = 0;
                }
            } else {
                userSnacksAmountStored[msg.sender] += snacksAmount_;
            }
        }
        if (btcSnacksAmount_ != 0) {
            IERC20(btcSnacks).safeTransferFrom(msg.sender, address(this), btcSnacksAmount_);
            uint256 btcSnacksAmountToRedeem = btcSnacksAmount_ + userBtcSnacksAmountStored[msg.sender];
            if (ISnacksBase(btcSnacks).sufficientBuyTokenAmountOnRedeem(btcSnacksAmountToRedeem)) {
                ISnacksBase(btcSnacks).redeem(btcSnacksAmountToRedeem);
                if (userBtcSnacksAmountStored[msg.sender] != 0) {
                    userBtcSnacksAmountStored[msg.sender] = 0;
                }
            } else {
                userBtcSnacksAmountStored[msg.sender] += btcSnacksAmount_;
            }
        }
        if (ethSnacksAmount_ != 0) {
            IERC20(ethSnacks).safeTransferFrom(msg.sender, address(this), ethSnacksAmount_);
            uint256 ethSnacksAmountToRedeem = ethSnacksAmount_ + userEthSnacksAmountStored[msg.sender];
            if (ISnacksBase(ethSnacks).sufficientBuyTokenAmountOnRedeem(ethSnacksAmountToRedeem)) {
                ISnacksBase(ethSnacks).redeem(ethSnacksAmountToRedeem);
                if (userEthSnacksAmountStored[msg.sender] != 0) {
                    userEthSnacksAmountStored[msg.sender] = 0;
                }
            } else {
                userEthSnacksAmountStored[msg.sender] += ethSnacksAmount_;
            }
        }
        uint256 busdAmount;
        address[] memory path = new address[](2);
        path[1] = busd;
        uint256[] memory amounts = new uint256[](2);
        uint256 zoinksBalance = IERC20(zoinks).balanceOf(address(this));
        if (zoinksBalance != 0) {
            path[0] = zoinks;
            amounts = IRouter(router).swapExactTokensForTokens(
                zoinksBalance,
                0,
                path,
                address(this),
                block.timestamp + 15
            );
            busdAmount += amounts[1];
        }
        uint256 btcBalance = IERC20(btc).balanceOf(address(this));
        if (btcBalance != 0) {
            path[0] = btc;
            amounts = IRouter(router).swapExactTokensForTokens(
                btcBalance,
                0,
                path,
                address(this),
                block.timestamp + 15
            );
            busdAmount += amounts[1];
        }
        uint256 ethBalance = IERC20(eth).balanceOf(address(this));
        if (ethBalance != 0) {
            path[0] = eth;
            amounts = IRouter(router).swapExactTokensForTokens(
                ethBalance,
                0,
                path,
                address(this),
                block.timestamp + 15
            );
            busdAmount += amounts[1];
        }
        if (busdAmount != 0) {
            for (uint256 i = 0; i < recipients.length; i++) {
                IERC20(busd).safeTransfer(
                    recipients[i].destination,
                    busdAmount * recipients[i].percent / BASE_PERCENT
                );
            }
        }
        emit Staked(msg.sender, busdAmount);
    }
    
    /// @notice Функция, реализующая логику стейкинга.
    /// @dev Может быть вызвана только контрактом SnacksPool.
    /// @param user_ Адрес пользователя.
    /// @param snacksAmount_ Количество SNACKS токенов для стейка.
    /// @param btcSnacksAmount_ Количество BTCSNACKS токенов для стейка.
    /// @param ethSnacksAmount_ Количество ETHSNACKS токенов для стейка.
    function stake(
        address user_,
        uint256 snacksAmount_,
        uint256 btcSnacksAmount_,
        uint256 ethSnacksAmount_
    )
        external
        nonReentrant
        onlySnacksPool
        updateReward(user_)
    {
        uint256 busdAmount;
        address[] memory path = new address[](2);
        path[1] = busd;
        uint256[] memory amounts = new uint256[](2);
        if (snacksAmount_ != 0) {
            IERC20(snacks).safeTransferFrom(msg.sender, address(this), snacksAmount_);
            uint256 snacksAmountToRedeem = snacksAmount_ + userSnacksAmountStored[user_];
            if (ISnacksBase(snacks).sufficientBuyTokenAmountOnRedeem(snacksAmountToRedeem)) {
                uint256 zoinksAmount = ISnacksBase(snacks).redeem(snacksAmountToRedeem);
                path[0] = zoinks;
                amounts = IRouter(router).swapExactTokensForTokens(
                    zoinksAmount,
                    0,
                    path,
                    address(this),
                    block.timestamp + 15
                );
                busdAmount += amounts[1];
                if (userSnacksAmountStored[user_] != 0) {
                    userSnacksAmountStored[user_] = 0;
                }
            } else {
                userSnacksAmountStored[user_] += snacksAmount_;
            }
        }
        if (btcSnacksAmount_ != 0) {
            IERC20(btcSnacks).safeTransferFrom(msg.sender, address(this), btcSnacksAmount_);
            uint256 btcSnacksAmountToRedeem = btcSnacksAmount_ + userBtcSnacksAmountStored[user_];
            if (ISnacksBase(btcSnacks).sufficientBuyTokenAmountOnRedeem(btcSnacksAmountToRedeem)) {
                uint256 btcAmount = ISnacksBase(btcSnacks).redeem(btcSnacksAmountToRedeem);
                path[0] = btc;
                amounts = IRouter(router).swapExactTokensForTokens(
                    btcAmount,
                    0,
                    path,
                    address(this),
                    block.timestamp + 15
                );
                busdAmount += amounts[1];
                if (userBtcSnacksAmountStored[user_] != 0) {
                    userBtcSnacksAmountStored[user_] = 0;
                }
            } else {
                userBtcSnacksAmountStored[user_] += btcSnacksAmount_;
            }
        }
        if (ethSnacksAmount_ != 0) {
            IERC20(ethSnacks).safeTransferFrom(msg.sender, address(this), ethSnacksAmount_);
            uint256 ethSnacksAmountToRedeem = ethSnacksAmount_ + userEthSnacksAmountStored[user_];
            if (ISnacksBase(ethSnacks).sufficientBuyTokenAmountOnRedeem(ethSnacksAmountToRedeem)) {
                uint256 ethAmount = ISnacksBase(ethSnacks).redeem(ethSnacksAmountToRedeem);
                path[0] = eth;
                amounts = IRouter(router).swapExactTokensForTokens(
                    ethAmount,
                    0,
                    path,
                    address(this),
                    block.timestamp + 15
                );
                busdAmount += amounts[1];
                if (userEthSnacksAmountStored[user_] != 0) {
                    userEthSnacksAmountStored[user_] = 0;
                }
            } else {
                userEthSnacksAmountStored[user_] += ethSnacksAmount_;
            }
        }
        if (busdAmount != 0) {
            totalSupply += busdAmount;
            balances[user_] += busdAmount;
            for (uint256 i = 0; i < recipients.length; i++) {
                IERC20(busd).safeTransfer(
                    recipients[i].destination,
                    busdAmount * recipients[i].percent / BASE_PERCENT
                );
            }
        }
        emit Staked(user_, busdAmount);
    }
    
    /// @notice Функция, реализующая логику выхода из LunchBox контракта.
    /// @dev Может быть вызвана только контрактом SnacksPool.
    /// @param user_ Адрес пользователя.
    function exit(address user_) external onlySnacksPool {
        totalSupply -= balances[user_];
        balances[user_] = 0;
        getReward(user_);
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
        uint256 balance = IERC20(busd).balanceOf(address(this));
        require(
            rewardRate <= balance / rewardsDuration,
            "LunchBox: provided reward too high"
        );
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward_);
    }
    
    /// @notice Функция, реализующая логику снятия заработанной награды для пользователя.
    /// @dev Функция может быть вызвана только контрактом SnacksPool.
    /// @param user_ Адрес пользователя.
    function getReward(
        address user_
    )
        public
        nonReentrant
        onlySnacksPool
        updateReward(user_)
    {
        uint256 reward = rewards[user_];
        if (reward > 0) {
            rewards[user_] = 0;
            address[] memory path = new address[](2);
            path[0] = busd;
            path[1] = zoinks;
            uint256[] memory amounts = IRouter(router).swapExactTokensForTokens(
                reward,
                0,
                path,
                address(this),
                block.timestamp + 15
            );
            uint256 zoinksAmount = amounts[1] + userZoinksAmountStored[user_];
            if (ISnacksBase(snacks).sufficientPayTokenAmountOnMint(zoinksAmount)) {
                uint256 snacksAmount = ISnacksBase(snacks).mintWithPayTokenAmount(zoinksAmount);
                IERC20(snacks).safeTransfer(user_, snacksAmount);
                if (userZoinksAmountStored[user_] != 0) {
                    userZoinksAmountStored[user_] = 0;
                }
                emit RewardPaid(user_, snacksAmount);
            } else {
                userZoinksAmountStored[user_] += amounts[1];
            }
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
