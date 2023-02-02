## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ..\dapp\contracts\base\SingleRewardPool.sol | 910823b3f225c0bc1f70bdbf603a36b47ba8275e |
| ..\dapp\contracts\BiSwapPool.sol | 9cd7702c96904412d61876dc7b34691ab620766b |


### Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **SingleRewardPool** | Implementation | ReentrancyGuard, Ownable |||
| └ | <Constructor> | Public ❗️ | 🛑  |NO❗️ |
| └ | stake | External ❗️ | 🛑  | nonReentrant updateReward |
| └ | exit | External ❗️ | 🛑  |NO❗️ |
| └ | notifyRewardAmount | External ❗️ | 🛑  | onlyPoolRewardDistributor updateReward |
| └ | setPoolRewardDistributor | External ❗️ | 🛑  | onlyOwner |
| └ | setSeniorage | External ❗️ | 🛑  | onlyOwner |
| └ | setRewardsDuration | External ❗️ | 🛑  | onlyOwner |
| └ | getRewardForDuration | External ❗️ |   |NO❗️ |
| └ | withdraw | Public ❗️ | 🛑  | nonReentrant updateReward |
| └ | getReward | Public ❗️ | 🛑  | nonReentrant updateReward |
| └ | lastTimeRewardApplicable | Public ❗️ |   |NO❗️ |
| └ | rewardPerToken | Public ❗️ |   |NO❗️ |
| └ | earned | Public ❗️ |   |NO❗️ |
||||||
| **BiSwapPool** | Implementation | SingleRewardPool |||
| └ | <Constructor> | Public ❗️ | 🛑  | SingleRewardPool |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
