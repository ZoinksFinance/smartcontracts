# Autor: Anton Polenyaka

# Contracts in BSC MainNet:

# Project Zoinks

# Addresses in BSC MainNet

# Deployed from 0x0c55000eaa1F3e6c47F59678d6eB7Eb8856ACC01
Seniorage: 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301

# 1)
# Test:
# OUR CakeToken deployed: 0x150d38e9494Fd57bC561785710DA4620BaBa6196
# ZoinksFactory: 0xEFef3d0aA1eFB2B0A9B995B37CAF43F9fE950aDa
#	constructor(address _feeToSetter) //0x189dd438049ed6B009308630704c912e13acC02D
# ZoinksPair: 0x2D766F7B5a12e0C9Aa5A76a648EfF2Ae6Cf56b86
#
# ZoinksERC20: 0x2482f49ab03800AD23e816c6959F6bee68546b95
# Real:
+ BUSD: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
+ ETH (Binance-Peg Ethereum Token (ETH)): 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
+ BTC (BTCB): 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c
+ CakeToken (CAKE real): 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
+ SnacksStakingPool: 0x581D5e1DFFFf34b9794C3868845d6128B25E7450
    seniorage: 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
+ ZoinksStakingPool: 0x80efA6140335B748AfC25f70fE1388dE2Fc981b0
    seniorage: 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301

# ====================================================================

# 2)
+ CakePulse: 0x4febd137E36e63B7d20b71690A9DAEF29e1b9f55
	Dependence: pancakeRouter, cakepool, busd, cake

+ ZoinksToken: 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
	constructor(address _zoinksAdmin,  // 0x0c55000eaa1F3e6c47F59678d6eB7Eb8856ACC01
    seniorage, // 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
    BUSD) // 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
	Dependence: busd

+ MasterChef: 0xb19816218A1e1aECbC3531A84f523A934953f248
	constructor(
		CakeToken _cake // Real: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
        seniorage // 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
	) // New owner 0x0c55000eaa1F3e6c47F59678d6eB7Eb8856ACC01
	Dependence: CakeToken

+ Pulse: 0x7F2ECe652DefA85CbB5A68070b28d2ded2621866
	Dependence: btc, busd, eth

# ====================================================================

# 3)
+ BtcSnacks: 0x617518A0ff745F0dBCCc9928Fc3a3b40c48ccD73
	constructor(IERC20 btc_, // 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c
		address pulse_, // 0x7F2ECe652DefA85CbB5A68070b28d2ded2621866
		address masterChef_, // 0xb19816218A1e1aECbC3531A84f523A934953f248
		address snacksStakingPool_, // 0x581D5e1DFFFf34b9794C3868845d6128B25E7450
       address seniorageAddress_) // 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
	Dependence: BTC, Pulse, MasterChef, SnacksStakingPool, Snacks
	
+ EthSnacks: 0xa0324fe2F8B4Dc15Be29Fad259444B730DC05F22
	constructor(IERC20 eth_, // 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
		address pulse_, // 0x7F2ECe652DefA85CbB5A68070b28d2ded2621866
		address masterChef_, // 0xb19816218A1e1aECbC3531A84f523A934953f248
		address snacksStakingPool_, // 0x581D5e1DFFFf34b9794C3868845d6128B25E7450
       address seniorageAddress_) // 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
	Dependence: ETH, Pulse, MasterChef, SnacksStakingPool, Snacks

+ Snacks: 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
	constructor(IERC20 zoinks_, // 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
       address pulse_, // 0x7F2ECe652DefA85CbB5A68070b28d2ded2621866
       address masterChef_, // 0xb19816218A1e1aECbC3531A84f523A934953f248
       address zoinksStakingPool_, // 0x80efA6140335B748AfC25f70fE1388dE2Fc981b0
       address snacksStakingPool_, // 0x581D5e1DFFFf34b9794C3868845d6128B25E7450
       IERC20 btcSnacks_, // 0x617518A0ff745F0dBCCc9928Fc3a3b40c48ccD73
       IERC20 ethSnacks_, // 0xa0324fe2F8B4Dc15Be29Fad259444B730DC05F22
       address seniorageAddress_) // 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
	Dependence: ZoinksToken, Pulse, MasterChef, ZoinksStakingPool, SnacksStakingPool

