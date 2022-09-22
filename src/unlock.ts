import { normalizers, Reader } from 'ckb-js-toolkit';
import { Cell, Script } from '@ckb-lumos/base';
import { SerializeWitnessArgs } from '@ckb-lumos/base/lib/core';
import { SECP_SIGNATURE_PLACEHOLDER } from '@ckb-lumos/common-scripts/lib/helper';
import {
  sealTransaction,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { predefined as lumosPrefined } from "@ckb-lumos/config-manager";
import { config, Indexer, RPC } from "@ckb-lumos/lumos";
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";
import { calculateFee, getTransactionSize } from './helpers/tx'

// address: https://ckb.tools/generator
// faucet: https://faucet.nervos.org
const PRIVATE_KEY =
  "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60";
const CKB_URL = "https://testnet.ckbapp.dev";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

const FELICITY_LOCK: Script = {
  code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hash_type: 'type',
  args: '0xcf055e9d2d50fd94120fa6d981728a9be55bff3b',
}

async function unlockCell() {
  config.initializeConfig(config.predefined.AGGRON4);

  let txSkeleton = TransactionSkeleton({ cellProvider: new Indexer(CKB_INDEXER_URL, CKB_URL) });

  const cells = await getAlwaysSuccessCells();
  const balance = cells.map((cell) => BigInt(cell.cell_output.capacity)).reduce((p, c) => p + c, 0n);

  // inputs
  txSkeleton = txSkeleton.update('inputs', (inputs) => {
    return inputs.push(...cells);
  });

  // outputs
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: `0x0`,
        lock: FELICITY_LOCK,
      },
      data: '0x',
    });
  });

  // cell deps
  const secp256k1 = lumosPrefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160!;
  txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
    return cellDeps.push({
      // upgraded always-success contract:
      // https://pudge.explorer.nervos.org/transaction/0xd4730c6109b636d57b05350c9c20dcb8c843d58baa38e91e15d6e5dab8e25b7d
      out_point: {
        tx_hash: '0xd4730c6109b636d57b05350c9c20dcb8c843d58baa38e91e15d6e5dab8e25b7d',
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
          `0x${(BigInt(balance) - txFee).toString(16)}`;
      }
      return cell;
    });
  });

  const tx = prepareSigningEntries(
    txSkeleton,
    config.predefined.AGGRON4,
    "SECP256K1_BLAKE160"
  );

  const sealed = sealTransaction(tx, []);
  console.log('%o', sealed)
  const txHash = await new RPC(CKB_URL).send_transaction(sealed);

  console.log(txHash);
}

async function getAlwaysSuccessCells(): Promise<Cell[]> {
  // always-success cell: 
  // https://pudge.explorer.nervos.org/transaction/0x36ae7d696485959c0ba867ba6fb0cd1abc0fdc2cc945c3065fa872195cc701bd
  const alwaysSuccess: Script = {
    code_hash: '0xb4bb8275ee64cbe0c99900cd84d5366baccac55340fc6b499f1ba359318d77b9',
    hash_type: 'type',
    args: '0x',
  };

  const cell: Cell = {
    cell_output: {
      capacity: '0x37e11d600',  // 150 CKB
      lock: alwaysSuccess,
      type: alwaysSuccess,
    },
    data: '0x',
    out_point: {
      tx_hash: '0x36ae7d696485959c0ba867ba6fb0cd1abc0fdc2cc945c3065fa872195cc701bd',
      index: '0x1',
    }
  };

  return [cell];
}

unlockCell().then(console.log, console.error);
