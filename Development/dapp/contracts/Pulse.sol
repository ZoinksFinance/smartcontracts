// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IMultipleRewardPool.sol";
import "./interfaces/ISnacksBase.sol";
import "./interfaces/IRouter.sol";

/// @title Контракт, поддерживающий работу системы.
contract Pulse is Ownable {
    using SafeERC20 for IERC20;

    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private BTC_SNACKS_SENIORAGE_PERCENT = 5000;
    uint256 constant private ETH_SNACKS_SENIORAGE_PERCENT = 5000;
    uint256 constant private SNACKS_DISTRIBUTION_PERCENT = 1000;
    uint256 constant private ZOINKS_DISTRIBUTION_PERCENT = 1000;

    address public busd;
    address public cakeLP;
    address public zoinks;
    address public snacks;
    address public btcSnacks;
    address public ethSnacks;
    address public pancakeSwapPool;
    address public snacksPool;
    address public router;
    address public seniorage;
    address public authority;

    modifier onlyAuthority {
        require(
            msg.sender == authority,
            "Pulse: caller is not authorised"
        );
        _;
    }
    
    /// @param busd_ Адрес BUSD токена.
    /// @param router_ Адрес PancakeSwap роутера.
    constructor(
        address busd_,
        address router_
    ) {
        busd = busd_;
        router = router_;
        IERC20(busd_).approve(router_, type(uint256).max);
    }
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки
    * в случае редеплоя контрактов.
    * @dev Если редеплоится какой-то один контракт, то на место тех адресов,
    * которые не редеплоились, передаются старые значения.
    * @param cakeLP_ Адрес Cake-LP токена (контракта пары).
    * @param zoinks_ Адрес ZOINKS токена.
    * @param snacks_ Адрес SNACKS токена.
    * @param btcSnacks_ Адрес BTCSNACKS токена.
    * @param ethSnacks_ Адрес ETHSNACKS токена.
    * @param pancakeSwapPool_ Адрес контракта PancakeSwapPool.
    * @param snacksPool_ Адрес контракта SnacksPool.
    * @param seniorage_ Адрес контракта Seniorage.
    * @param authority_ Адрес EOA, имеющего доступ к вызову функций контракта.
    */
    function configure(
        address cakeLP_,
        address zoinks_,
        address snacks_,
        address btcSnacks_,
        address ethSnacks_,
        address pancakeSwapPool_,
        address snacksPool_,
        address seniorage_,
        address authority_
    )
        external
        onlyOwner
    {
        cakeLP = cakeLP_;
        zoinks = zoinks_;
        snacks = snacks_;
        btcSnacks = btcSnacks_;
        ethSnacks = ethSnacks_;
        pancakeSwapPool = pancakeSwapPool_;
        snacksPool = snacksPool_;
        seniorage = seniorage_;
        authority = authority_;
        if (IERC20(cakeLP_).allowance(address(this), pancakeSwapPool_) == 0) {
            IERC20(cakeLP_).approve(pancakeSwapPool_, type(uint256).max);
        }
        if (IERC20(zoinks_).allowance(address(this), snacks_) == 0) {
            IERC20(zoinks_).approve(snacks_, type(uint256).max);
        }
        if (IERC20(zoinks_).allowance(address(this), router) == 0) {
            IERC20(zoinks_).approve(router, type(uint256).max);
        }
        if (IERC20(snacks_).allowance(address(this), snacksPool_) == 0) {
            IERC20(snacks_).approve(snacksPool_, type(uint256).max);
        }
    }

    /**
    * @notice Функция, реализующая логику респределения на контракт Seniorage 50% от общего баланса
    * BTCSNACKS и ETHSNACKS токенов на контракте Pulse.
    * @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    */
    function distributeBtcSnacksAndEthSnacks() external onlyAuthority {
        uint256 btcSnacksBalance = IERC20(btcSnacks).balanceOf(address(this));
        uint256 ethSnacksBalance = IERC20(ethSnacks).balanceOf(address(this));
        if (btcSnacksBalance != 0) {
            IERC20(btcSnacks).safeTransfer(
                seniorage,
                btcSnacksBalance * BTC_SNACKS_SENIORAGE_PERCENT / BASE_PERCENT
            );
        }
        if (ethSnacksBalance != 0) {
            IERC20(ethSnacks).safeTransfer(
                seniorage,
                ethSnacksBalance * ETH_SNACKS_SENIORAGE_PERCENT / BASE_PERCENT
            );
        }
    }

    /**
    * @notice Функция, реализующая логику респределения 20% от общего баланса
    * SNACKS токенов на контракте Pulse.
    * @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    */
    function distributeSnacks() external onlyAuthority {
        uint256 balance = IERC20(snacks).balanceOf(address(this));
        if (balance != 0) {
            uint256 amountToDistribute = balance * SNACKS_DISTRIBUTION_PERCENT / BASE_PERCENT;
            // Redeem 10% от общего баланса SNACKS токенов
            if (ISnacksBase(snacks).sufficientBuyTokenAmountOnRedeem(amountToDistribute)) {
                ISnacksBase(snacks).redeem(amountToDistribute);
            }
            // Deposit 10% от общего баланса SNACKS токенов в SnacksPool
            IMultipleRewardPool(snacksPool).stake(amountToDistribute);
        }
    }

    /**
    * @notice Функция, реализующая логику респределения 20% от общего баланса
    * ZOINKS токенов на контракте Pulse.
    * @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    * @param busdAmountOutMin_ Минимальное ожидаемое количество BUSD
    * токенов к получению после обмена 5% от общего баланса ZOINKS токенов.
    * @param addLiquidityZoinksAmountMin_ Минимальное ожидаемое количество ZOINKS
    * токенов ко внесению ликвидности 5% от общего баланса ZOINKS токенов.
    * @param addLiquidityBusdAmountMin_ Минимальное ожидаемое количество BUSD
    * токенов ко внесению ликвидности BUSD токенов в количестве, полученном
    * после обмена 5% от общего баланса ZOINKS токенов.
    */
    function distrubuteZoinks(
        uint256 busdAmountOutMin_,
        uint256 addLiquidityZoinksAmountMin_,
        uint256 addLiquidityBusdAmountMin_
    )
        external
        onlyAuthority
    {
        uint256 balance = IERC20(zoinks).balanceOf(address(this));
        if (balance != 0) {
            uint256 amountToDistribute = balance * ZOINKS_DISTRIBUTION_PERCENT / BASE_PERCENT;
            // Покупка SNACKS токенов на 10% от общего баланса ZOINKS токенов
            if (ISnacksBase(snacks).sufficientPayTokenAmountOnMint(amountToDistribute)) {
                ISnacksBase(snacks).mintWithPayTokenAmount(amountToDistribute);
            }
            // Обмен 5% от общего баланса ZOINKS токенов на BUSD токены
            uint256 amountOfZoinksToSwapOnBusd = amountToDistribute / 2;
            address[] memory path = new address[](2);
            path[0] = zoinks;
            path[1] = busd;
            uint256[] memory amounts = IRouter(router).swapExactTokensForTokens(
                amountOfZoinksToSwapOnBusd,
                busdAmountOutMin_,
                path,
                address(this),
                block.timestamp + 15
            );
            // Добавление ликвидности в размере полученных BUSD токенов после обмена
            (, , uint256 liquidity) = IRouter(router).addLiquidity(
                zoinks,
                busd,
                amountOfZoinksToSwapOnBusd,
                amounts[1],
                addLiquidityZoinksAmountMin_,
                addLiquidityBusdAmountMin_,
                address(this),
                block.timestamp + 15
            );
            // Стейк в PancakeSwapPool полученное количество Cake-LP токенов
            IMultipleRewardPool(pancakeSwapPool).stake(liquidity);
        }
    }

    /// @notice Функция, реализующая логику снятия наград со стейкинг пулов.
    /// @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    function harvest() external onlyAuthority {
        IMultipleRewardPool(pancakeSwapPool).getReward();
        IMultipleRewardPool(snacksPool).getReward();
    }
}
