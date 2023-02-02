# zoinks

## ABI delivery

The CI/CD should use command `yarn hardhat deliver_abi` instead of compilation stage.

### ABI delivery configuration

The `.env` file should contain `ABI_DELIVERY` key with value that represents the method of the delivery.

Current possible values of the key:

* `file` - delivers the ABI files directly to the `frontend` folder.

## Ethernal block explorer secret

The `.env` file should contain `ETHERNAL_WORKSPACE` key with value that represents the workspace name in the Ethernal.
You also have to have `ETHERNAL_EMAIL` and `ETHERNAL_PASSWORD` keys with email and password for the Ethernal server. 
