# 1 type合约如何生成一个 typeScript？

[https://github.com/ckb-js/lumos/blob/develop/packages/common-scripts/src/deploy.ts#L515-L557](https://github.com/ckb-js/lumos/blob/develop/packages/common-scripts/src/deploy.ts#L515-L557)

```

// Buffer.from('TYPE_ID')
const TYPE_ID_CODE_HASH =
"0x00000000000000000000000000000000000000000000000000545950455f4944";
function generateTypeIdScript(input, outputIndex = "0x0") {
  validators.ValidateCellInput(input);
  assertHexadecimal("outputIndex", outputIndex);

  const args = generateTypeIdArgs(input, outputIndex);
  return {
    code_hash: TYPE_ID_CODE_HASH,
    hash_type: "type",
    args,
  };
}

function generateTypeIdArgs(input, outputIndex) {
  const outPointBuf = SerializeCellInput(normalizers.NormalizeCellInput(input));
  const outputIndexBuf = toBigUInt64LE(outputIndex);
  const ckbHasher = new CKBHasher();
  ckbHasher.update(outPointBuf);
  ckbHasher.update(outputIndexBuf);
  return ckbHasher.digestHex();
}
```

# 2 type 合约的 codeHash 是怎么计算的？

```
function getScriptConfigByTypeHash(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number
): ScriptConfig {
  const typeScript = txSkeleton.outputs.get(outputIndex)!.cell_output.type!;
  const codeHash = utils.computeScriptHash(typeScript);
  const txHash = calculateTxHash(txSkeleton);
  const scriptConfig: ScriptConfig = {
    CODE_HASH: codeHash,
    HASH_TYPE: "type",
    TX_HASH: txHash,
    INDEX: "0x0",
    DEP_TYPE: "code",
  };
  return scriptConfig;
}

```

# 3 为什么 type 合约是可升级的？

因为 hash 计算不包含data，只包含typescript:[https://xuejie.space/2020_02_03_introduction_to_ckb_script_programming_type_id/](https://xuejie.space/2020_02_03_introduction_to_ckb_script_programming_type_id/)

# 4 data 合约的 codeHash 是怎么计算的，为什么 data 合约是不可升级的？

[https://github.com/ckb-js/lumos/blob/develop/packages/common-scripts/src/deploy.ts#L473-L506](https://github.com/ckb-js/lumos/blob/develop/packages/common-scripts/src/deploy.ts#L473-L506)

```
function getScriptConfigByDataHash(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number
): ScriptConfig {
  const data = txSkeleton.outputs.get(outputIndex)!.data;
  const codeHash = utils
    .ckbHash(new Reader(data).toArrayBuffer())
    .serializeJson();
  const txHash = calculateTxHash(txSkeleton);
  const scriptConfig: ScriptConfig = {
    CODE_HASH: codeHash,
    HASH_TYPE: "data",
    TX_HASH: txHash,
    INDEX: "0x0",
    DEP_TYPE: "code",
  };
  return scriptConfig;
}
```

# 5 如何升级 typeId 合约？

[https://github.com/ckb-js/lumos/blob/develop/packages/common-scripts/src/deploy.ts#L559-L605](https://github.com/ckb-js/lumos/blob/develop/packages/common-scripts/src/deploy.ts#L559-L605)

# 6 homework.md 中的最后一道题是什么意思：使用升级后的 always success 组装交易解锁第三步中的 cell

第三步的时候，我们创建了一个 cell，这个 cell 用的 lock 和 type 都是 always success。
现在 always success 更新了。
我们在发送交易时， always success cell_dep 的 OutPoint 其实是会更新成最新，如果继续沿用旧的 OutPoint，会发现这是一个 dead cell 而不被允许使用。

# 感谢
感谢林国鹏和林永辉的解答
