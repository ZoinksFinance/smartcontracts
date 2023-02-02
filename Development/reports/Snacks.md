## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ..\dapp\contracts\base\SnacksBase.sol | fee28a2f94d58aaedf29d7aa9a8be314c3240cbb |
| ..\dapp\contracts\Snacks.sol | e87b5b9c4121298d3607b915338863715392eb51 |


### Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **SnacksBase** | Implementation | ERC20, Ownable |||
| └ | <Constructor> | Public ❗️ | 🛑  | ERC20 |
| └ | holderList | Public ❗️ |   |NO❗️ |
| └ | numberOfHolders | External ❗️ |   |NO❗️ |
| └ | undistributedFeeSnacks | Public ❗️ |   |NO❗️ |
| └ | calculateRedeemAmount | Public ❗️ |   |NO❗️ |
| └ | calculateBuyAmount | Public ❗️ |   |NO❗️ |
| └ | buy | External ❗️ | 🛑  |NO❗️ |
| └ | redeem | External ❗️ | 🛑  |NO❗️ |
| └ | _beforeDistributeFee | Internal 🔒 | 🛑  | |
| └ | distributeFee | External ❗️ | 🛑  | onlyOwner |
| └ | _afterDistributeFee | Internal 🔒 | 🛑  | |
| └ | setSeniorage | Public ❗️ | 🛑  | onlyOwner |
| └ | _afterTokenTransfer | Internal 🔒 | 🛑  | |
| └ | _addHolder | Private 🔐 | 🛑  | |
| └ | getTotalHoldersBalance | Public ❗️ |   |NO❗️ |
| └ | _unDecimals | Private 🔐 |   | |
| └ | _D | Internal 🔒 |   | |
| └ | calculateBuyTotal | Public ❗️ |   |NO❗️ |
| └ | buyTotal | External ❗️ | 🛑  |NO❗️ |
||||||
| **Snacks** | Implementation | SnacksBase |||
| └ | <Constructor> | Public ❗️ | 🛑  | SnacksBase |
| └ | undistributedFeeBTCSnacks | Public ❗️ |   |NO❗️ |
| └ | undistributedFeeETHSnacks | Public ❗️ |   |NO❗️ |
| └ | _beforeDistributeFee | Internal 🔒 | 🛑  | |
| └ | _afterDistributeFee | Internal 🔒 | 🛑  | |
| └ | _D | Internal 🔒 |   | |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
