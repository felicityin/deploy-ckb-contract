import { readFileSync } from 'fs';
import { privateKeyToBlake160 } from "@ckb-lumos/hd/lib/key";
import {
  generateSecp256k1Blake160Address,
  sealTransaction,
} from "@ckb-lumos/helpers";
import { Script } from '@ckb-lumos/base';
import { config, hd, Indexer, RPC } from "@ckb-lumos/lumos";
import { generateUpgradeTypeIdDataTx } from "@ckb-lumos/common-scripts/lib/deploy";
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";
import { predefined as lumosPrefined } from "@ckb-lumos/config-manager";

// address: https://ckb.tools/generator
// faucet: https://faucet.nervos.org
const PRIVATE_KEY =
  "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60";
const CKB_URL = "https://testnet.ckbapp.dev";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

async function upgrade(typeId: Script, newScriptBin: Uint8Array) {
  config.initializeConfig(config.predefined.AGGRON4);

  const args = privateKeyToBlake160(PRIVATE_KEY);
  const fromAddr = generateSecp256k1Blake160Address(args, { config: lumosPrefined.AGGRON4 });

  const result = await generateUpgradeTypeIdDataTx({
    cellProvider: new Indexer(CKB_INDEXER_URL, CKB_URL), 
    fromInfo: fromAddr,
    scriptBinary: newScriptBin,
    config: config.predefined.AGGRON4,
    typeId,
  });

  console.log('%o', result)
  
  const tx = prepareSigningEntries(
    result.txSkeleton,
    config.predefined.AGGRON4,
    "SECP256K1_BLAKE160"
  );

  const signature = hd.key.signRecoverable(
    tx.get("signingEntries").get(0)?.message!,
    PRIVATE_KEY
  );

  const sealed = sealTransaction(tx, [signature]);
  const txHash = await new RPC(CKB_URL).send_transaction(sealed);

  console.log(txHash);
}  

// always-success cell: 
// https://pudge.explorer.nervos.org/transaction/0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d
const typeId: Script = {
  code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
  hash_type: 'type',
  args: '0xf7c76ce7f8694b396b66292f689af49b36b5b5f75cbe3e891a3f112490ddfa9f',
};

const contractBin = readFileSync("contracts-bin/always-success");

upgrade(typeId, contractBin).then(console.log, console.error);
