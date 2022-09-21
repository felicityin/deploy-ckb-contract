// Reference: https://gist.github.com/homura/d62e5d3fa243d30fb2df25a6e963fa74

import { readFileSync } from 'fs';
import { privateKeyToBlake160 } from "@ckb-lumos/hd/lib/key";
import {
  generateSecp256k1Blake160Address,
  sealTransaction,
} from "@ckb-lumos/helpers";
import { config, hd, Indexer, RPC } from "@ckb-lumos/lumos";
import { generateDeployWithTypeIdTx } from "@ckb-lumos/common-scripts/lib/deploy";
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";
import { predefined as lumosPrefined } from "@ckb-lumos/config-manager";

// address: https://ckb.tools/generator
// faucet: https://faucet.nervos.org
const PRIVATE_KEY =
  "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60";
const CKB_URL = "https://testnet.ckbapp.dev";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

async function deploy(contractBinPath: string) {
  config.initializeConfig(config.predefined.AGGRON4);

  const args = privateKeyToBlake160(PRIVATE_KEY);
  const fromAddr = generateSecp256k1Blake160Address(args, { config: lumosPrefined.AGGRON4 });
  const contractBin = readFileSync(contractBinPath);

  const result = await generateDeployWithTypeIdTx({
    cellProvider: new Indexer(CKB_INDEXER_URL, CKB_URL), 
    fromInfo: fromAddr,
    scriptBinary: contractBin,
    config: config.predefined.AGGRON4,
  });
  
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

deploy("contracts-bin/always-success").then(console.log, console.error);
