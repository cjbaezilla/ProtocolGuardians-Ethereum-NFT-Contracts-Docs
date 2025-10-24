# Guía de Deployment ProtocolGuardians

## Prerrequisitos

### Herramientas Necesarias
- Node.js >= 16.0.0
- npm o yarn
- Git
- Wallet con ETH para gas

### Dependencias
```bash
npm install --save-dev solady @openzeppelin/contracts
```

## Configuración del Entorno

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Red principal
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here

# Red de prueba (opcional)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 2. Configuración de Hardhat

El archivo `hardhat.config.js` ya está configurado con las redes necesarias:

```javascript
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL,
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

## Proceso de Deployment

### 1. Preparación

```bash
# Instalar dependencias
npm install

# Compilar contratos
npx hardhat compile

# Ejecutar tests
npx hardhat test
```

### 2. Deployment Local (Testing)

```bash
# Iniciar red local
npx hardhat node

# En otra terminal, deployar
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Deployment en Testnet

```bash
# Deployar en Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

### 4. Deployment en Mainnet

```bash
# Deployar en Ethereum Mainnet
npx hardhat run scripts/deploy.js --network ethereum
```

## Deployment en Producción

### Contratos Desplegados

El contrato NFT ProtocolGuardians ya está desplegado y verificado en Ethereum Mainnet:

- **ProtocolGuardians NFT**: [`0xfB49118d739482048ff514b699C23E2875a91837`](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Etherscan**: [Ver Contrato](https://etherscan.io/address/0xfB49118d739482048ff514b699C23E2875a91837)
- **Sourcify**: [Código Verificado](https://repo.sourcify.dev/1/0xfB49118d739482048ff514b699C23E2875a91837/)
- **Blockscout**: [Ver en Blockscout](https://eth.blockscout.com/address/0xfB49118d739482048ff514b699C23E2875a91837?tab=contract)
- **Routescan**: [Ver en Routescan](https://routescan.io/address/0xfB49118d739482048ff514b699C23E2875a91837/contract/1/code)

## Script de Deployment

### Estructura del Script

El script `scripts/deploy.js` incluye:

1. **Deployment de Contratos**
2. **Configuración de Roles**
3. **Verificación de Configuraciones**
4. **Tests Básicos**
5. **Guardado de Información**

### Configuración Personalizada

Antes del deployment, modifica estas variables en el script:

```javascript
// Configuración
const BASE_URI = "ipfs://QmYourIPFSHashHere/"; // Reemplaza con tu hash IPFS
const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 días en segundos (configurable)

// Roles (modifica estas direcciones)
const proposers = [deployer.address]; // Agrega más proposers
const executors = [deployer.address]; // Agrega más executors
const admin = deployer.address; // Debe ser multisig en producción
```

## Verificación de Contratos

### 1. Verificación en Etherscan

```bash
# Verificar en Base Sepolia
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Verificar en Ethereum Mainnet
npx hardhat verify --network ethereum <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 2. Verificación Manual

```javascript
// Verificar configuración
const nftName = await protocolGuardians.name();
const rewardName = await protocolPower.name();
const stakingNFT = await protocolStaking.nftContract();
const timelockDelay = await protocolTimelock.getMinDelay();

console.log("NFT Name:", nftName);
console.log("Reward Name:", rewardName);
console.log("Staking NFT:", stakingNFT);
console.log("Timelock Delay:", timelockDelay, "seconds");
```

## Configuración Post-Deployment

### 1. Configuración de Roles

```javascript
// Grant proposer role
await protocolTimelock.grantRole(
    await protocolTimelock.PROPOSER_ROLE(),
    newProposerAddress
);

// Grant executor role
await protocolTimelock.grantRole(
    await protocolTimelock.EXECUTOR_ROLE(),
    newExecutorAddress
);
```

### 2. Configuración de Multisig

```javascript
// Transfer admin role to multisig
await protocolTimelock.grantRole(
    await protocolTimelock.TIMELOCK_ADMIN_ROLE(),
    multisigAddress
);

// Revoke admin role from deployer
await protocolTimelock.revokeRole(
    await protocolTimelock.TIMELOCK_ADMIN_ROLE(),
    deployerAddress
);
```

### 3. Configuración de IPFS

```javascript
// Verificar que el baseURI es correcto
const baseURI = await protocolGuardians._baseURI();
console.log("Base URI:", baseURI);

// El baseURI debe apuntar a tu hash IPFS
// Ejemplo: "ipfs://QmYourHashHere/"
```

