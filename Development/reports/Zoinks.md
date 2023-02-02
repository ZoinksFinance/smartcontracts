## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ..\dapp\contracts\Zoinks.sol | e67cf16aa6bced78ea482186e03fba1854dc8792 |


### Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **Zoinks** | Implementation | ERC20, Ownable |||
| └ | <Constructor> | Public ❗️ | 🛑  | ERC20 |
| └ | configure | External ❗️ | 🛑  | onlyOwner |
| └ | setBuffer | External ❗️ | 🛑  | onlyOwner |
| └ | mint | External ❗️ | 🛑  |NO❗️ |
| └ | swapOnZoinks | External ❗️ | 🛑  |NO❗️ |
| └ | applyTWAP | External ❗️ | 🛑  | onlyAuthority |
| └ | getTWAP | Public ❗️ |   |NO❗️ |
| └ | _beforeTokenTransfer | Internal 🔒 | 🛑  | |
| └ | _afterTokenTransfer | Internal 🔒 | 🛑  | |
| └ | _burn | Private 🔐 | 🛑  | |
| └ | _rebaseInflation | Private 🔐 | 🛑  | |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
