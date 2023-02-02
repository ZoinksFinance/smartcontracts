// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

/// @title Абстрактный базовый контракт для SNACKS, BTCSNACKS и ETHSNACKS токенов.
abstract contract SnacksBase is IERC20Metadata, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    using PRBMathUD60x18 for uint256;
    
    address constant private DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 constant private ONE_SNACK = 1e18;
    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private MINT_FEE_PERCENT = 500;
    uint256 constant private REDEEM_FEE_PERCENT = 1000;
    
    address public payToken;
    address public pulse;
    address public poolRewardDistributor;
    address public seniorage;
    address public authority;
    uint256 public adjustmentFactor = PRBMathUD60x18.fromUint(1);
    uint256 internal _totalSupply;
    uint256 private _multiplier;
    uint256 private _correlation;
    uint256 private _step;
    uint256 private _pulseFeePercent;
    uint256 private _poolRewardDistributorFeePercent;
    uint256 private _seniorageFeePercent;
    string private _name;
    string private _symbol;
    
    mapping(address => uint256) internal _adjustedBalances;
    mapping(address => mapping(address => uint256)) private _allowedAmount;
    EnumerableSet.AddressSet internal _excludedHolders;
    
    event Buy(
        address indexed buyer,
        uint256 totalSupplyBefore,
        uint256 buyTokenAmount,
        uint256 buyTokenAmountToBuyer,
        uint256 fee,
        uint256 payTokenAmount
    );
    
    event Redeem(
        address indexed seller,
        uint256 totalSupplyAfter,
        uint256 buyTokenAmount,
        uint256 buyTokenAmountToRedeem,
        uint256 fee,
        uint256 payTokenAmountToSeller
    );
    
    modifier onlyAuthority {
        require(
            msg.sender == authority,
            "SnacksBase: caller is not authorised"
        );
        _;
    }
    
    modifier validRecipient(address to_) {
        require(
            to_ != address(0),
            "SnacksBase: invalid recepient"
        );
        _;
    }
    
    /**
    * @param multiplier_ Значение multiplier коэффициента.
    * @param correlation_ Значение correlation коэффициента.
    * @param step_ Шаг арифметической прогрессии.
    * @param pulseFeePercent_ Процент контракта Pulse от комиссии за 12 часов.
    * @param poolRewardDistributorFeePercent_ Процент контракта
    * PoolRewardDistributor от комиссии за 12 часов.
    * @param seniorageFeePercent_ Процент контракта Seniorage от комиссии за 12 часов.
    * @param name_ Название токена.
    * @param symbol_ Символ токена.
    */
    constructor(
        uint256 multiplier_,
        uint256 correlation_,
        uint256 step_,
        uint256 pulseFeePercent_,
        uint256 poolRewardDistributorFeePercent_,
        uint256 seniorageFeePercent_,
        string memory name_,
        string memory symbol_
    ) {
        _multiplier = multiplier_;
        _correlation = correlation_;
        _step = step_;
        _pulseFeePercent = pulseFeePercent_;
        _poolRewardDistributorFeePercent = poolRewardDistributorFeePercent_;
        _seniorageFeePercent = seniorageFeePercent_;
        _name = name_;
        _symbol = symbol_;
    }
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки
    * в случае редеплоя контрактов.
    * @dev Используется производными контрактами.
    * @param payToken_ Адрес ZOINKS, BTC или ETH токенов.
    * @param pulse_ Адрес контракта Pulse.
    * @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    * @param seniorage_ Адрес контракта Seniorage.
    * @param authority_ Адрес EOA, имеющего доступ к вызову функции {distributeFee}.
    */
    function _configure(
        address payToken_,
        address pulse_,
        address poolRewardDistributor_,
        address seniorage_,
        address authority_
    )
        internal
        onlyOwner
    {
        payToken = payToken_;
        pulse = pulse_;
        poolRewardDistributor = poolRewardDistributor_;
        seniorage = seniorage_;
        authority = authority_;
        for (uint256 i = 0; i < _excludedHolders.length(); i++) {
            address excludedHolder = _excludedHolders.at(i);
            _excludedHolders.remove(excludedHolder);
        }
        _excludedHolders.add(payToken_);
        _excludedHolders.add(pulse_);
        _excludedHolders.add(poolRewardDistributor_);
        _excludedHolders.add(seniorage_);
        _excludedHolders.add(address(this));
        _excludedHolders.add(address(0));
        _excludedHolders.add(DEAD_ADDRESS);
    }
    
    /**
    * @notice Функция, реализующая логику распределения накопленной комиссии за 12 часов
    * на контракты Pulse, PoolRewardDistributor, Seniorage, всем неисключенным холдерам и, если это
    * BTCSNACKS или ETHSNACKS токены, то идет дополнительное распределение на контракт SNACKS токенов.
    * @dev Функция может быть вызвана только authority адресом. Вызывается раз в 12 часов.
    */
    function distributeFee() external onlyAuthority {
        uint256 undistributedFee = balanceOf(address(this));
        _beforeDistributeFee(undistributedFee);
        if (undistributedFee != 0) {
            _transfer(
                address(this),
                pulse,
                undistributedFee * _pulseFeePercent / BASE_PERCENT
            );
            _transfer(
                address(this),
                poolRewardDistributor,
                undistributedFee * _poolRewardDistributorFeePercent / BASE_PERCENT
            );
            _transfer(
                address(this),
                seniorage,
                undistributedFee * _seniorageFeePercent / BASE_PERCENT
            );
        }
        _afterDistributeFee(balanceOf(address(this)));
    }
    
    /**
    * @notice Функция, реализующая логику покупки SNACKS/BTCSNACKS/ETHSNACKS токенов
    * с указанием того, сколько SNACKS/BTCSNACKS/ETHSNACKS токенов необходимо к получению.
    * @param buyTokenAmount_ Количество SNACKS/BTCSNACKS/ETHSNACKS токенов, которое
    * покупатель желает приобрести в обмен на ZOINKS/BTC/ETH токены.
    */
    function mintWithBuyTokenAmount(
        uint256 buyTokenAmount_
    ) 
        external 
        nonReentrant
        returns (uint256) 
    {
        uint256 payTokenAmount = calculatePayTokenAmountOnMint(buyTokenAmount_);
        IERC20(payToken).safeTransferFrom(msg.sender, address(this), payTokenAmount);
        uint256 fee = buyTokenAmount_ * MINT_FEE_PERCENT / BASE_PERCENT;
        _mint(address(this), fee);
        _mint(msg.sender, buyTokenAmount_ - fee);
        emit Buy(
            msg.sender,
            _totalSupply - buyTokenAmount_,
            buyTokenAmount_,
            buyTokenAmount_ - fee,
            fee,
            payTokenAmount
        );
        return buyTokenAmount_ - fee;
    }
    
    /**
    * @notice Функция, реализующая логику покупки SNACKS/BTCSNACKS/ETHSNACKS токенов
    * с указанием того, сколько ZOINKS/BTC/ETH токенов покупатель хочет потратить.
    * @param payTokenAmount_ Количество ZOINKS/BTC/ETH токенов, которое покупатель
    * желает потратить в обмен на SNACKS/BTCSNACKS/ETHSNACKS токены. Не может быть
    * меньше текущей суммы покупки одного SNACKS/BTCSNACKS/ETHSNACKS токена.
    */
    function mintWithPayTokenAmount(
        uint256 payTokenAmount_
    ) 
        external 
        nonReentrant
        returns (uint256) 
    {
        uint256 buyTokenAmount = calculateBuyTokenAmountOnMint(payTokenAmount_);
        IERC20(payToken).safeTransferFrom(msg.sender, address(this), payTokenAmount_);
        uint256 fee = buyTokenAmount * MINT_FEE_PERCENT / BASE_PERCENT;
        _mint(address(this), fee);
        _mint(address(msg.sender), buyTokenAmount - fee);
        emit Buy(
            msg.sender,
            _totalSupply - buyTokenAmount,
            buyTokenAmount,
            buyTokenAmount - fee,
            fee,
            payTokenAmount_
        );
        return buyTokenAmount - fee;
    }
    
    /**
    * @notice Функция, реализующая логику сжигания SNACKS/BTCSNACKS/ETHSNACKS токенов в обмен
    * на ZOINKS/BTC/ETH токены с указанием того, сколько SNACKS/BTCSNACKS/ETHSNACKS
    * токенов необходимо сжечь.
    * @param buyTokenAmount_ Количество SNACKS/BTCSNACKS/ETHSNACKS токенов, которое холдер
    * хочет сжечь в обмен на ZOINKS/BTC/ETH токены.
    */
    function redeem(
        uint256 buyTokenAmount_
    ) 
        external 
        nonReentrant
        returns (uint256) 
    {
        uint256 fee = buyTokenAmount_ * REDEEM_FEE_PERCENT / BASE_PERCENT;
        _transfer(msg.sender, address(this), fee);
        uint256 payTokenAmount = calculatePayTokenAmountOnRedeem(buyTokenAmount_ - fee);
        IERC20(payToken).safeTransfer(msg.sender, payTokenAmount);
        _burn(msg.sender, buyTokenAmount_ - fee);
        emit Redeem(
            msg.sender,
            _totalSupply,
            buyTokenAmount_,
            buyTokenAmount_ - fee,
            fee,
            payTokenAmount
        );
        return payTokenAmount;
    }
    
    /// @notice Sets `amount_` as the allowance of `spender_` over the caller's tokens.
    /// @param spender_ Spender address.
    /// @param amount_ Amount to approve.
    function approve(address spender_, uint256 amount_) external override returns (bool) {
        _allowedAmount[msg.sender][spender_] = amount_;
        emit Approval(msg.sender, spender_, amount_);
        return true;
    }
    
    /// @notice Atomically increases the allowance granted to `spender_` by the caller.
    /// @param spender_ Spender address.
    /// @param amount_ Amount to increase.
    function increaseAllowance(
        address spender_,
        uint256 amount_
    )
        external
        returns (bool)
    {
        _allowedAmount[msg.sender][spender_] += amount_;
        emit Approval(msg.sender, spender_, _allowedAmount[msg.sender][spender_]);
        return true;
    }
    
    /// @notice Atomically decreases the allowance granted to `spender_` by the caller.
    /// @param spender_ Spender address.
    /// @param amount_ Amount to decrease.
    function decreaseAllowance(
        address spender_,
        uint256 amount_
    )
        external
        returns (bool)
    {
        uint256 oldAmount = _allowedAmount[msg.sender][spender_];
        if (amount_ >= oldAmount) {
            _allowedAmount[msg.sender][spender_] = 0;
        } else {
            _allowedAmount[msg.sender][spender_] = oldAmount - amount_;
        }
        emit Approval(msg.sender, spender_, _allowedAmount[msg.sender][spender_]);
        return true;
    }
    
    /// @notice Moves `amount_` tokens from the caller's account to `to_`.
    /// @param to_ To address.
    /// @param amount_ Amount to transfer.
    function transfer(
        address to_,
        uint256 amount_
    )
        external
        override
        validRecipient(to_)
        returns (bool)
    {
        _transfer(msg.sender, to_, amount_);
        return true;
    }
    
    /**
    * @notice Moves `amount_` tokens from `from_` to `to_` using the
    * allowance mechanism. `amount_` is then deducted from the caller's
    * allowance.
    * @param from_ From address.
    * @param to_ To address.
    * @param amount_ Amount to transfer.
    */
    function transferFrom(
        address from_,
        address to_,
        uint256 amount_
    )
        external
        override
        validRecipient(to_)
        returns (bool)
    {
        _allowedAmount[from_][msg.sender] -= amount_;
        _transfer(from_, to_, amount_);
        return true;
    }

    /**
    * @notice Функция, реализующая логику определения корректности
    * значения `buyTokenAmount_` при покупке.
    */
    function sufficientBuyTokenAmountOnMint(
        uint256 buyTokenAmount_
    )
        external
        view
        returns (bool)
    {
        uint256 next = _totalSupply + ONE_SNACK;
        uint256 last = _totalSupply + buyTokenAmount_;
        return (next + last) * buyTokenAmount_ >= 2 * _correlation;
    }
    
    /**
    * @notice Функция, реализующая логику подсчета того, хватает ли `payTokenAmount_`
    * ZOINKS/BTC/ETH токенов для покупки одного SNACKS токена.
    */
    function sufficientPayTokenAmountOnMint(
        uint256 payTokenAmount_
    )
        external
        view
        returns (bool)
    {
        return payTokenAmount_ >= _multiplier + _totalSupply / _step;
    }

    /**
    * @notice Функция, реализующая логику определения корректности
    * значения `buyTokenAmount_` при сжигании.
    */
    function sufficientBuyTokenAmountOnRedeem(
        uint256 buyTokenAmount_
    )
        external
        view
        returns (bool)
    {
        uint256 fee = buyTokenAmount_ * REDEEM_FEE_PERCENT / BASE_PERCENT;
        buyTokenAmount_ -= fee;
        uint256 end = _totalSupply - buyTokenAmount_ + ONE_SNACK;
        return (_totalSupply + end) * buyTokenAmount_ >= 2 * _correlation;
    }
    
    /// @notice Returns the amount of tokens in existence.
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    /**
    * @notice Returns the remaining number of tokens that `spender_` will be
    * allowed to spend on behalf of `owner_` through `transferFrom`. This is
    * zero by default.
    * @param owner_ Owner address.
    * @param spender_ Spender address.
    */
    function allowance(address owner_, address spender_) external view override returns (uint256) {
        return _allowedAmount[owner_][spender_];
    }
    
    /// @notice Returns the name of the token.
    function name() external view override returns (string memory) {
        return _name;
    }
    
    /// @notice Returns the symbol of the token, usually a shorter version of the name.
    function symbol() external view override returns (string memory) {
        return _symbol;
    }
    
    /// @notice Returns the number of decimals used to get its user representation.
    function decimals() external pure override returns (uint8) {
        return 18;
    }
    
    /// @notice Returns the amount of tokens owned by account.
    /// @param account_ Account address.
    function balanceOf(address account_) public view override returns (uint256) {
        if (_excludedHolders.contains(account_)) {
            return _adjustedBalances[account_];
        } else {
            return _adjustedBalances[account_].mul(adjustmentFactor);
        }
    }
    
    /// @notice Returns the amount of tokens owned by all excluded addresses.
    function getExcludedBalance() public view returns (uint256) {
        uint256 excludedBalance;
        for (uint256 i = 0; i < _excludedHolders.length(); i++) {
            excludedBalance += balanceOf(_excludedHolders.at(i));
        }
        return excludedBalance;
    }
    
    /**
    * @notice Функция, реализующая логику подсчета того, сколько ZOINKS/BTC/ETH
    * токенов потратит пользователь в обмен на `buyTokenAmount_` SNACKS/BTCSNACKS/ETHSNACKS токенов.
    * @dev При подсчете используется свойство арифметической прогрессии
    * (https://en.wikipedia.org/wiki/arithmetic_progression).
    * @param buyTokenAmount_ Количество SNACKS/BTCSNACKS/ETHSNACKS токенов, которое
    * покупатель желает приобрести в обмен на ZOINKS/BTC/ETH токены.
    */
    function calculatePayTokenAmountOnMint(
        uint256 buyTokenAmount_
    )
        public
        view
        returns (uint256)
    {
        uint256 next = _totalSupply + ONE_SNACK;
        uint256 last = _totalSupply + buyTokenAmount_;
        uint256 numerator = (next + last) * buyTokenAmount_;
        require(
            numerator >= 2 * _correlation,
            "SnacksBase: invalid buy token amount"
        );
        return numerator / (2 * _correlation);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета того, сколько SNACKS/BTCSNACKS/ETHSNACKS
    * токенов получит пользователь в обмен на `payTokenAmount_` ZOINKS/BTC/ETH токенов.
    * @dev При подсчете используется вывод из формулы арифметической прогрессии
    * (https://en.wikipedia.org/wiki/arithmetic_progression).
    * @param payTokenAmount_ Количество ZOINKS/BTC/ETH токенов, которое покупатель
    * желает потратить в обмен на SNACKS/BTCSNACKS/ETHSNACKS токены. Не может быть
    * меньше текущей суммы покупки одного SNACKS/BTCSNACKS/ETHSNACKS токена.
    */
    function calculateBuyTokenAmountOnMint(
        uint256 payTokenAmount_
    )
        public
        view
        returns (uint256)
    {
        uint256 first = _multiplier + _totalSupply / _step;
        require(
            payTokenAmount_ >= first,
            "SnacksBase: invalid pay token amount"
        );
        uint256 a = _multiplier;
        uint256 b = 2 * first - a;
        uint256 c = 2 * payTokenAmount_;
        uint256 discriminant = (b**2) + 4 * a * c;
        uint256 squareRoot = Math.sqrt(discriminant);
        return (squareRoot - b).div(2 * a);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета того, сколько ZOINKS/BTC/ETH
    * токенов получит пользователь при сжигании `buyTokenAmount_` SNACKS/BTCSNACKS/ETHSNACKS токенов.
    * @dev При подсчете используется одно из свойств арифметической прогрессии
    * (https://en.wikipedia.org/wiki/arithmetic_progression).
    * @param buyTokenAmount_ Количество SNACKS/BTCSNACKS/ETHSNACKS токенов, которое холдер
    * хочет сжечь в обмен на ZOINKS/BTC/ETH токены.
    */
    function calculatePayTokenAmountOnRedeem(
        uint256 buyTokenAmount_
    )
        public
        view
        returns (uint256)
    {
        uint256 end = _totalSupply - buyTokenAmount_ + ONE_SNACK;
        uint256 numerator = (_totalSupply + end) * buyTokenAmount_;
        require(
            numerator >= 2 * _correlation,
            "SnacksBase: invalid buy token amount"
        );
        return numerator / (2 * _correlation);
    }
    
    /// @notice Hook that is called before fee distribution.
    /// @param undistributedFee_ Amount of undistributed fee.
    function _beforeDistributeFee(
        uint256 undistributedFee_
    )
        internal
        virtual
    {}
    
    /// @notice Hook that is called after fee distribution.
    /// @param undistributedFee_ Amount of left undistributed fee.
    function _afterDistributeFee(uint256 undistributedFee_) internal virtual {
        uint256 excludedBalance = getExcludedBalance();
        uint256 holdersBalance = _totalSupply - excludedBalance;
        if (undistributedFee_ != 0) {
            uint256 seniorageFeeAmount = undistributedFee_ / 10;
            _transfer(address(this), seniorage, seniorageFeeAmount);
            if (holdersBalance != 0) {
                undistributedFee_ -= seniorageFeeAmount;
                adjustmentFactor =
                    adjustmentFactor
                    .mul((holdersBalance + undistributedFee_)
                    .div(holdersBalance));
                _adjustedBalances[address(this)] = 0;
            }
        }
    }
    
    /**
    * @notice Hook that is called after any transfer of tokens. This includes
    * minting and burning.
    * @param from_ From address.
    * @param to_ To address.
    */
    function _afterTokenTransfer(
        address from_,
        address to_
    )
        internal
        virtual
    {}
    
    /// @notice Moves `amount_` of tokens from `from_` to `to_`.
    /// @param from_ From address.
    /// @param to_ To address.
    /// @param amount_ Amount to transfer.
    function _transfer(
        address from_,
        address to_,
        uint256 amount_
    )
        private
    {
        uint256 adjustedAmount = amount_.div(adjustmentFactor);
        if (!_excludedHolders.contains(from_) && _excludedHolders.contains(to_)) {
            _adjustedBalances[from_] -= adjustedAmount;
            _adjustedBalances[to_] += amount_;
        } else if (_excludedHolders.contains(from_) && !_excludedHolders.contains(to_)) {
            _adjustedBalances[from_] -= amount_;
            _adjustedBalances[to_] += adjustedAmount;
        } else if (!_excludedHolders.contains(from_) && !_excludedHolders.contains(to_)) {
            _adjustedBalances[from_] -= adjustedAmount;
            _adjustedBalances[to_] += adjustedAmount;
        } else {
            _adjustedBalances[from_] -= amount_;
            _adjustedBalances[to_] += amount_;
        }
        emit Transfer(from_, to_, amount_);
        _afterTokenTransfer(from_, to_);
    }
    
    /**
    * @notice Creates `amount_` tokens and assigns them to `account_`, increasing
    * the total supply.
    * @param account_ Account address.
    * @param amount_ Amount of tokens to mint.
    */
    function _mint(address account_, uint256 amount_) private {
        _totalSupply += amount_;
        uint256 adjustedAmount = amount_.div(adjustmentFactor);
        if (_excludedHolders.contains(account_)) {
            _adjustedBalances[account_] += amount_;
        } else {
            _adjustedBalances[account_] += adjustedAmount;
        }
        emit Transfer(address(0), account_, amount_);
        _afterTokenTransfer(address(0), account_);
    }
    
    /**
    * @notice Destroys `amount_` tokens from `account_`, reducing the
    * total supply.
    * @param account_ Account address.
    * @param amount_ Amount of tokens to mint.
    */
    function _burn(address account_, uint256 amount_) private {
        _totalSupply -= amount_;
        uint256 adjustedAmount = amount_.div(adjustmentFactor);
        if (_excludedHolders.contains(account_)) {
            _adjustedBalances[account_] -= amount_;
        } else {
            _adjustedBalances[account_] -= adjustedAmount;
        }
        emit Transfer(account_, address(0), amount_);
        _afterTokenTransfer(account_, address(0));
    }
}
