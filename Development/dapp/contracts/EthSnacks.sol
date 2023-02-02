// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

import "./base/SnacksBase.sol";
import "./interfaces/ISnacks.sol";

/// @title Контракт ETHSNACKS токена.
contract EthSnacks is SnacksBase {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    using PRBMathUD60x18 for uint256;
    
    uint256 constant private MULTIPLIER = 0.00000001 * 1e18;
    uint256 constant private CORRELATION = 1e26;
    uint256 constant private STEP = 1e8;
    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private PULSE_FEE_PERCENT = 1500;
    uint256 constant private POOL_REWARD_DISTRIBUTOR_FEE_PERCENT = 3500;
    uint256 constant private SENIORAGE_FEE_PERCENT = 1500;
    uint256 constant private SNACKS_FEE_PERCENT = 1500;

    address public snacks;

    constructor(
    )
        SnacksBase(
            MULTIPLIER,
            CORRELATION,
            STEP,
            PULSE_FEE_PERCENT,
            POOL_REWARD_DISTRIBUTOR_FEE_PERCENT,
            SENIORAGE_FEE_PERCENT,
            "EthSnacks",
            "ETHSNACKS"
        )
    {}
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки
    * в случае редеплоя контрактов.
    * @dev Если редеплоится какой-то один контракт, то на место тех адресов,
    * которые не редеплоились, передаются старые значения.
    * @param eth_ Адрес ETH токена.
    * @param pulse_ Адрес контракта Pulse.
    * @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    * @param seniorage_ Адрес контракта Seniorage.
    * @param authority_ Адрес EOA, имеющего доступ к вызову функции {distributeFee}.
    * @param snacks_ Адрес SNACKS токена.
    * @param pancakeSwapPool_ Адрес контракта PancakeSwapPool.
    * @param lunchBox_ Адрес контракта LunchBox.
    */
    function configure(
        address eth_,
        address pulse_,
        address poolRewardDistributor_,
        address seniorage_,
        address authority_,
        address snacks_,
        address pancakeSwapPool_,
        address lunchBox_
    )
        external
        onlyOwner
    {
        _configure(
            eth_,
            pulse_,
            poolRewardDistributor_,
            seniorage_,
            authority_
        );
        snacks = snacks_;
        _excludedHolders.add(snacks_);
        _excludedHolders.add(pancakeSwapPool_);
        _excludedHolders.add(lunchBox_);
    }
    
    /// @notice Hook that is called before fee distribution.
    /// @param undistributedFee_ Amount of undistributed fee.
    function _beforeDistributeFee(
        uint256 undistributedFee_
    )
        internal
        override
    {
        uint256 feeAmount = undistributedFee_ * SNACKS_FEE_PERCENT / BASE_PERCENT;
        if (feeAmount != 0) {
            IERC20(address(this)).safeTransfer(snacks, feeAmount);
        }
        ISnacks(snacks).notifyEthSnacksFeeAmount(feeAmount);
    }
}