# ====================================================================

# 4) Initialization
+ BtcSnacks.init(
    Snacks // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
)

+ EthSnacks.init(
    Snacks // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
)

+ MasterChef.initialize(
        BEP20 _zoinks, // 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
        BEP20 _snacks, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        BEP20 _ethSnacks, // 0xa0324fe2F8B4Dc15Be29Fad259444B730DC05F22
        BEP20 _btcSnacks // 0x617518A0ff745F0dBCCc9928Fc3a3b40c48ccD73
    )

+ SnacksStakingPool.initialize(
        IBEP20 _stakedToken, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        IBEP20 _rewardToken, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        IBEP20 _rewardEthSnacksToken, // 0xa0324fe2F8B4Dc15Be29Fad259444B730DC05F22
        IBEP20 _rewardBtcSnacksToken, // 0x617518A0ff745F0dBCCc9928Fc3a3b40c48ccD73
        address _admin // 0x0c55000eaa1F3e6c47F59678d6eB7Eb8856ACC01
    )

+ ZoinksStakingPool.initialize(
        IERC20 _stakedToken, // 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
        IERC20 _rewardToken, // 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
        IERC20 _rewardSnacksToken, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        uint256 _poolLimitPerUser, // 0
        address _admin // 0x0c55000eaa1F3e6c47F59678d6eB7Eb8856ACC01
    )

+ Pulse.initialize(
        address _master, // 0xb19816218A1e1aECbC3531A84f523A934953f248
        IZoinksRouter _router, // PancakeRouter 0x10ED43C718714eb63d5aA57B78B54704E256024E
        IERC20 _zoinks, // 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
        address _snacks, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        address _ethSnacks, // 0xa0324fe2F8B4Dc15Be29Fad259444B730DC05F22
        address _btcSnacks, // 0x617518A0ff745F0dBCCc9928Fc3a3b40c48ccD73
        address _snacksPool, // 0x581D5e1DFFFf34b9794C3868845d6128B25E7450
        IERC20 _busd // 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
    )

+ ZoinksToken.initialize(
        IZoinksRouter _router, // PancakeRouter 0x10ED43C718714eb63d5aA57B78B54704E256024E
        IERC20 _snacks, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        address _pulse // 0x7F2ECe652DefA85CbB5A68070b28d2ded2621866
    )

+ CakePulse.initialize(
        IRouter _zoinksRouter, // PancakeRouter 0x10ED43C718714eb63d5aA57B78B54704E256024E
        IERC20 _zoinks, // 0x3A324AdDEd84b040A9B04Bb6aEFEeF35e94aCA4e
        IERC20 _snacks, // 0xdB5E340244880D0802B73c8a8E6113f0Dc49497d
        address _snackspool // 0x581D5e1DFFFf34b9794C3868845d6128B25E7450
    )

+ ZoinksToken.setBuffer(
    uint256 newBufferAmount // 5
)

+ ZoinksToken.setInflationReward(
    address _account, // MasterChef (LP PSC, LP BSwap, LP ApeSwap) // 0xb19816218A1e1aECbC3531A84f523A934953f248
    uint256 _percentage // 65
)

+ ZoinksToken.setInflationReward(
    address _account, // ZoinksStakingPool // 0x80efA6140335B748AfC25f70fE1388dE2Fc981b0
    uint256 _percentage // 15
)

+ ZoinksToken.setInflationReward(
    address _account, // Seniorage // 0x3ceA7171F9C4DcD2B40C16748d05Ac9e4093f301
    uint256 _percentage // 20
)

+ Pulse.setZoinksPair(
    IERC20 _zoinksPair // ZoinksToken.pancakePair 0xBD79c6667890b9259bb6Eb0C20835beb2E3664d7
);