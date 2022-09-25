import { commons, hd, helpers, Indexer, RPC } from "@ckb-lumos/lumos";
import { predefined } from "@ckb-lumos/config-manager";

const CKB_URL = "https://testnet.ckb.dev";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

// faucet: https://faucet.nervos.org
const ALICE_PRIVATE_KEY = "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60";
const ALICE_ADDRESS = "ckt1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluasfrkzv2";
const BOB_ADDRESS = "ckt1qyqtdhd6s7a44a0s2wc6uk7tcl6duq68nalqvzxw09";
const CHARLIE_ADDRESS = "ckt1qyqytska8tyywcdvrx8f3nzqkfep3zwgggjq5xt2hw";

// tips: debug to check the txSkeleton
// tips: we can use txSkeleton.toJSON() / txSkeleton.toJSON().outputs.toJSON() to pretty output on console
async function main() {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: new Indexer(CKB_INDEXER_URL, CKB_URL) });
  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [ALICE_ADDRESS],
    BOB_ADDRESS,
    100e8,
    undefined,
    undefined,
    { config: predefined.AGGRON4 }
  );
  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [ALICE_ADDRESS],
    CHARLIE_ADDRESS,
    100e8,
    undefined,
    undefined,
    { config: predefined.AGGRON4 }
  );

  // https://github.com/nervosnetwork/ckb/blob/develop/util/app-config/src/legacy/tx_pool.rs#L9
  // const DEFAULT_MIN_FEE_RATE: FeeRate = FeeRate::from_u64(1000);
  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [ALICE_ADDRESS],
    1000, /*fee_rate*/
    undefined,
    { config: predefined.AGGRON4 }
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  const signatures = txSkeleton
    .get("signingEntries")
    .map((entry) => hd.key.signRecoverable(entry.message, ALICE_PRIVATE_KEY))
    .toArray();

  const signedTx = helpers.sealTransaction(txSkeleton, signatures);
  const txHash = await new RPC(CKB_URL).send_transaction(signedTx);
  console.log(`Go to explorer to check the sent transaction https://pudge.explorer.nervos.org/transaction/${txHash}`);
}

main();
