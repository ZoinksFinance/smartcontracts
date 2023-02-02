// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IMultipleRewardPool.sol";
import "./interfaces/ISingleRewardPool.sol";

/**
* @title Контракт, распределяющий награду на стейкинг пулы раз в 12 часов и уведомляющий их.
* @notice На этот контракт приходят часть от всех комиссий со SNACKS, BTCSNACKS и ETHSNACKS токенов,
* а также часть от инфляционной эмиссии ZOINKS токенов и BUSD токены.
*/
contract PoolRewardDistributor is Ownable {
    using SafeERC20 for IERC20;
    
    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private SENIORAGE_FEE_PERCENT = 1000;
    uint256 constant private ZOINKS_APE_SWAP_POOL_PERCENT = 2308;
    uint256 constant private ZOINKS_BI_SWAP_POOL_PERCENT = 2308;
    uint256 constant private ZOINKS_PANCAKE_SWAP_POOL_PERCENT = 5384;
    uint256 constant private SNACKS_PANCAKE_SWAP_POOL_PERCENT = 6667;
    uint256 constant private SNACKS_SNACKS_POOL_PERCENT = 3333;
    uint256 constant private BTC_SNACKS_PANCAKE_SWAP_POOL_PERCENT = 5714;
    uint256 constant private BTC_SNACKS_SNACKS_POOL_PERCENT = 4286;
    uint256 constant private ETH_SNACKS_PANCAKE_SWAP_POOL_PERCENT = 5714;
    uint256 constant private ETH_SNACKS_SNACKS_POOL_PERCENT = 4286;
    
    address public busd;
    address public zoinks;
    address public snacks;
    address public btcSnacks;
    address public ethSnacks;
    address public apeSwapPool;
    address public biSwapPool;
    address public pancakeSwapPool;
    address public snacksPool;
    address public lunchBox;
    address public seniorage;
    address public authority;
    
    modifier onlyAuthority {
        require(
            msg.sender == authority,
            "PoolRewardDistributor: caller is not authorised"
        );
        _;
    }
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки в случае редеплоя контрактов.
    * @dev Если редеплоится какой-то один контракт, то на место тех адресов,
    * которые не редеплоились, передаются старые значения.
    * @param busd_ Адрес BUSD токена.
    * @param zoinks_ Адрес ZOINKS токена.
    * @param snacks_ Адрес SNACKS токена.
    * @param btcSnacks_ Адрес BTCSNACKS токена.
    * @param ethSnacks_ Адрес ETHSNACKS токена.
    * @param apeSwapPool_ Адрес контракта ApeSwapPool.
    * @param biSwapPool_ Адрес контракта BiSwapPool.
    * @param pancakeSwapPool_ Адрес контракта PancakeSwapPool.
    * @param snacksPool_ Адрес контракта SnacksPool.
    * @param lunchBox_ Адрес контракта LunchBox.
    * @param seniorage_ Адрес контракта Seniorage.
    * @param authority_ Адрес EOA, имеющего доступ к вызову функции {distributeRewards}.
    */
    function configure(
        address busd_,
        address zoinks_,
        address snacks_,
        address btcSnacks_,
        address ethSnacks_,
        address apeSwapPool_,
        address biSwapPool_,
        address pancakeSwapPool_,
        address snacksPool_,
        address lunchBox_,
        address seniorage_,
        address authority_
    )
        external
        onlyOwner
    {
        busd = busd_;
        zoinks = zoinks_;
        snacks = snacks_;
        btcSnacks = btcSnacks_;
        ethSnacks = ethSnacks_;
        apeSwapPool = apeSwapPool_;
        biSwapPool = biSwapPool_;
        pancakeSwapPool = pancakeSwapPool_;
        snacksPool = snacksPool_;
        lunchBox = lunchBox_;
        seniorage = seniorage_;
        authority = authority_;
    }
    
    /**
    * @notice Функция, реализующая логику респределения наград на стейкинг пулы
    * и уведомляющая их.
    * @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    */
    function distributeRewards() external onlyAuthority {
        uint256 reward;
        uint256 seniorageFeeAmount;
        uint256 distributionAmount;
        uint256 zoinksBalance = IERC20(zoinks).balanceOf(address(this));
        if (zoinksBalance != 0) {
            seniorageFeeAmount = zoinksBalance * SENIORAGE_FEE_PERCENT / BASE_PERCENT;
            IERC20(zoinks).safeTransfer(seniorage, seniorageFeeAmount);
            distributionAmount = zoinksBalance - seniorageFeeAmount;
            reward = distributionAmount * ZOINKS_APE_SWAP_POOL_PERCENT / BASE_PERCENT;
            IERC20(zoinks).safeTransfer(apeSwapPool, reward);
            ISingleRewardPool(apeSwapPool).notifyRewardAmount(reward);
            reward = distributionAmount * ZOINKS_BI_SWAP_POOL_PERCENT / BASE_PERCENT;
            IERC20(zoinks).safeTransfer(biSwapPool, reward);
            ISingleRewardPool(biSwapPool).notifyRewardAmount(reward);
            reward = distributionAmount * ZOINKS_PANCAKE_SWAP_POOL_PERCENT / BASE_PERCENT;
            IERC20(zoinks).safeTransfer(pancakeSwapPool, reward);
            IMultipleRewardPool(pancakeSwapPool).notifyRewardAmount(zoinks, reward);
        }
        uint256 snacksBalance = IERC20(snacks).balanceOf(address(this));
        if (snacksBalance != 0) {
            seniorageFeeAmount = snacksBalance * SENIORAGE_FEE_PERCENT / BASE_PERCENT;
            IERC20(snacks).safeTransfer(seniorage, seniorageFeeAmount);
            distributionAmount = snacksBalance - seniorageFeeAmount;
            reward = distributionAmount * SNACKS_PANCAKE_SWAP_POOL_PERCENT / BASE_PERCENT;
            IERC20(snacks).safeTransfer(pancakeSwapPool, reward);
            IMultipleRewardPool(pancakeSwapPool).notifyRewardAmount(snacks, reward);
            reward = distributionAmount * SNACKS_SNACKS_POOL_PERCENT / BASE_PERCENT;
            IERC20(snacks).safeTransfer(snacksPool, reward);
            IMultipleRewardPool(snacksPool).notifyRewardAmount(snacks, reward);
        }
        uint256 btcSnacksBalance = IERC20(btcSnacks).balanceOf(address(this));
        if (btcSnacksBalance != 0) {
            seniorageFeeAmount = btcSnacksBalance * SENIORAGE_FEE_PERCENT / BASE_PERCENT;
            IERC20(btcSnacks).safeTransfer(seniorage, seniorageFeeAmount);
            distributionAmount = btcSnacksBalance - seniorageFeeAmount;
            reward = distributionAmount * BTC_SNACKS_PANCAKE_SWAP_POOL_PERCENT / BASE_PERCENT;
            IERC20(btcSnacks).safeTransfer(pancakeSwapPool, reward);
            IMultipleRewardPool(pancakeSwapPool).notifyRewardAmount(btcSnacks, reward);
            reward = distributionAmount * BTC_SNACKS_SNACKS_POOL_PERCENT / BASE_PERCENT;
            IERC20(btcSnacks).safeTransfer(snacksPool, reward);
            IMultipleRewardPool(snacksPool).notifyRewardAmount(btcSnacks, reward);
        }
        uint256 ethSnacksBalance = IERC20(ethSnacks).balanceOf(address(this));
        if (ethSnacksBalance != 0) {
            seniorageFeeAmount = ethSnacksBalance * SENIORAGE_FEE_PERCENT / BASE_PERCENT;
            IERC20(ethSnacks).safeTransfer(seniorage, seniorageFeeAmount);
            distributionAmount = ethSnacksBalance - seniorageFeeAmount;
            reward = distributionAmount * ETH_SNACKS_PANCAKE_SWAP_POOL_PERCENT / BASE_PERCENT;
            IERC20(ethSnacks).safeTransfer(pancakeSwapPool, reward);
            IMultipleRewardPool(pancakeSwapPool).notifyRewardAmount(ethSnacks, reward);
            reward = distributionAmount * ETH_SNACKS_SNACKS_POOL_PERCENT / BASE_PERCENT;
            IERC20(ethSnacks).safeTransfer(snacksPool, reward);
            IMultipleRewardPool(snacksPool).notifyRewardAmount(ethSnacks, reward);
        }
        uint256 busdBalance = IERC20(busd).balanceOf(address(this));
        if (busdBalance != 0) {
            seniorageFeeAmount = busdBalance * SENIORAGE_FEE_PERCENT / BASE_PERCENT;
            IERC20(busd).safeTransfer(seniorage, seniorageFeeAmount);
            distributionAmount = busdBalance - seniorageFeeAmount;
            IERC20(busd).safeTransfer(lunchBox, distributionAmount);
            ISingleRewardPool(lunchBox).notifyRewardAmount(distributionAmount);
        }
    }
}
