## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ..\dapp\contracts\base\MultipleRewardPool.sol | 898252e872c3251c3591a917273d5131ee2cdf73 |
| ..\dapp\contracts\SnacksPool.sol | 7143ed581a0d142ede2ade41ed615996872232e2 |


### Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **MultipleRewardPool** | Implementation | ReentrancyGuard, Ownable |||
| └ | <Constructor> | Public ❗️ | 🛑  |NO❗️ |
| └ | stake | External ❗️ | 🛑  | nonReentrant updateReward |
| └ | exit | External ❗️ | 🛑  |NO❗️ |
| └ | notifyRewardAmount | External ❗️ | 🛑  | onlyPoolRewardDistributor onlyValidToken updateRewardPerToken |
| └ | setPoolRewardDistributor | External ❗️ | 🛑  | onlyOwner |
| └ | setSeniorage | External ❗️ | 🛑  | onlyOwner |
| └ | setRewardsDuration | External ❗️ | 🛑  | onlyOwner |
| └ | addRewardToken | External ❗️ | 🛑  | onlyOwner |
| └ | removeRewardToken | External ❗️ | 🛑  | onlyOwner |
| └ | getRewardToken | External ❗️ |   |NO❗️ |
| └ | getRewardTokensCount | External ❗️ |   |NO❗️ |
| └ | getRewardForDuration | External ❗️ |   | onlyValidToken |
| └ | calculatePotentialReward | External ❗️ |   | onlyValidToken |
| └ | withdraw | Public ❗️ | 🛑  | nonReentrant updateReward |
| └ | getReward | Public ❗️ | 🛑  | nonReentrant updateReward |
| └ | lastTimeRewardApplicable | Public ❗️ |   | onlyValidToken |
| └ | rewardPerToken | Public ❗️ |   | onlyValidToken |
| └ | earned | Public ❗️ |   | onlyValidToken |
| └ | _updateAllRewards | Private 🔐 | 🛑  | |
| └ | _updateReward | Private 🔐 | 🛑  | |
| └ | _rewardPerTokenForDuration | Private 🔐 |   | |
||||||
| **SnacksPool** | Implementation | MultipleRewardPool |||
| └ | <Constructor> | Public ❗️ | 🛑  | MultipleRewardPool |
| └ | notifyRewardAmount | External ❗️ | 🛑  | onlyPoolRewardDistributor onlyValidToken updateRewardPerToken |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
