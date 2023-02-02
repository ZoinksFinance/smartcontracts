// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./interfaces/IRouter.sol";
import "./interfaces/ISnacksBase.sol";
import "./interfaces/ILunchBox.sol";

/// @title Контракт, распределяющий приходящие на него комиссии и BUSD токены.
contract Seniorage is Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private BDM_WALLET_PERCENT = 500;
    uint256 constant private CRM_WALLET_PERCENT = 500;
    uint256 constant private DEV_MANAGER_WALLET_PERCENT = 500;
    uint256 constant private MARKETING_MANAGER_WALLET_PERCENT = 500;
    uint256 constant private DEV_WALLET_PERCENT = 1000;
    uint256 constant private SITUATIONAL_FUND_WALLET_PERCENT = 1500;
    uint256 constant private MARKETING_FUND_WALLET_PERCENT = 2000;
    uint256 constant private FIRST_SWAP_ON_ZOINKS_PERCENT = 2000;
    uint256 constant private SECOND_SWAP_ON_ZOINKS_PERCENT = 1500;
    uint256 constant private SNACKS_SENIORAGE_PERCENT = 7500;
    uint256 constant private SNACKS_PULSE_PERCENT = 2500;
    uint256 constant private BTC_SNACKS_SENIORAGE_PERCENT = 6667;
    uint256 constant private BTC_SNACKS_PULSE_PERCENT = 3333;
    uint256 constant private ETH_SNACKS_SENIORAGE_PERCENT = 6667;
    uint256 constant private ETH_SNACKS_PULSE_PERCENT = 3333;
    uint256 constant private BTC_ETH_PERCENT = 750;
    uint256 constant private LUNCH_BOX_PERCENT = 3000;
    
    address public busd;
    address public cakeLP;
    address public zoinks;
    address public btc;
    address public eth;
    address public snacks;
    address public btcSnacks;
    address public ethSnacks;
    address public authority;
    address public pulse;
    address public lunchBox;
    address public router;
    address public bdmWallet;
    address public crmWallet;
    address public devManagerWallet;
    address public marketingManagerWallet;
    address public devWallet;
    address public marketingFundWallet;
    address public situationalFundWallet;
    address public seniorageWallet;
    uint256 public zoinksAmountStored;
    uint256 public btcAmountStored;
    uint256 public ethAmountStored;

    EnumerableSet.AddressSet private _nonBusdCurrencies;

    modifier onlyAuthority {
        require(
            msg.sender == authority,
            "Seniorage: caller is not authorised"
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
    * @param btc_ Адрес BTC токена.
    * @param eth_ Адрес ETH токена.
    * @param snacks_ Адрес SNACKS токена.
    * @param btcSnacks_ Адрес BTCSNACKS токена.
    * @param ethSnacks_ Адрес ETHSNACKS токена.
    */
    function configureCurrencies(
        address cakeLP_,
        address zoinks_,
        address btc_,
        address eth_,
        address snacks_,
        address btcSnacks_,
        address ethSnacks_
    )
        external
        onlyOwner
    {
        cakeLP = cakeLP_;
        zoinks = zoinks_;
        btc = btc_;
        eth = eth_;
        snacks = snacks_;
        btcSnacks = btcSnacks_;
        ethSnacks = ethSnacks_;
        for (uint256 i = 0; i < _nonBusdCurrencies.length(); i++) {
            address currency = _nonBusdCurrencies.at(i);
            _nonBusdCurrencies.remove(currency);
        }
        _nonBusdCurrencies.add(zoinks_);
        _nonBusdCurrencies.add(btc_);
        _nonBusdCurrencies.add(eth_);
        _nonBusdCurrencies.add(snacks_);
        _nonBusdCurrencies.add(btcSnacks_);
        _nonBusdCurrencies.add(ethSnacks_);
        if (IERC20(zoinks_).allowance(address(this), router) == 0) {
            IERC20(zoinks_).approve(router, type(uint256).max);
        }
        if (IERC20(zoinks_).allowance(address(this), snacks_) == 0) {
            IERC20(zoinks_).approve(snacks_, type(uint256).max);
        }
        if (IERC20(btc_).allowance(address(this), btcSnacks_) == 0) {
            IERC20(btc_).approve(btcSnacks_, type(uint256).max);
        }
        if (IERC20(eth_).allowance(address(this), ethSnacks_) == 0) {
            IERC20(eth_).approve(ethSnacks_, type(uint256).max);
        }
    }
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки.
    * @dev Если меняется какой-то один адрес, то на место тех адресов,
    * которые не менялись, передаются старые значения.
    */
    function configureWallets(
        address bdmWallet_,
        address crmWallet_,
        address devManagerWallet_,
        address marketingManagerWallet_,
        address devWallet_,
        address marketingFundWallet_,
        address situationalFundWallet_,
        address seniorageWallet_
    )
        external
        onlyOwner
    {
        bdmWallet = bdmWallet_;
        crmWallet = crmWallet_;
        devManagerWallet = devManagerWallet_;
        marketingManagerWallet = marketingManagerWallet_;
        devWallet = devWallet_;
        marketingFundWallet = marketingFundWallet_;
        situationalFundWallet = situationalFundWallet_;
        seniorageWallet = seniorageWallet_;
    }
    
    /// @notice Функция, реализующая логику установки или переустановки контракта Pulse.
    /// @param pulse_ Адрес контракта Pulse.
    function setPulse(address pulse_) external onlyOwner {
        pulse = pulse_;
    }
    
    /// @notice Функция, реализующая логику установки или переустановки контракта LunchBox.
    /// @param lunchBox_ Адрес контракта LunchBox.
    function setLunchBox(address lunchBox_) external onlyOwner {
        lunchBox = lunchBox_;
        IERC20(busd).approve(lunchBox_, type(uint256).max);
        IERC20(zoinks).approve(lunchBox_, type(uint256).max);
        IERC20(btc).approve(lunchBox_, type(uint256).max);
        IERC20(eth).approve(lunchBox_, type(uint256).max);
        IERC20(snacks).approve(lunchBox_, type(uint256).max);
        IERC20(btcSnacks).approve(lunchBox_, type(uint256).max);
        IERC20(ethSnacks).approve(lunchBox_, type(uint256).max);
    }
    
    /// @notice Функция, реализующая логику установки или переустановки authority адреса.
    /// @param authority_ Адрес EOA, имеющего доступ к вызову функций контракта.
    function setAuthority(address authority_) external onlyOwner {
        authority = authority_;
    }

    /// @notice Функция, реализующая логику распределения всех токенов на контракте, кроме BUSD.
    /// @dev Функция может быть вызвана только authority адресом.
    function distributeNonBusdCurrencies() external onlyAuthority {
        for (uint256 i = 0; i < _nonBusdCurrencies.length(); i++) {
            address currency = _nonBusdCurrencies.at(i);
            uint256 balance;
            if (currency == zoinks) {
                balance = IERC20(currency).balanceOf(address(this)) - zoinksAmountStored;
            } else if (currency == btc) {
                balance = IERC20(currency).balanceOf(address(this)) - btcAmountStored;
            } else if (currency == eth) {
                balance = IERC20(currency).balanceOf(address(this)) - ethAmountStored;
            } else {
                balance = IERC20(currency).balanceOf(address(this));
            }
            if (balance != 0) {
                IERC20(currency).safeTransfer(
                    bdmWallet,
                    balance * BDM_WALLET_PERCENT / BASE_PERCENT
                );
                IERC20(currency).safeTransfer(
                    crmWallet,
                    balance * CRM_WALLET_PERCENT / BASE_PERCENT
                );
                IERC20(currency).safeTransfer(
                    devManagerWallet,
                    balance * DEV_MANAGER_WALLET_PERCENT / BASE_PERCENT
                );
                IERC20(currency).safeTransfer(
                    marketingManagerWallet,
                    balance * MARKETING_MANAGER_WALLET_PERCENT / BASE_PERCENT
                );
                IERC20(currency).safeTransfer(
                    devWallet,
                    balance * DEV_WALLET_PERCENT / BASE_PERCENT
                );
                IERC20(currency).safeTransfer(
                    marketingFundWallet,
                    balance * MARKETING_FUND_WALLET_PERCENT / BASE_PERCENT
                );
                IERC20(currency).safeTransfer(
                    situationalFundWallet,
                    balance * SITUATIONAL_FUND_WALLET_PERCENT / BASE_PERCENT
                );
            }
        }
        _distributeNonBusdCurrenciesToLunchBox();
    }

    /*
    * @notice Функция, реализующая логику распределения BUSD токенов на контракте.
    * @dev Функция может быть вызвана только authority адресом.
    * @param btcAmountOutMin_ Минимальное ожидаемое количество BTC
    * токенов к получению после обмена 7.5% от общего баланса BUSD токенов.
    * @param ethAmountOutMin_ Минимальное ожидаемое количество ETH
    * токенов к получению после обмена 7.5% от общего баланса BUSD токенов.
    * @param firstSwapZoinksAmountOutMin_ Минимальное ожидаемое количество ZOINKS
    * токенов к получению после обмена 20% от общего баланса BUSD токенов.
    * @param secondSwapZoinksAmountOutMin_ Минимальное ожидаемое количество ZOINKS
    * токенов к получению после обмена 15% от общего баланса BUSD токенов.
    * @param addLiquidityBusdAmountMin_ Минимальное ожидаемое количество BUSD
    * токенов ко внесению ликвидности 15% от общего баланса BUSD токенов.
    * @param addLiquidityZoinksAmountMin_ Минимальное ожидаемое количество ZOINKS
    * токенов ко внесению ликвидности ZOINKS токенов в количестве, полученном
    * после обмена 15% от общего баланса BUSD токенов.
    */
    function distributeBusd(
        uint256 btcAmountOutMin_,
        uint256 ethAmountOutMin_,
        uint256 firstSwapZoinksAmountOutMin_,
        uint256 secondSwapZoinksAmountOutMin_,
        uint256 addLiquidityBusdAmountMin_,
        uint256 addLiquidityZoinksAmountMin_
    )
        external
        onlyAuthority
    {
        uint256 balance = IERC20(busd).balanceOf(address(this));
        if (balance != 0) {
            // Обмен 7.5% от общего баланса BUSD токенов на BTC токены
            uint256 amountToSwapOnBtcAndEth = balance * BTC_ETH_PERCENT / BASE_PERCENT;
            address[] memory path = new address[](2);
            path[0] = busd;
            path[1] = btc;
            uint256[] memory amounts = IRouter(router).swapExactTokensForTokens(
                amountToSwapOnBtcAndEth,
                btcAmountOutMin_,
                path,
                address(this),
                block.timestamp + 15
            );
            if (ISnacksBase(btcSnacks).sufficientPayTokenAmountOnMint(amounts[1] + btcAmountStored)) {
                uint256 btcSnacksAmount = ISnacksBase(btcSnacks).mintWithPayTokenAmount(amounts[1] + btcAmountStored);
                IERC20(btcSnacks).safeTransfer(
                    seniorageWallet,
                    btcSnacksAmount * BTC_SNACKS_SENIORAGE_PERCENT / BASE_PERCENT
                );
                IERC20(btcSnacks).safeTransfer(
                    pulse,
                    btcSnacksAmount * BTC_SNACKS_PULSE_PERCENT / BASE_PERCENT
                );
                if (btcAmountStored != 0) {
                    btcAmountStored = 0;
                }
            } else {
                btcAmountStored += amounts[1];
            }
            // Обмен 7.5% от общего баланса BUSD токенов на ETH токены
            path[1] = eth;
            amounts = IRouter(router).swapExactTokensForTokens(
                amountToSwapOnBtcAndEth,
                ethAmountOutMin_,
                path,
                address(this),
                block.timestamp + 15
            );
            if (ISnacksBase(ethSnacks).sufficientPayTokenAmountOnMint(amounts[1] + ethAmountStored)) {
                uint256 ethSnacksAmount = ISnacksBase(ethSnacks).mintWithPayTokenAmount(amounts[1] + ethAmountStored);
                IERC20(ethSnacks).safeTransfer(
                    seniorageWallet,
                    ethSnacksAmount * ETH_SNACKS_SENIORAGE_PERCENT / BASE_PERCENT
                );
                IERC20(ethSnacks).safeTransfer(
                    pulse,
                    ethSnacksAmount * ETH_SNACKS_PULSE_PERCENT / BASE_PERCENT
                );
                if (ethAmountStored != 0) {
                    ethAmountStored = 0;
                }
            } else {
                ethAmountStored += amounts[1];
            }
            // Обмен 20% от общего баланса BUSD токенов на ZOINKS токены
            uint256 amountToSwapOnZoinks = balance * FIRST_SWAP_ON_ZOINKS_PERCENT / BASE_PERCENT;
            path[1] = zoinks;
            amounts = IRouter(router).swapExactTokensForTokens(
                amountToSwapOnZoinks,
                firstSwapZoinksAmountOutMin_,
                path,
                address(this),
                block.timestamp + 15
            );
            if (ISnacksBase(snacks).sufficientPayTokenAmountOnMint(amounts[1] + zoinksAmountStored)) {
                uint256 snacksAmount = ISnacksBase(snacks).mintWithPayTokenAmount(amounts[1] + zoinksAmountStored);
                IERC20(snacks).safeTransfer(
                    seniorageWallet,
                    snacksAmount * SNACKS_SENIORAGE_PERCENT / BASE_PERCENT
                );
                IERC20(snacks).safeTransfer(
                    pulse,
                    snacksAmount * SNACKS_PULSE_PERCENT / BASE_PERCENT
                );
                if (zoinksAmountStored != 0) {
                    zoinksAmountStored = 0;
                }
            } else {
                zoinksAmountStored += amounts[1];
            }
            // Обмен 15% от общего баланса BUSD токенов на ZOINKS токены
            amountToSwapOnZoinks = balance * SECOND_SWAP_ON_ZOINKS_PERCENT / BASE_PERCENT;
            amounts = IRouter(router).swapExactTokensForTokens(
                amountToSwapOnZoinks,
                secondSwapZoinksAmountOutMin_,
                path,
                address(this),
                block.timestamp + 15
            );
            // Добавление ликвидности в размере полученных ZOINKS токенов после последнего обмена
            (, , uint256 liquidity) = IRouter(router).addLiquidity(
                busd,
                zoinks,
                amountToSwapOnZoinks,
                amounts[1],
                addLiquidityBusdAmountMin_,
                addLiquidityZoinksAmountMin_,
                address(this),
                block.timestamp + 15
            );
            // Стейк 30% от общего баланса BUSD токенов в LunchBox
            ILunchBox(lunchBox).stake(balance * LUNCH_BOX_PERCENT / BASE_PERCENT);
            // Отправка Cake-LP токенов на контракт Pulse
            IERC20(cakeLP).safeTransfer(pulse, liquidity);
        }
    }

    /**
    * @notice Функция, реализующая логику распределения оставшегося баланса
    * всех токенов на контракте, кроме BUSD, в размере 35% на контракт LunchBox.
    */
    function _distributeNonBusdCurrenciesToLunchBox() private {
        uint256 zoinksBalance = IERC20(zoinks).balanceOf(address(this)) - zoinksAmountStored;
        uint256 btcBalance = IERC20(btc).balanceOf(address(this)) - btcAmountStored;
        uint256 ethBalance = IERC20(eth).balanceOf(address(this)) - ethAmountStored;
        uint256 snacksBalance = IERC20(snacks).balanceOf(address(this));
        uint256 btcSnacksBalance = IERC20(btcSnacks).balanceOf(address(this));
        uint256 ethSnacksBalance = IERC20(ethSnacks).balanceOf(address(this));
        if (
            zoinksBalance != 0 ||
            btcBalance != 0 ||
            ethBalance != 0 ||
            snacksBalance != 0 ||
            btcSnacksBalance != 0 ||
            ethSnacksBalance != 0
        ) {
            ILunchBox(lunchBox).stake(
                zoinksBalance,
                btcBalance,
                ethBalance,
                snacksBalance,
                btcSnacksBalance,
                ethSnacksBalance
            );
        }
    }
}
