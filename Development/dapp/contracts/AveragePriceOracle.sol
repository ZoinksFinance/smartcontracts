// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

import "./interfaces/IPair.sol";

/// @title Контракт, реализующий логику подсчета TWAP.
contract AveragePriceOracle is Ownable {
    using PRBMathUD60x18 for uint256;

    uint256 constant public PERIOD = 12 hours;
    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private APE_SWAP_PERCENT = 1500;
    uint256 constant private BI_SWAP_PERCENT = 1500;
    uint256 constant private PANCAKE_SWAP_PERCENT = 3500;
    uint256 constant private TWAP_PERCENT = 6500;
    uint256 constant private Q112 = 1 << 112;

    address public zoinks;
    address public apeSwapPair;
    address public biSwapPair;
    address public pancakeSwapPair;
    uint256 public apeSwapAveragePriceLast = PRBMathUD60x18.fromUint(0);
    uint256 public biSwapAveragePriceLast = PRBMathUD60x18.fromUint(0);
    uint256 public pancakeSwapAveragePriceLast = PRBMathUD60x18.fromUint(0);
    uint256 public twapLast;
    uint256 private _apeSwapPriceCumulativeLast;
    uint256 private _biSwapPriceCumulativeLast;
    uint256 private _pancakeSwapPriceCumulativeLast;
    uint32 private _blockTimestampLast;
    bool private _initialized;
    
    modifier onlyZoinks {
        require(
            msg.sender == zoinks,
            "AveragePriceOracle: caller is not the Zoinks contract"
        );
        _;
    }

    /**
    * @notice Функция, реализующая логику инициализации контракта.
    * @dev Для успешного выполнения функции необходимо, чтобы была ликвидность
    * на ApeSwap, BiSwap и PancakeSwap.
    * @param zoinks_ Адрес ZOINKS токена.
    * @param apeSwapPair_ Адрес контракта Pair от ApeSwap.
    * @param biSwapPair_ Адрес контракта Pair от BiSwap.
    * @param pancakeSwapPair_ Адрес контракта Pair от PancakeSwap.
    */
    function initialize(
        address zoinks_,
        address apeSwapPair_,
        address biSwapPair_,
        address pancakeSwapPair_
    )
        external
        onlyOwner
    {
        require(
            !_initialized,
            "AveragePriceOracle: already initialized"
        );
        zoinks = zoinks_;
        apeSwapPair = apeSwapPair_;
        biSwapPair = biSwapPair_;
        pancakeSwapPair = pancakeSwapPair_;
        IPair(apeSwapPair_).sync();
        IPair(biSwapPair_).sync();
        IPair(pancakeSwapPair_).sync();
        (uint112 apeSwapReserve0, uint112 apeSwapReserve1, uint32 blockTimestamp)
            = IPair(apeSwapPair_).getReserves();
        (uint112 biSwapReserve0, uint112 biSwapReserve1, )
            = IPair(biSwapPair_).getReserves();
        (uint112 pancakeSwapReserve0, uint112 pancakeSwapReserve1, )
            = IPair(pancakeSwapPair_).getReserves();
        require(
            apeSwapReserve0 != 0 &&
            apeSwapReserve1 != 0 &&
            biSwapReserve0 != 0 &&
            biSwapReserve1 != 0 &&
            pancakeSwapReserve0 != 0 &&
            pancakeSwapReserve1 != 0,
            "AveragePriceOracle: no reserves"
        );
        _blockTimestampLast = blockTimestamp;
        _apeSwapPriceCumulativeLast = IPair(apeSwapPair_).price1CumulativeLast();
        _biSwapPriceCumulativeLast = IPair(biSwapPair_).price1CumulativeLast();
        _pancakeSwapPriceCumulativeLast = IPair(pancakeSwapPair_).price1CumulativeLast();
        _initialized = true;
    }

    /**
    * @notice Функция, реализующая логику обновления текущего TWAP.
    * @dev Для успешного выполнения функции необходимо, чтобы контракт
    * был инициализирован. Может быть вызвана только Zoinks контрактом. Вызывается
    * раз в 12 часов.
    */
    function update() external onlyZoinks {
        require(
            _initialized,
            "AveragePriceOracle: not initialized"
        );
        IPair(apeSwapPair).sync();
        IPair(biSwapPair).sync();
        IPair(pancakeSwapPair).sync();
        uint32 currentBlockTimestamp = _currentBlockTimestamp();
        uint256 apeSwapPriceCumulative = IPair(apeSwapPair).price1CumulativeLast();
        uint256 biSwapPriceCumulative = IPair(biSwapPair).price1CumulativeLast();
        uint256 pancakeSwapPriceCumulative = IPair(pancakeSwapPair).price1CumulativeLast();
        uint256 timeElapsed = currentBlockTimestamp - _blockTimestampLast;
        require(
            timeElapsed >= PERIOD,
            "AveragePriceOracle: period not elapsed"
        );
        apeSwapAveragePriceLast =
            (apeSwapPriceCumulative - _apeSwapPriceCumulativeLast).div(timeElapsed).div(Q112);
        biSwapAveragePriceLast =
            (biSwapPriceCumulative - _biSwapPriceCumulativeLast).div(timeElapsed).div(Q112);
        pancakeSwapAveragePriceLast =
            (pancakeSwapPriceCumulative - _pancakeSwapPriceCumulativeLast).div(timeElapsed).div(Q112);
        _apeSwapPriceCumulativeLast = apeSwapPriceCumulative;
        _biSwapPriceCumulativeLast = biSwapPriceCumulative;
        _pancakeSwapPriceCumulativeLast = pancakeSwapPriceCumulative;
        _blockTimestampLast = currentBlockTimestamp;
        twapLast =
            ((APE_SWAP_PERCENT.mul(apeSwapAveragePriceLast)
            + BI_SWAP_PERCENT.mul(biSwapAveragePriceLast)
            + PANCAKE_SWAP_PERCENT.mul(pancakeSwapAveragePriceLast))
            .mul(BASE_PERCENT)
            .div(TWAP_PERCENT)).toUint();
    }

    /// @notice Функция, реализующая логику получения timestamp текущего блока.
    function _currentBlockTimestamp() private view returns (uint32) {
        return uint32(block.timestamp % (1 << 32));
    }
}
