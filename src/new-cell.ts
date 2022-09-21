import { CkitProvider, predefined } from '@ckitjs/ckit';
import { normalizers, Reader } from 'ckb-js-toolkit';
import { Cell, Script } from '@ckb-lumos/base';
import { SerializeWitnessArgs } from '@ckb-lumos/base/lib/core';
import { SECP_SIGNATURE_PLACEHOLDER } from '@ckb-lumos/common-scripts/lib/helper';
import { privateKeyToBlake160 } from "@ckb-lumos/hd/lib/key";
import {
  generateSecp256k1Blake160Address,
  sealTransaction,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { predefined as lumosPrefined } from "@ckb-lumos/config-manager";
import { config, hd, Indexer, RPC } from "@ckb-lumos/lumos";
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";
import {
  Amount,
  AmountUnit,
} from '@lay2/pw-core';
import { buildTypeScript, calculateFee, getTransactionSize } from './helpers/tx'

// address: https://ckb.tools/generator
// faucet: https://faucet.nervos.org
const PRIVATE_KEY =
  "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60";
const CKB_URL = "https://testnet.ckbapp.dev";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

const NEW_CELL_CAPAPCITY = new Amount('150', AmountUnit.ckb);

async function deployNewCell() {
  config.initializeConfig(config.predefined.AGGRON4);

  const args = privateKeyToBlake160(PRIVATE_KEY);
  const addr = generateSecp256k1Blake160Address(args, { config: lumosPrefined.AGGRON4 });

  let txSkeleton = TransactionSkeleton({ cellProvider: new Indexer(CKB_INDEXER_URL, CKB_URL) });

  const cells = await collectLockOnlyCells(addr, '9000');
  const balance = cells.map((cell) => BigInt(cell.cell_output.capacity)).reduce((p, c) => p + c, 0n);

  // inputs
  txSkeleton = txSkeleton.update('inputs', (inputs) => {
    return inputs.push(...cells);
  });

  // outputs
  const alwaySuccessScript: Script = buildTypeScript({
      // always-success cell:
      // https://pudge.explorer.nervos.org/transaction/0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d
      code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
      hash_type: 'type',
      args: '0xf7c76ce7f8694b396b66292f689af49b36b5b5f75cbe3e891a3f112490ddfa9f',
  });
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: `0x0`,
        lock: cells[0]!.cell_output.lock,
      },
      data: '0x',
    }, {
      cell_output: {
        capacity: `${NEW_CELL_CAPAPCITY.toHexString()}`,
        lock: alwaySuccessScript,
        type: alwaySuccessScript,
      },
      data: '0x',
    });
  });

  // cell deps
  const secp256k1 = lumosPrefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160!;
  txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
    return cellDeps.push({
      out_point: {
        tx_hash: secp256k1.TX_HASH,
        index: secp256k1.INDEX,
      },
      dep_type: secp256k1.DEP_TYPE,
    }, {
      // always-success cell: 
      // https://pudge.explorer.nervos.org/transaction/0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d
      out_point: {
        tx_hash: '0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d',
        index: '0x0',
      },
      dep_type: 'code',
    });
  });

  // witness
  const witnesses = cells.map((_cell, index) => {
    if (index === 0) {
      return new Reader(
        SerializeWitnessArgs(
          normalizers.NormalizeWitnessArgs({
            lock: SECP_SIGNATURE_PLACEHOLDER,
          }),
        ),
      ).serializeJson();
    }
    return '0x';
  });
  txSkeleton = txSkeleton.update('witnesses', (w) => {
    return w.push(...witnesses);
  });

  // tx fee
  const txFee = calculateFee(getTransactionSize(txSkeleton));
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.map((cell, index) => {
      if (index === 0) {
        cell.cell_output.capacity = 
          `0x${(BigInt(balance) - BigInt(NEW_CELL_CAPAPCITY.toHexString()) - txFee).toString(16)}`;
      }
      return cell;
    });
  });

  const tx = prepareSigningEntries(
    txSkeleton,
    config.predefined.AGGRON4,
    "SECP256K1_BLAKE160"
  );

  const signature = hd.key.signRecoverable(
    tx.get("signingEntries").get(0)?.message!,
    PRIVATE_KEY
  );

  const sealed = sealTransaction(tx, [signature]);
  console.log('%o', sealed)
  const txHash = await new RPC(CKB_URL).send_transaction(sealed);

  console.log(txHash);
}

async function collectLockOnlyCells(address: string, minCkb: string): Promise<Cell[]> {
  const ckitProvider = new CkitProvider(CKB_INDEXER_URL, CKB_URL);
  const networkConfig = process.env.NETWORK === 'Lina' ? predefined.Lina : predefined.Aggron;
  await ckitProvider.init(networkConfig);

  return await ckitProvider.collectLockOnlyCells(
    ckitProvider.parseToScript(address),
    new Amount(minCkb, AmountUnit.ckb).toHexString(),
  );
}

deployNewCell().then(console.log, console.error);
