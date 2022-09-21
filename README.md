Install dependencies.
```
yarn
```

Usage 1. Deploy a contract via Type ID.
```
ts-node src/deploy.ts
```
example: https://pudge.explorer.nervos.org/transaction/0x842380984bff8b2c7bbb8fd8886bd6784795f2f8ad140e4e2b41d771fa27314d

Usage 2. Create a cell whose lock script and type script are both always-success.
```
ts-node src/new-cell.ts
```
example: https://pudge.explorer.nervos.org/transaction/0x36ae7d696485959c0ba867ba6fb0cd1abc0fdc2cc945c3065fa872195cc701bd

Usage 3. Upgrade the always-success contract.
```
ts-node src/upgrade.ts
```
example: https://pudge.explorer.nervos.org/transaction/0xd4730c6109b636d57b05350c9c20dcb8c843d58baa38e91e15d6e5dab8e25b7d

Usage 4. Use the upgraded always-success contract to unlock the cell in Usage 2.
```
ts-node src/unlock.ts
```
example: https://pudge.explorer.nervos.org/transaction/0x9e736ca07372cf1be07a8c2c388190f6b02f06174da8b8592fd9c1e3d85e46ae
