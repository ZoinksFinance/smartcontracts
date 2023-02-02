## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ..\dapp\contracts\base\SingleRewardPool.sol | 910823b3f225c0bc1f70bdbf603a36b47ba8275e |
| ..\dapp\contracts\ApeSwapPool.sol | 0b4121198a6c2470f9cf8aad46cf50d2f336ac64 |


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
| **ApeSwapPool** | Implementation | SingleRewardPool |||
| └ | <Constructor> | Public ❗️ | 🛑  | SingleRewardPool |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
