# type_dispenser
## Setup
To get started, please follow these steps:

1. Clone the repo and run `npm install`
2. Configure `.env` at project root
```
CLI_PATH="C:/Users/BY/.cargo/bin/sui.exe"
PACKAGE_PATH="C:/Users/BY/Documents/GitHub/type_dispenser/type_dispenser"
SCHEMA="<>"
PRIVATE_KEY="<>"
MAIN_PACKAGE_ID="0xf64ec44a029fb8580bcf2ddbd7fff02ed6ea204685a9c5b5fab7ef43da9481b3"
COIN_BAG_ID="0x422f3bff85bb353ea2fb73e590aab034e9855f837fe38e019bbbaf92da42e917"
```
**Notes:**
* Both `CLI_PATH` and `PACKAGE_PATH` uses absolute path
* Change the private key and schema accordingly
* Make sure the address associated has sufficient token for transactions

3. Run `node index.js`