## Monitoreo Post-Deployment

### 1. Verificación de Funcionalidad

```javascript
// Test básico de minting con CID de IPFS
const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
const mintTx = await protocolGuardians.mint(userAddress, cid);
await mintTx.wait();

// Test básico de staking
await protocolGuardians.setApprovalForAll(stakingAddress, true);
await protocolStaking.stake([1]);

// Test básico de governance
const proposalTx = await protocolTimelock.schedule(
    target, value, data, predecessor, salt, delay
);
```

### 2. Monitoreo de Eventos

```javascript
// Monitorear eventos de staking
protocolStaking.on("NFTsStaked", (owner, tokenIds) => {
    console.log("NFTs staked:", owner, tokenIds);
});

// Monitorear eventos de governance
protocolTimelock.on("CallScheduled", (id, target, value, data, predecessor, delay) => {
    console.log("Proposal scheduled:", id);
});
```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Gas
```
Error: insufficient funds for gas
```
**Solución**: Asegúrate de tener suficiente ETH para gas.

#### 2. Error de Red
```
Error: network connection failed
```
**Solución**: Verifica la URL de RPC y tu conexión a internet.

#### 3. Error de Verificación
```
Error: contract verification failed
```
**Solución**: Verifica que los parámetros del constructor sean correctos.

### Logs de Deployment

El script de deployment genera logs detallados:

```
🚀 Starting ProtocolGuardians deployment...

📋 Deployment Configuration:
- Base URI: ipfs://QmYourHashHere/
- Timelock Delay: 172800 seconds (2 days)
- Proposers: [0x...]
- Executors: [0x...]
- Admin: 0x...

1️⃣ Deploying ProtocolGuardians NFT...
✅ ProtocolGuardians deployed to: 0x...

2️⃣ Deploying ProtocolTimelock...
✅ ProtocolTimelock deployed to: 0x...

3️⃣ Deploying ProtocolPower...
✅ ProtocolPower deployed to: 0x...

4️⃣ Deploying ProtocolStaking...
✅ ProtocolStaking deployed to: 0x...

5️⃣ Setting up roles...
✅ Granted minter role to ProtocolStaking contract

6️⃣ Verifying configurations...
✅ ProtocolGuardians - Name: ProtocolGuardians Symbol: GUARDIAN
✅ ProtocolPower - Name: ProtocolPower Symbol: CREWARD
✅ ProtocolStaking - NFT Contract: 0x...
✅ ProtocolTimelock - Delay: 172800 seconds

7️⃣ Testing basic functionality...
✅ Successfully minted NFT with ID: 1
✅ Token URI: https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
✅ Approved staking contract for NFT transfers
✅ Successfully staked NFT
✅ Pending rewards: 0.000006944444444444 CREWARD
✅ Successfully unstaked NFT

🎉 Deployment completed successfully!

📊 Contract Addresses:
==================================================
ProtocolGuardians NFT: 0x...
ProtocolPower Token: 0x...
ProtocolStaking: 0x...
ProtocolTimelock: 0x...
==================================================
```

## Checklist de Deployment

### Pre-Deployment
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Tests pasando
- [ ] BaseURI configurado correctamente
- [ ] Roles definidos

### Deployment
- [ ] Contratos deployados
- [ ] Roles configurados
- [ ] Verificaciones pasando
- [ ] Tests básicos funcionando

### Post-Deployment
- [ ] Contratos verificados en Etherscan
- [ ] Multisig configurado
- [ ] Monitoreo activo
- [ ] Documentación actualizada

## Próximos Pasos

1. **Configurar Multisig**: Transferir admin role a multisig
2. **Configurar Proposers**: Agregar más proposers
3. **Configurar Executors**: Agregar más executors
4. **Testing**: Probar todas las funcionalidades
5. **Documentación**: Actualizar documentación con addresses

## Recursos Adicionales

- [Guía de Staking](./staking-guide.md)
- [Guía de Gobernanza DAO](./dao-guide.md)
- [Ejemplos de Uso](./ejemplos.md)
- [Arquitectura del Sistema](./arquitectura.md)

## Soporte

Si encuentras problemas durante el deployment:

1. Revisa los logs de deployment
2. Verifica la configuración de red
3. Asegúrate de tener suficiente ETH para gas
4. Consulta la documentación técnica
5. Contacta al equipo de desarrollo
