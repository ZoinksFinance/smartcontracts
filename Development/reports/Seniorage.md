## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ..\dapp\contracts\Seniorage.sol | 7bbf644cc57745ba6e71aad719aa65b7be0f9bde |


### Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **Seniorage** | Implementation | Ownable |||
| └ | <Constructor> | Public ❗️ | 🛑  |NO❗️ |
| └ | configureCurrencies | External ❗️ | 🛑  | onlyOwner |
| └ | configureWallets | External ❗️ | 🛑  | onlyOwner |
| └ | setPulse | External ❗️ | 🛑  | onlyOwner |
| └ | setAuthority | External ❗️ | 🛑  | onlyOwner |
| └ | distributeNonBusdCurrencies | External ❗️ | 🛑  | onlyAuthority |
| └ | distributeBusd | External ❗️ | 🛑  | onlyAuthority |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
