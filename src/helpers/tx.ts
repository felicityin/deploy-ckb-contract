import { readFileSync } from 'fs';
import { Reader } from "ckb-js-toolkit";
import { Transaction, Script, utils } from '@ckb-lumos/base';
import { SerializeTransaction } from '@ckb-lumos/base/lib/core';
import { createTransactionFromSkeleton, TransactionSkeletonType } from '@ckb-lumos/helpers';
import { normalizers } from 'ckb-js-toolkit';

export function getTransactionSize(txSkeleton: TransactionSkeletonType): number {
  const tx = createTransactionFromSkeleton(txSkeleton);
  return getTransactionSizeByTx(tx);
}

export function getTransactionSizeByTx(tx: Transaction): number {
  const serializedTx = SerializeTransaction(normalizers.NormalizeTransaction(tx));
  // 4 is serialized offset bytesize
  return serializedTx.byteLength + 4;
}

export function calculateFee(size: number, feeRate = BigInt(10000)): bigint {
  const ratio = 1000n;
  const base = BigInt(size) * feeRate;
  const fee = base / ratio;
  if (fee * ratio < base) {
    return fee + 1n;
  }
  return fee;
}

export function buildDataScript(binPath: string): Script {
  const binary = new Reader("0x" + readFileSync(binPath, "hex"));
  const binaryHash = utils.ckbHash(binary.toArrayBuffer()).serializeJson();
  return {
    code_hash: binaryHash,
    hash_type: 'type',
    args: '0x',
  };
}

export function buildTypeScript(typeScript: Script): Script {
  const codeHash = utils.computeScriptHash(typeScript);
  return {
    code_hash: codeHash,
    hash_type: 'type',
    args: '0x',
  };
}
