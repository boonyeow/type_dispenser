import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { fromB64 } from "@mysten/bcs";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
dotenv.config();

const buildAndGetBytecode = () => {
  const { modules, dependencies } = JSON.parse(
    execSync(
      `${cliPath} move build --dump-bytecode-as-base64 --path ${packagePath}`,
      {
        encoding: "utf-8",
      }
    )
  );
  return { modules, dependencies };
};

const getTreasuryCapAndMetadata = async (digest) => {
  let metadata, treasuryCap;
  let result = await client.getTransactionBlock({
    digest: digest,
    options: {
      showObjectChanges: true,
    },
  });
  result.objectChanges.forEach((i) => {
    if (i.hasOwnProperty("objectType")) {
      if (i.objectType.startsWith("0x2::coin::TreasuryCap")) {
        treasuryCap = i;
      } else if (i.objectType.startsWith("0x2::coin::CoinMetadata")) {
        metadata = i;
      }
    }
  });
  return { treasuryCap, metadata };
};

const rpcUrl = getFullnodeUrl("testnet");
const client = new SuiClient({ url: rpcUrl });

// Load wallet
const keypair = Ed25519Keypair.fromSecretKey(fromB64(process.env.PRIVATE_KEY));
const userAddress = keypair.toSuiAddress();
console.log(userAddress);

// Publish package
let modules = [
  "oRzrCwYAAAAKAQAMAgweAyocBEYIBU5SB6ABnQEIvQJgBp0DDgqrAwUMsAMuAAoBDAIGAg8CEAIRAAECAAECBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABCwEGAQACBwgJAQIDDQsBAQwEDgMEAAEFAgcDCgMMAggABwgEAAMLAgEIAAULAwEIAAEGCAQBBQEIBQELAQEJAAEIAAcJAAIKAgoCCgILAQEIBQcIBAILAwEJAAsCAQkAAQsCAQgAAgkABQELAwEIAAxDb2luTWV0YWRhdGEGTVlDT0lOBk9wdGlvbgtUcmVhc3VyeUNhcAlUeENvbnRleHQDVXJsBGNvaW4PY3JlYXRlX2N1cnJlbmN5C2R1bW15X2ZpZWxkBGluaXQGbXljb2luBG5vbmUGb3B0aW9uD3B1YmxpY190cmFuc2ZlcgZzZW5kZXIIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIKAgcGTVlDT0lOCgIBAAACAQgBAAAAAAIVCgEuEQQMAwsAMQkHAAcBBwE4AAsBOAEMAgwECwIKAzgCCwQLAzgDAgA=",
];

let dependencies = [
  "0x0000000000000000000000000000000000000000000000000000000000000001",
  "0x0000000000000000000000000000000000000000000000000000000000000002",
];

// // Uncomment if necessary
// // Bytecode remains constant unless the package has been modified
// let { modules, dependencies } = buildAndGetBytecode(
//   process.env.CLI_PATH,
//   process.env.PACKAGE_PATH
// );

// Publish package
let txb = new TransactionBlock();
const [upgradeCap] = txb.publish({
  modules,
  dependencies,
});

txb.transferObjects([upgradeCap], txb.pure(userAddress));
let result = await client.signAndExecuteTransactionBlock({
  signer: keypair,
  transactionBlock: txb,
});

// Get treasury cap and metadata ids + type
let { treasuryCap, metadata } = await getTreasuryCapAndMetadata(result.digest);

let capType = treasuryCap.objectType;
let coinType = capType.slice(
  capType.indexOf("<") + 1,
  capType.lastIndexOf(">")
);

// Register type in coin manager
txb = new TransactionBlock();
txb.moveCall({
  target: `${process.env.MAIN_PACKAGE_ID}::coin_manager::add`,
  typeArguments: [coinType],
  arguments: [
    txb.object(process.env.COIN_BAG_ID),
    txb.object(treasuryCap.objectId),
    txb.object(metadata.objectId),
  ],
});

result = await client.signAndExecuteTransactionBlock({
  signer: keypair,
  transactionBlock: txb,
});
console.log(result);
