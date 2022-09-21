1. 使用 ckb-cli tx 子命令手动组装交易
    1. Start CKB devnet: [https://github.com/nervosnetwork/dapps-on-ckb-workshop-code](https://github.com/nervosnetwork/dapps-on-ckb-workshop-code)
        
        或者 [https://github.com/cryptape/lumos-ckit-internal/tree/main/devtools/docker](https://github.com/cryptape/lumos-ckit-internal/tree/main/devtools/docker)
        
    2. 创建账户、查看余额。因为链启动的时候就已经为 felicity 账户 issues cell，所以没有挖矿也会有余额。
        
        ```jsx
        # 创建账户
        echo 13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60 >> felicity
        
        # 将账户引入 ckb-cli
        $ ckb-cli account import --privkey-path felicity
        Password: 
        address:
          mainnet: ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wcykl27s
          testnet: ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g
        address(deprecated):
          mainnet: ckb1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluas5xgaqk
          testnet: ckt1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluasfrkzv2
        lock_arg: 0xcf055e9d2d50fd94120fa6d981728a9be55bff3b
        
        # 查看余额
        $ ckb-cli wallet get-capacity --address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g
        total: 20000000000.0 (CKB)
        ```
        
    3. 例子一：向目的地址转账 200 CKB。
        
        ```jsx
        # 目的地址转账前余额
        $ ckb-cli wallet get-capacity --address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g
        total: 0.0 (CKB)
        
        # 转账
        $ ckb-cli wallet transfer --to-address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq229jys88lu6ve5llzukd9u8x8eptgyn4cjc3acv --capacity 200 --privkey-path felicity
        0x72f4740c27a1d2c62a1cd4aa67727041b6142c1389dafb27d98cf1959b0d08e4
        
        # 目的地址转账后余额
        $ ckb-cli wallet get-capacity --address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq229jys88lu6ve5llzukd9u8x8eptgyn4cjc3acv
        total: 200.0 (CKB)
        ```
        
    4. 例子二：拼接转账交易。
        
        ```jsx
        $ ckb-cli wallet get-capacity --address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g
        total: 19999999799.99999536 (CKB)
        
        $ cat tx.json
        {
          "transaction": {
            "version": "0x0",
            "cell_deps": [],
            "header_deps": [],
            "inputs": [],
            "outputs": [],
            "witnesses": [],
            "outputs_data": []
          },
          "multisig_configs": {},
          "signatures": {}
        }
        
        $ ckb-cli
        
        $ tx info --tx-file tx.json
        input_total: 0.0 (CKB)
        output_total: 0.0 (CKB)
        tx_fee: 0.0 (CKB)
        
        CKB> tx add-multisig-config --sighash-address ckt1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluasfrkzv2 --tx-file tx.json
        status: success
        
        CKB> tx add-input --tx-hash 0x72f4740c27a1d2c62a1cd4aa67727041b6142c1389dafb27d98cf1959b0d08e4 --index 1 --tx-file tx.json
        status: success
        
        CKB> tx add-output --to-sighash-address ckt1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluasfrkzv2 --capacity 19999999700 --tx-file tx.json
        status: success
        
        CKB> tx info --tx-file tx.json
        [input] ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g => 19999999799.99999536, (data-length: 0, type-script: none, lock-kind: sighash(secp))
        [output] ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g => 19999999700.0, (data-length: 0, type-script: none, lock-kind: sighash(secp))
        input_total: 19999999799.99999536 (CKB)
        output_total: 19999999700.0 (CKB)
        tx_fee: 99.99999536 (CKB)
        
        CKB> tx add-output --to-sighash-address ckt1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluasfrkzv2 --capacity 99.8 --tx-file tx.json
        status: success
        
        CKB> tx info --tx-file tx.json
        [input] ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g => 19999999799.99999536, (data-length: 0, type-script: none, lock-kind: sighash(secp))
        [output] ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g => 19999999700.0, (data-length: 0, type-script: none, lock-kind: sighash(secp))
        [output] ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g => 99.8, (data-length: 0, type-script: none, lock-kind: sighash(secp))
        input_total: 19999999799.99999536 (CKB)
        output_total: 19999999799.8 (CKB)
        tx_fee: 0.19999536 (CKB)
        
        CKB> tx sign-inputs --from-account ckt1qyqv7p27n5k4plv5zg86dkvpw29fhe2mluasfrkzv2 --privkey-path felicity --add-signatures --tx-file tx.json
        Password:
        - lock-arg: 0xcf055e9d2d50fd94120fa6d981728a9be55bff3b
          signature: 0xaa6eb485f065b6459f061aad9955eace2fe6da716f887058030b8c108a7775a07d64b25e1cdc7d4a8b85ac2922da471e6c0db56fd479c5ca33a65af92e7ad1c500
        
        CKB> tx send --tx-file tx.json
        0x13070b5dfe06c5973f51c8424088f947743dc4f6786fdf864f451523320505f5
        ```
        
2. 在 testnet 部署 always success 合约，并使用 type id 作为 type script
    
    新建合约项目：
    
    ```jsx
    capsule new always-success
    ```
    
    always success 合约内容：
    
    ```jsx
    use core::result::Result;
    use crate::error::Error;
    
    pub fn main() -> Result<(), Error> {
        Ok(())
    }
    ```
    
    编译合约：
    
    ```jsx
    capsule build --release
    ```
    
    然后可以在 build 目录下看到生成的 always-success 二进制文件。
    
    生成新的 cell，data 为读取的 always-success 二进制，type script 为 type id
    
    ```jsx
    deploy-contract$ ts-node src/deploy.ts 
    0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d
    ```
    
    transaction: [https://pudge.explorer.nervos.org/transaction/0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d](https://pudge.explorer.nervos.org/transaction/0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d)
    
3. 创建一个 lock 和 type 都使用 always success 的 cell
    
    ```jsx
    deploy-contract$ ts-node src/new-cell.ts
    0x36ae7d696485959c0ba867ba6fb0cd1abc0fdc2cc945c3065fa872195cc701bd
    ```
    
    transaction: [https://pudge.explorer.nervos.org/transaction/0x36ae7d696485959c0ba867ba6fb0cd1abc0fdc2cc945c3065fa872195cc701bd](https://pudge.explorer.nervos.org/transaction/0x36ae7d696485959c0ba867ba6fb0cd1abc0fdc2cc945c3065fa872195cc701bd)
    
4. 升级一次 always success，可以不修改 data
    
    ```jsx
    deploy-contract$ ts-node src/upgrade.ts
    0xd4730c6109b636d57b05350c9c20dcb8c843d58baa38e91e15d6e5dab8e25b7d
    ```
    
    transaction: [https://pudge.explorer.nervos.org/transaction/0xd4730c6109b636d57b05350c9c20dcb8c843d58baa38e91e15d6e5dab8e25b7d](https://pudge.explorer.nervos.org/transaction/0xd4730c6109b636d57b05350c9c20dcb8c843d58baa38e91e15d6e5dab8e25b7d)
    
5. 使用升级后的 always success 组装交易解锁第三步中的 cell
    
    ```jsx
    $ ts-node src/unlock.ts
    0x9e736ca07372cf1be07a8c2c388190f6b02f06174da8b8592fd9c1e3d85e46ae
    ```
    
    transaction: [https://pudge.explorer.nervos.org/transaction/0x9e736ca07372cf1be07a8c2c388190f6b02f06174da8b8592fd9c1e3d85e46ae](https://pudge.explorer.nervos.org/transaction/0x9e736ca07372cf1be07a8c2c388190f6b02f06174da8b8592fd9c1e3d85e46ae)
