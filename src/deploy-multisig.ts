// Reference: https://gist.github.com/homura/d62e5d3fa243d30fb2df25a6e963fa74

import { readFileSync } from 'fs';
import {
  sealTransaction,
} from "@ckb-lumos/helpers";
import { config, hd, Indexer, RPC } from "@ckb-lumos/lumos";
import { generateDeployWithTypeIdTx } from "@ckb-lumos/common-scripts/lib/deploy";
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";

// address: https://ckb.tools/generator
// faucet: https://faucet.nervos.org
const PRIVATE_KEYS = [
  "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60",
  "0x5368b818f59570b5bc078a6a564f098a191dcb8938d95c413be5065fd6c42d32"
];
const CKB_URL = "https://testnet.ckbapp.dev";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

const LOCKARG1 = "0xcf055e9d2d50fd94120fa6d981728a9be55bff3b";
const LOCKARG2 = "0xb6ddba87bb5af5f053b1ae5bcbc7f4de03479f7e";
const FROMINFO = {
  R: 2,
  M: 2,
  publicKeyHashes: [LOCKARG1, LOCKARG2],
};

async function deploy(contractBinPath: string) {
  config.initializeConfig(config.predefined.AGGRON4);

  const contractBin = readFileSync(contractBinPath);

  const result = await generateDeployWithTypeIdTx({
    cellProvider: new Indexer(CKB_INDEXER_URL, CKB_URL), 
    fromInfo: FROMINFO,
    scriptBinary: contractBin,
    config: config.predefined.AGGRON4,
  });

  const tx = prepareSigningEntries(
    result.txSkeleton,
    config.predefined.AGGRON4,
    "SECP256K1_BLAKE160_MULTISIG"
  );

  const message = tx.get("signingEntries").get(0)?.message;

  let pubkeyHashN: string = "";
  FROMINFO.publicKeyHashes.forEach((publicKeyHash) => {
    pubkeyHashN += publicKeyHash.slice(2);
  });

  let sigs: string = "";
  PRIVATE_KEYS.forEach((privKey) => {
    if (privKey !== "") {
      let sig = hd.key.signRecoverable(message!, privKey);
      sig = sig.slice(2);
      sigs += sig;
    }
  });

  sigs =
    "0x00" +
    ("00" + FROMINFO.R.toString(16)).slice(-2) +
    ("00" + FROMINFO.M.toString(16)).slice(-2) +
    ("00" + FROMINFO.publicKeyHashes.length.toString(16)).slice(-2) +
    pubkeyHashN +
    sigs;

  const sealed = sealTransaction(tx, [sigs]);
  const txHash = await new RPC(CKB_URL).send_transaction(sealed);

  console.log(txHash);
}

deploy("contracts-bin/always-success").then(console.log, console.error);
