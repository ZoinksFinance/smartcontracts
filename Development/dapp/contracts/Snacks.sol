// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

import "./base/SnacksBase.sol";
import "./interfaces/IMultipleRewardPool.sol";

/// @title Контракт SNACKS токена.
contract Snacks is SnacksBase {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using Arrays for uint256[];
    using Counters for Counters.Counter;
    using PRBMathUD60x18 for uint256;
    
    struct Snapshots {
        uint256[] ids;
        uint256[] values;
    }

    uint256 constant private MULTIPLIER = 0.000001 * 1e18;
    uint256 constant private CORRELATION = 1e24;
    uint256 constant private STEP = 1e6;
    uint256 constant private BASE_PERCENT = 10000;
    uint256 constant private PULSE_FEE_PERCENT = 3500;
    uint256 constant private POOL_REWARD_DISTRIBUTOR_FEE_PERCENT = 4500;
    uint256 constant private SENIORAGE_FEE_PERCENT = 500;
    
    address public btcSnacks;
    address public ethSnacks;
    uint256 private _btcSnacksFeeAmountLast;
    uint256 private _ethSnacksFeeAmountLast;
    Counters.Counter private _currentSnapshotId;
    
    mapping(uint256 => uint256) public snapshotIdToBtcSnacksFeeAmount;
    mapping(uint256 => uint256) public snapshotIdToEthSnacksFeeAmount;
    mapping(address => uint256) private _btcSnacksStartIndexPerAccount;
    mapping(address => uint256) private _ethSnacksStartIndexPerAccount;
    mapping(address => Snapshots) private _accountBalanceSnapshots;
    uint256[] private _btcSnacksFeeSnapshots;
    uint256[] private _ethSnacksFeeSnapshots;
    Snapshots private _totalSupplySnapshots;
    
    event Snapshot(uint256 id);
    
    modifier onlyBtcSnacks {
        require(
            msg.sender == btcSnacks,
            "Snacks: caller is not the BtcSnacks contract"
        );
        _;
    }
    
    modifier onlyEthSnacks {
        require(
            msg.sender == ethSnacks,
            "Snacks: caller is not the EthSnacks contract"
        );
        _;
    }
    
    constructor(
    )
        SnacksBase(
            MULTIPLIER,
            CORRELATION,
            STEP,
            PULSE_FEE_PERCENT,
            POOL_REWARD_DISTRIBUTOR_FEE_PERCENT,
            SENIORAGE_FEE_PERCENT,
            "Snacks",
            "SNACKS"
        )
    {}
    
    /**
    * @notice Функция, реализующая логику установки адресов или их переустановки
    * в случае редеплоя контрактов.
    * @dev Если редеплоится какой-то один контракт, то на место тех адресов,
    * которые не редеплоились, передаются старые значения.
    * @param zoinks_ Адрес ZOINKS токена.
    * @param pulse_ Адрес контракта Pulse.
    * @param poolRewardDistributor_ Адрес контракта PoolRewardDistributor.
    * @param seniorage_ Адрес контракта Seniorage.
    * @param authority_ Адрес EOA, имеющего доступ к вызову функции {distributeFee}.
    * @param btcSnacks_ Адрес BTCSNACKS токена.
    * @param ethSnacks_ Адрес ETHSNACKS токена.
    * @param pancakeSwapPool_ Адрес контракта PancakeSwapPool.
    * @param lunchBox_ Адрес контракта LunchBox.
    */
    function configure(
        address zoinks_,
        address pulse_,
        address poolRewardDistributor_,
        address seniorage_,
        address authority_,
        address btcSnacks_,
        address ethSnacks_,
        address pancakeSwapPool_,
        address lunchBox_
    )
        external
        onlyOwner
    {
        _configure(
            zoinks_,
            pulse_,
            poolRewardDistributor_,
            seniorage_,
            authority_
        );
        btcSnacks = btcSnacks_;
        ethSnacks = ethSnacks_;
        _excludedHolders.add(btcSnacks_);
        _excludedHolders.add(ethSnacks_);
        _excludedHolders.add(pancakeSwapPool_);
        _excludedHolders.add(lunchBox_);
    }
    
    /**
    * @notice Функция, реализующая логику уведомления SNACKS контракта
    * о пришедшей комиссии в BTCSNACKS токенах.
    * @param feeAmount_ Размер комиссии.
    */
    function notifyBtcSnacksFeeAmount(uint256 feeAmount_) external onlyBtcSnacks {
        _btcSnacksFeeAmountLast = feeAmount_;
    }
    
    /**
    * @notice Функция, реализующая логику уведомления SNACKS контракта
    * о пришедшей комиссии в ETHSNACKS токенах.
    * @param feeAmount_ Размер комиссии.
    */
    function notifyEthSnacksFeeAmount(uint256 feeAmount_) external onlyEthSnacks {
        _ethSnacksFeeAmountLast = feeAmount_;
    }
    
    /**
    * @notice Функция, реализующая логику снятия заработанной
    * холдером комиссии в BTCSNACKS токенах.
    */
    function withdrawBtcSnacks() external nonReentrant {
        (uint256 newStartIndex, uint256 feeAmount) = getPendingBtcSnacks();
        _withdrawBtcSnacks(newStartIndex, feeAmount);
    }
    
    /**
    * @notice Функция, реализующая логику снятия заработанной холдером комиссии
    * в BTCSNACKS токенах частями. Используется в том случае, если холдер не снимал свою
    * комиссию за холдинг в течение длительного времени.
    * @param offset_ Количество пропущенных холдером снятий комиссий.
    */
    function withdrawBtcSnacks(uint256 offset_) external nonReentrant {
        (uint256 newStartIndex, uint256 feeAmount) = getPendingBtcSnacks(offset_);
        _withdrawBtcSnacks(newStartIndex, feeAmount);
    }
    
    /**
    * @notice Функция, реализующая логику снятия заработанной
    * холдером комиссии в ETHSNACKS токенах.
    */
    function withdrawEthSnacks() external nonReentrant {
        (uint256 newStartIndex, uint256 feeAmount) = getPendingEthSnacks();
        _withdrawEthSnacks(newStartIndex, feeAmount);
    }
    
    /**
    * @notice Функция, реализующая логику снятия заработанной холдером комиссии
    * в ETHSNACKS токенах частями. Используется в том случае, если холдер не снимал свою
    * комиссию за холдинг в течение длительного времени.
    * @param offset_ Количество пропущенных холдером снятий комиссий.
    */
    function withdrawEthSnacks(uint256 offset_) external nonReentrant {
        (uint256 newStartIndex, uint256 feeAmount) = getPendingEthSnacks(offset_);
        _withdrawEthSnacks(newStartIndex, feeAmount);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета заработанной пользователем
    * комиссии в BTCSNACKS токенах.
    */
    function getPendingBtcSnacks() public view returns (uint256, uint256) {
        uint256 startIndex = _btcSnacksStartIndexPerAccount[msg.sender];
        return _getPendingBtcSnacks(startIndex, _btcSnacksFeeSnapshots.length);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета заработанной пользователем комиссии
    * в BTCSNACKS токенах за `offset_` пропущенных снятий комиссий.
    * @param offset_ Количество пропущенных холдером снятий комиссий.
    */
    function getPendingBtcSnacks(
        uint256 offset_
    )
        public
        view
        returns (uint256, uint256)
    {
        require(
            offset_ <= getAvailableBtcSnacksOffsetByAccount(msg.sender),
            "Snacks: invalid offset"
        );
        uint256 startIndex = _btcSnacksStartIndexPerAccount[msg.sender];
        return _getPendingBtcSnacks(startIndex, startIndex + offset_);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета заработанной пользователем
    * комиссии в ETHSNACKS токенах.
    */
    function getPendingEthSnacks() public view returns (uint256, uint256) {
        uint256 startIndex = _ethSnacksStartIndexPerAccount[msg.sender];
        return _getPendingEthSnacks(startIndex, _ethSnacksFeeSnapshots.length);
    }
    
    /**
    * @notice Функция, реализующая логику подсчета заработанной пользователем комиссии
    * в BTCSNACKS токенах за `offset_` пропущенных снятий комиссий.
    * @param offset_ Количество пропущенных холдером снятий комиссий.
    */
    function getPendingEthSnacks(
        uint256 offset_
    )
        public
        view
        returns (uint256, uint256)
    {
        require(
            offset_ <= getAvailableEthSnacksOffsetByAccount(msg.sender),
            "Snacks: invalid offset"
        );
        uint256 startIndex = _ethSnacksStartIndexPerAccount[msg.sender];
        return _getPendingEthSnacks(startIndex, startIndex + offset_);
    }
    
    /**
    * @notice Функция, реализующая логику получения количества пропущенных
    * холдером снятий комиссии в BTCSNACKS токенах.
    * @param account_ Account address.
    */
    function getAvailableBtcSnacksOffsetByAccount(
        address account_
    )
        public
        view
        returns (uint256)
    {
        uint256 startIndex = _btcSnacksStartIndexPerAccount[account_];
        uint256 endIndex = _btcSnacksFeeSnapshots.length;
        return endIndex - startIndex;
    }
    
    /**
    * @notice Функция, реализующая логику получения количества пропущенных
    * холдером снятий комиссии в ETHSNACKS токенах.
    * @param account_ Account address.
    */
    function getAvailableEthSnacksOffsetByAccount(
        address account_
    )
        public
        view
        returns (uint256)
    {
        uint256 startIndex = _ethSnacksStartIndexPerAccount[account_];
        uint256 endIndex = _ethSnacksFeeSnapshots.length;
        return endIndex - startIndex;
    }
    
    /// @notice Retrieves the balance of `account_` at the time `snapshotId_` was created.
    /// @param account_ Account address.
    /// @param snapshotId_ Snapshot id.
    function balanceOfAt(address account_, uint256 snapshotId_) public view returns (uint256) {
        return _valueAt(snapshotId_, _accountBalanceSnapshots[account_]);
    }

    /// @notice Retrieves the total supply at the time `snapshotId_` was created.
    /// @param snapshotId_ Snapshot id.
    function totalSupplyAt(uint256 snapshotId_) public view returns (uint256) {
        return _valueAt(snapshotId_, _totalSupplySnapshots);
    }
    
    /// @notice Hook that is called after fee distribution.
    /// @param undistributedFee_ Amount of left undistributed fee.
    function _afterDistributeFee(uint256 undistributedFee_) internal override {
        super._afterDistributeFee(undistributedFee_);
        uint256 currentId = _getCurrentSnapshotId();
        if (_btcSnacksFeeAmountLast != 0) {
            _btcSnacksFeeSnapshots.push(currentId);
            snapshotIdToBtcSnacksFeeAmount[currentId] = _btcSnacksFeeAmountLast;
        }
        if (_ethSnacksFeeAmountLast != 0) {
            _ethSnacksFeeSnapshots.push(currentId);
            snapshotIdToEthSnacksFeeAmount[currentId] = _ethSnacksFeeAmountLast;
        }
    }
    
    /**
    * @notice Update balance and/or total supply snapshots before the values are modified.
    * This is implemented in the {_afterTokenTransfer} hook, which is executed for
    * _mint, _burn, and _transfer operations.
    * @param from_ From address.
    * @param to_ To address.
    */
    function _afterTokenTransfer(
        address from_,
        address to_
    )
        internal
        override
    {
        _snapshot();
        if (from_ == address(0)) {
            _updateAccountSnapshot(to_);
            _updateTotalSupplySnapshot();
        } else if (to_ == address(0)) {
            _updateAccountSnapshot(from_);
            _updateTotalSupplySnapshot();
        } else {
            _updateAccountSnapshot(from_);
            _updateAccountSnapshot(to_);
        }
    }
    
    /**
    * @notice Функция, реализующая логику отправки заработанной
    * холдером комиссии в BTCSNACKS токенах, а также переустановки
    * стартового индекса.
    * @param newStartIndex_ Новый стартовый индекс.
    * @param feeAmount_ Размер заработанной холдером комиссии.
    */
    function _withdrawBtcSnacks(
        uint256 newStartIndex_,
        uint256 feeAmount_
    )
        private
    {
        if (newStartIndex_ != _btcSnacksStartIndexPerAccount[msg.sender]) {
            _btcSnacksStartIndexPerAccount[msg.sender] = newStartIndex_;
        }
        if (feeAmount_ != 0) {
            uint256 balance = IERC20(btcSnacks).balanceOf(address(this));
            uint256 transferAmount = feeAmount_ > balance ? balance : feeAmount_;
            IERC20(btcSnacks).safeTransfer(msg.sender, transferAmount);
        }
    }
    
    /**
    * @notice Функция, реализующая логику отправки заработанной
    * холдером комиссии в ETHSNACKS токенах, а также переустановки
    * стартового индекса.
    * @param newStartIndex_ Новый стартовый индекс.
    * @param feeAmount_ Размер заработанной холдером комиссии.
    */
    function _withdrawEthSnacks(
        uint256 newStartIndex_,
        uint256 feeAmount_
    )
        private
    {
        if (newStartIndex_ != _ethSnacksStartIndexPerAccount[msg.sender]) {
            _ethSnacksStartIndexPerAccount[msg.sender] = newStartIndex_;
        }
        if (feeAmount_ != 0) {
            uint256 balance = IERC20(ethSnacks).balanceOf(address(this));
            uint256 transferAmount = feeAmount_ > balance ? balance : feeAmount_;
            IERC20(ethSnacks).safeTransfer(msg.sender, transferAmount);
        }
    }
    
    /// @notice Creates a new snapshot and returns its snapshot id.
    function _snapshot() private returns (uint256) {
        _currentSnapshotId.increment();
        uint256 currentId = _getCurrentSnapshotId();
        emit Snapshot(currentId);
        return currentId;
    }
    
    /// @notice Функция, реализующая логику обновления данных о балансе.
    /// @param account_ Account address.
    function _updateAccountSnapshot(address account_) private {
        _updateSnapshot(_accountBalanceSnapshots[account_], balanceOf(account_));
    }
    
    /// @notice Функция, реализующая логику обновления данных о total supply.
    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(_totalSupplySnapshots, _totalSupply);
    }
    
    /// @notice Функция, реализующая логику обновления данных.
    function _updateSnapshot(Snapshots storage snapshots_, uint256 currentValue_) private {
        uint256 currentId = _getCurrentSnapshotId();
        if (_lastSnapshotId(snapshots_.ids) < currentId) {
            snapshots_.ids.push(currentId);
            snapshots_.values.push(currentValue_);
        }
    }
    
    /// @notice Returns the current snapshotId.
    function _getCurrentSnapshotId() private view returns (uint256) {
        return _currentSnapshotId.current();
    }
    
    /**
    * @notice Функция, реализующая логику вывода данных о балансе пользователя или
    * total supply по `snapshotId_`
    * @param snapshotId_ Snapshot id.
    * @param snapshots_ Snapshots.
    */
    function _valueAt(uint256 snapshotId_, Snapshots storage snapshots_) private view returns (uint256) {
        require(
            snapshotId_ > 0, 
            "Snacks: id is 0"
        );
        require(
            snapshotId_ <= _getCurrentSnapshotId(), 
            "Snacks: nonexistent id"
        );
        uint256 index = snapshots_.ids.findUpperBound(snapshotId_);
        if (index == snapshots_.ids.length) {
            return 0;
        } else {
            return snapshots_.values[index];
        }
    }
    
    /**
    * @notice Функция, реализующая логику вывода данных о последнем снимке для конкретного пользователя
    * или total supply.
    * @param ids_ Snapshot ids array.
    */
    function _lastSnapshotId(uint256[] storage ids_) private view returns (uint256) {
        if (ids_.length == 0) {
            return 0;
        } else {
            return ids_[ids_.length - 1];
        }
    }
    
    /**
    * @notice Функция, реализующая логику подсчета заработанной пользователем комиссии
    * в BTCSNACKS токенах за `endIndex_` - `startIndex_` пропущенных снятий комиссий.
    * @param startIndex_ Стартовый индекс.
    * @param endIndex_ Конечный индекс.
    */
    function _getPendingBtcSnacks(
        uint256 startIndex_,
        uint256 endIndex_
    )
        private
        view
        returns (uint256, uint256)
    {
        uint256 cumulativeBalance;
        uint256 cumulativeSupply;
        uint256 cumulativeFeeAmount;
        uint256 i;
        for (i = startIndex_; i < endIndex_; i++) {
            uint256 feeSnapshotId = _btcSnacksFeeSnapshots[i];
            cumulativeBalance += balanceOfAt(msg.sender, feeSnapshotId);
            cumulativeSupply += totalSupplyAt(feeSnapshotId);
            cumulativeFeeAmount += snapshotIdToBtcSnacksFeeAmount[feeSnapshotId];
        }
        if (i == startIndex_) {
            return (startIndex_, 0);
        } else {
            return (i, cumulativeBalance.mul(cumulativeFeeAmount).div(cumulativeSupply));
        }
    }
    
    /**
    * @notice Функция, реализующая логику подсчета заработанной пользователем комиссии
    * в ETHSNACKS токенах за `endIndex_` - `startIndex_` пропущенных снятий комиссий.
    * @param startIndex_ Стартовый индекс.
    * @param endIndex_ Конечный индекс.
    */
    function _getPendingEthSnacks(
        uint256 startIndex_,
        uint256 endIndex_
    )
        private
        view
        returns (uint256, uint256)
    {
        uint256 cumulativeBalance;
        uint256 cumulativeSupply;
        uint256 cumulativeFeeAmount;
        uint256 i;
        for (i = startIndex_; i < endIndex_; i++) {
            uint256 feeSnapshotId = _ethSnacksFeeSnapshots[i];
            cumulativeBalance += balanceOfAt(msg.sender, feeSnapshotId);
            cumulativeSupply += totalSupplyAt(feeSnapshotId);
            cumulativeFeeAmount += snapshotIdToEthSnacksFeeAmount[feeSnapshotId];
        }
        if (i == startIndex_) {
            return (startIndex_, 0);
        } else {
            return (i, cumulativeBalance.mul(cumulativeFeeAmount).div(cumulativeSupply));
        }
    }
}
