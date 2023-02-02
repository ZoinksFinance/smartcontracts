// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/IRouter.sol";
import "./interfaces/ISnacksBase.sol";
import "./interfaces/IAveragePriceOracle.sol";

/// @title Контракт ZOINKS токена.
contract Zoinks is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Dex {
        APE_SWAP,
        BI_SWAP,
        PANCAKE_SWAP
    }

    address constant public DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 constant public MAX_SUPPLY = 35000000000 ether;
    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private EMISSION_LIMIT_PERCENT = 1000;
    uint256 constant private BUY_SNACKS_PERCENT = 1500;
    uint256 constant private SENIORAGE_PERCENT = 2000;
    uint256 constant private PULSE_PERCENT = 3333;
    uint256 constant private POOL_REWARD_DISTRIBUTOR_PERCENT = 6500;
    uint256 constant private ISOLATE_PERCENT = 6667;
    uint256 constant private EMISSION_PERCENT = 10100;

    address public busd;
    address public apeSwapRouter;
    address public biSwapRouter;
    address public pancakeSwapRouter;
    address public authority;
    address public seniorage;
    address public pulse;
    address public snacks;
    address public poolRewardDistributor;
    address public averagePriceOracle;
    uint256 public buffer;
    uint256 public zoinksAmountStored;

    event Swap(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOut,
        Dex dex
    );

    modifier onlyAuthority {
        require(
            msg.sender == authority,
            "Zoinks: caller is not authorised"
        );
        _;
    }

    /// @param busd_ Адрес BUSD токена.
    /// @param apeSwapRouter_ Адрес ApeSwap роутера.
    /// @param biSwapRouter_ Адрес BiSwap роутера.
    /// @param pancakeSwapRouter_ Адрес PancakeSwap роутера.
    constructor(
        address busd_,
        address apeSwapRouter_,
        address biSwapRouter_,
        address pancakeSwapRouter_
    )
        ERC20("Zoinks", "ZOINKS")
    {
        busd = busd_;
        apeSwapRouter = apeSwapRouter_;
        biSwapRouter = biSwapRouter_;
        pancakeSwapRouter = pancakeSwapRouter_;
        IERC20(busd_).approve(apeSwapRouter_, type(uint256).max);
        IERC20(busd_).approve(biSwapRouter_, type(uint256).max);
        IERC20(busd_).approve(pancakeSwapRouter_, type(uint256).max);
    }

    /// @notice Функция, реализующая логику настройки контракта.
    /// @dev Функция может быть вызвана только владельцем контракта.
    /// @param authority_ Адрес EOA, имеющего доступ к вызову функции {applyTWAP}.
    /// @param seniorage_ Адрес контракта Seniorage.
    /// @param pulse_ Адрес контракта Pulse.
    /// @param snacks_ Адрес SNACKS токена.
    /// @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    /// @param averagePriceOracle_ Адрес контракта AveragePriceOracle.
    function configure(
        address authority_,
        address seniorage_,
        address pulse_,
        address snacks_,
        address poolRewardDistributor_,
        address averagePriceOracle_
    )
        external
        onlyOwner
    {
        authority = authority_;
        seniorage = seniorage_;
        pulse = pulse_;
        snacks = snacks_;
        poolRewardDistributor = poolRewardDistributor_;
        averagePriceOracle = averagePriceOracle_;
        if (allowance(address(this), snacks_) == 0) {
            _approve(address(this), snacks_, type(uint256).max);
        }
    }

    /// @notice Функция, реализующая логику установки или переустановки `buffer`.
    /// @param buffer_ Новое значение для `buffer`.
    function setBuffer(uint256 buffer_) external onlyOwner {
        buffer = buffer_;
    }

    /**
    * @notice Функция, реализующая логику минта ZOINKS токенов
    * в обмен на BUSD токены в соотношении 1:1.
    * @param amount_ Количество ZOINKS токенов для минта.
    */
    function mint(uint256 amount_) external nonReentrant {
        require(
            amount_ > 0,
            "Zoinks: invalid amount"
        );
        require(
            totalSupply() + amount_ <= MAX_SUPPLY,
            "Zoinks: max supply exceeded"
        );
        IERC20(busd).safeTransferFrom(msg.sender, seniorage, amount_);
        _mint(msg.sender, amount_);
    }

    /**
    * @notice Функция, реализующая логику обмена BUSD токенов на ZOINKS токены через
    * BiSwap, ApeSwap или PancakeSwap.
    * @param amountIn_ Количество BUSD токенов для обмена.
    * @param amountOutMin_ Минимальное ожидаемое количество ZOINKS токенов к получению после обмена.
    * @param deadline_ Время, после которого транзакцию считать недействительной.
    * @param dex_ Параметр, определяющий то, через какой DEX
    * провести обмен (BiSwap, ApeSwap или PancakeSwap).
    */
    function swapOnZoinks(
        uint256 amountIn_,
        uint256 amountOutMin_,
        uint256 deadline_,
        Dex dex_
    )
        external
    {
        require(
            amountIn_ > 0,
            "Zoinks: invalid amountIn"
        );
        require(
            amountOutMin_ > 0,
            "Zoinks: invalid amountOutMin"
        );
        require(
            deadline_ >= block.timestamp,
            "Zoinks: invalid deadline"
        );
        IERC20(busd).safeTransferFrom(msg.sender, address(this), amountIn_);
        address[] memory path = new address[](2);
        path[0] = busd;
        path[1] = address(this);
        if (dex_ == Dex.APE_SWAP) {
            uint256[] memory amounts = IRouter(apeSwapRouter).swapExactTokensForTokens(
                amountIn_,
                amountOutMin_,
                path,
                msg.sender,
                deadline_
            );
            emit Swap(
                msg.sender,
                amountIn_,
                amounts[1],
                dex_
            );
        } else if (dex_ == Dex.BI_SWAP) {
            uint256[] memory amounts = IRouter(biSwapRouter).swapExactTokensForTokens(
                amountIn_,
                amountOutMin_,
                path,
                msg.sender,
                deadline_
            );
            emit Swap(
                msg.sender,
                amountIn_,
                amounts[1],
                dex_
            );
        } else {
            uint256[] memory amounts = IRouter(pancakeSwapRouter).swapExactTokensForTokens(
                amountIn_,
                amountOutMin_,
                path,
                msg.sender,
                deadline_
            );
            emit Swap(
                msg.sender,
                amountIn_,
                amounts[1],
                dex_
            );
        }
    }

    /**
    * @notice Функция, реализующая логику проверки текущего TWAP. Если он больше,
    * чем 1.01, то запускается эмиссия.
    * @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    */
    function applyTWAP() external onlyAuthority {
        IAveragePriceOracle(averagePriceOracle).update();
        uint256 TWAP = IAveragePriceOracle(averagePriceOracle).twapLast();
        if (TWAP > EMISSION_PERCENT) {
            _emission(TWAP);
        }
    }

    /// @notice Функция, реализующая логику эмиссии ZOINKS токенов, а также распределения этой эмиссии.
    /// @param TWAP_ TWAP за 12 часов.
    function _emission(uint256 TWAP_) private {
        uint256 emissionPercent = Math.min(TWAP_ - BASE_PERCENT, EMISSION_LIMIT_PERCENT);
        uint256 emissionAmount = emissionPercent * totalSupply() / (BASE_PERCENT * buffer);
        require(
            totalSupply() + emissionAmount <= MAX_SUPPLY,
            "Zoinks: max supply exceeded"
        );
        _mint(poolRewardDistributor, emissionAmount * POOL_REWARD_DISTRIBUTOR_PERCENT / BASE_PERCENT);
        _mint(seniorage, emissionAmount * SENIORAGE_PERCENT / BASE_PERCENT);
        uint256 amountOfZoinksToBuySnacks = emissionAmount * BUY_SNACKS_PERCENT / BASE_PERCENT;
        _mint(address(this), amountOfZoinksToBuySnacks);
        uint256 zoinksAmount = amountOfZoinksToBuySnacks + zoinksAmountStored;
        if (ISnacksBase(snacks).sufficientPayTokenAmountOnMint(zoinksAmount)) {
            uint256 snacksAmount = ISnacksBase(snacks).mintWithPayTokenAmount(zoinksAmount);
            IERC20(snacks).safeTransfer(DEAD_ADDRESS, snacksAmount * ISOLATE_PERCENT / BASE_PERCENT);
            IERC20(snacks).safeTransfer(pulse, snacksAmount * PULSE_PERCENT / BASE_PERCENT);
            if (zoinksAmountStored != 0) {
                zoinksAmountStored = 0;
            }
        } else {
            zoinksAmountStored += amountOfZoinksToBuySnacks;
        }
    }
}
