# Ejemplos de Uso ProtocolGuardians

## Introducción

Esta guía proporciona ejemplos prácticos de cómo usar el ecosistema ProtocolGuardians, incluyendo staking, gobernanza y interacciones avanzadas.

## Configuración Inicial

### Setup del Proyecto

```javascript
// Importar dependencias
const { ethers } = require("hardhat");

// Configurar provider y signers
const provider = ethers.provider;
const [deployer, user1, user2, proposer, executor] = await ethers.getSigners();

// Addresses de contratos (después del deployment)
const protocolGuardiansAddress = "0x...";
const protocolPowerAddress = "0x...";
const protocolStakingAddress = "0x...";
const protocolTimelockAddress = "0x...";

// Instanciar contratos
const protocolGuardians = await ethers.getContractAt("ProtocolGuardians", protocolGuardiansAddress);
const protocolPower = await ethers.getContractAt("ProtocolPower", protocolPowerAddress);
const protocolStaking = await ethers.getContractAt("ProtocolStaking", protocolStakingAddress);
const protocolTimelock = await ethers.getContractAt("ProtocolTimelock", protocolTimelockAddress);
```

## Ejemplos de Staking

### Ejemplo 1: Staking Básico

```javascript
async function basicStaking() {
    console.log("🚀 Iniciando staking básico...");
    
    // 1. Mint NFT con CID de IPFS
    const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const mintTx = await protocolGuardians.mint(user1.address, cid);
    await mintTx.wait();
    console.log("✅ NFT minted con CID:", cid);
    
    // 2. Aprobar staking contract
    const approveTx = await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    await approveTx.wait();
    console.log("✅ Staking contract aprobado");
    
    // 3. Stake NFT
    const stakeTx = await protocolStaking.connect(user1).stake([1]);
    await stakeTx.wait();
    console.log("✅ NFT staked");
    
    // 4. Verificar staking
    const stakedTokens = await protocolStaking.getStakedTokens(user1.address);
    console.log("NFTs stakeados:", stakedTokens);
    
    // 5. Esperar recompensas
    console.log("⏳ Esperando recompensas...");
    for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
    }
    
    // 6. Verificar recompensas
    const rewards = await protocolStaking.getPendingRewards(1);
    console.log("Recompensas pendientes:", ethers.formatEther(rewards));
    
    // 7. Claimear recompensas
    const claimTx = await protocolStaking.connect(user1).claimRewards([1]);
    await claimTx.wait();
    console.log("✅ Recompensas claimeadas");
    
    // 8. Unstake NFT
    const unstakeTx = await protocolStaking.connect(user1).unstake([1]);
    await unstakeTx.wait();
    console.log("✅ NFT unstaked");
}
```

### Ejemplo 2: Staking Avanzado con Múltiples NFTs

```javascript
async function advancedStaking() {
    console.log("🚀 Iniciando staking avanzado...");
    
    // 1. Mint múltiples NFTs con diferentes CIDs
    const cids = [
        "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly",
        "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye",
        "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy",
        "bafybeicq2j7q4j6y7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f"
    ];
    const tokenIds = [];
    for (let i = 0; i < 5; i++) {
        const mintTx = await protocolGuardians.mint(user1.address, cids[i]);
        await mintTx.wait();
        tokenIds.push(i + 1);
    }
    console.log("✅ 5 NFTs minted con CIDs únicos");
    
    // 2. Aprobar staking contract
    await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    console.log("✅ Staking contract aprobado");
    
    // 3. Stake todos los NFTs
    const stakeTx = await protocolStaking.connect(user1).stake(tokenIds);
    await stakeTx.wait();
    console.log("✅ 5 NFTs staked");
    
    // 4. Monitorear recompensas
    const monitorRewards = async () => {
        const totalRewards = await protocolStaking.getTotalPendingRewards(user1.address);
        console.log("Recompensas totales:", ethers.formatEther(totalRewards));
        
        // Recompensas por NFT
        for (const tokenId of tokenIds) {
            const rewards = await protocolStaking.getPendingRewards(tokenId);
            console.log(`Token ${tokenId}: ${ethers.formatEther(rewards)} CREWARD`);
        }
    };
    
    // 5. Monitorear cada 5 bloques
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
            await ethers.provider.send("evm_mine");
        }
        await monitorRewards();
    }
    
    // 6. Claimear todas las recompensas
    const claimTx = await protocolStaking.connect(user1).claimRewards(tokenIds);
    await claimTx.wait();
    console.log("✅ Todas las recompensas claimeadas");
    
    // 7. Unstake todos los NFTs
    const unstakeTx = await protocolStaking.connect(user1).unstake(tokenIds);
    await unstakeTx.wait();
    console.log("✅ Todos los NFTs unstaked");
}
```

### Ejemplo 3: Gestión de Portfolio

```javascript
async function portfolioManagement() {
    console.log("🚀 Iniciando gestión de portfolio...");
    
    // 1. Setup inicial con CIDs
    await protocolGuardians.mint(user1.address, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
    await protocolGuardians.mint(user1.address, "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly");
    await protocolGuardians.mint(user2.address, "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye");
    
    await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    await protocolGuardians.connect(user2).setApprovalForAll(protocolStakingAddress, true);
    
    // 2. Staking de diferentes usuarios
    await protocolStaking.connect(user1).stake([1, 2]);
    await protocolStaking.connect(user2).stake([3]);
    
    // 3. Función de monitoreo
    const monitorPortfolio = async () => {
        console.log("\n📊 Estado del Portfolio:");
        
        // Usuario 1
        const user1Staked = await protocolStaking.getStakedTokens(user1.address);
        const user1Rewards = await protocolStaking.getTotalPendingRewards(user1.address);
        console.log(`Usuario 1 - NFTs: ${user1Staked.length}, Recompensas: ${ethers.formatEther(user1Rewards)}`);
        
        // Usuario 2
        const user2Staked = await protocolStaking.getStakedTokens(user2.address);
        const user2Rewards = await protocolStaking.getTotalPendingRewards(user2.address);
        console.log(`Usuario 2 - NFTs: ${user2Staked.length}, Recompensas: ${ethers.formatEther(user2Rewards)}`);
        
        // Total del sistema
        const totalStaked = await protocolStaking.totalStaked();
        console.log(`Total NFTs en staking: ${totalStaked}`);
    };
    
    // 4. Monitorear portfolio
    await monitorPortfolio();
    
    // 5. Esperar recompensas
    for (let i = 0; i < 20; i++) {
        await ethers.provider.send("evm_mine");
    }
    
    // 6. Monitorear después de recompensas
    await monitorPortfolio();
    
    // 7. Claimear recompensas
    await protocolStaking.connect(user1).claimRewards([1, 2]);
    await protocolStaking.connect(user2).claimRewards([3]);
    console.log("✅ Recompensas claimeadas por ambos usuarios");
    
    // 8. Monitorear final
    await monitorPortfolio();
}
```

## Ejemplos de Gobernanza

### Ejemplo 1: Propuesta Básica

```javascript
async function basicGovernance() {
    console.log("🚀 Iniciando gobernanza básica...");
    
    // 1. Setup de tokens para gobernanza
    await protocolPower.connect(deployer).grantMinterRole(deployer.address);
    await protocolPower.connect(deployer).mint(user1.address, ethers.parseEther("10000"));
    await protocolPower.connect(deployer).mint(user2.address, ethers.parseEther("5000"));
    
    // 2. Delegar poder de voto
    await protocolPower.connect(user1).delegate(user1.address);
    await protocolPower.connect(user2).delegate(user2.address);
    
    // 3. Verificar poder de voto
    const user1Votes = await protocolPower.getVotes(user1.address);
    const user2Votes = await protocolPower.getVotes(user2.address);
    console.log(`Usuario 1 - Poder de voto: ${ethers.formatEther(user1Votes)}`);
    console.log(`Usuario 2 - Poder de voto: ${ethers.formatEther(user2Votes)}`);
    
    // 4. Crear propuesta: Grant minter role
    const target = protocolPowerAddress;
    const value = 0;
    const data = protocolPower.interface.encodeFunctionData("grantMinterRole", [user1.address]);
    const predecessor = ethers.ZeroHash;
    const salt = ethers.ZeroHash;
    const delay = 2 * 24 * 60 * 60;
    
    // 5. Programar propuesta
    const operationId = await protocolTimelock.hashOperation(target, value, data, predecessor, salt);
    await protocolTimelock.connect(proposer).schedule(target, value, data, predecessor, salt, delay);
    console.log("✅ Propuesta programada");
    
    // 6. Verificar estado
    const isPending = await protocolTimelock.isOperationPending(operationId);
    console.log("Propuesta pendiente:", isPending);
    
    // 7. Esperar delay
    console.log("⏳ Esperando 2 días...");
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");
    
    // 8. Verificar que está lista
    const isReady = await protocolTimelock.isOperationReady(operationId);
    console.log("Propuesta lista:", isReady);
    
    // 9. Ejecutar propuesta
    await protocolTimelock.connect(executor).execute(target, value, data, predecessor, salt);
    console.log("✅ Propuesta ejecutada");
    
    // 10. Verificar que el cambio se aplicó
    const hasMinterRole = await protocolPower.hasMinterRole(user1.address);
    console.log("Usuario 1 tiene rol de minter:", hasMinterRole);
}
```

### Ejemplo 2: Gestión de Roles

```javascript
async function roleManagement() {
    console.log("🚀 Iniciando gestión de roles...");
    
    // 1. Grant proposer role
    const grantProposerData = protocolTimelock.interface.encodeFunctionData("grantRole", [
        await protocolTimelock.PROPOSER_ROLE(),
        user1.address
    ]);
    
    await protocolTimelock.connect(proposer).schedule(
        protocolTimelockAddress, 0, grantProposerData, ethers.ZeroHash, ethers.ZeroHash, 2 * 24 * 60 * 60
    );
    console.log("✅ Propuesta de proposer programada");
    
    // 2. Grant executor role
    const grantExecutorData = protocolTimelock.interface.encodeFunctionData("grantRole", [
        await protocolTimelock.EXECUTOR_ROLE(),
        user2.address
    ]);
    
    await protocolTimelock.connect(proposer).schedule(
        protocolTimelockAddress, 0, grantExecutorData, ethers.ZeroHash, ethers.ZeroHash, 2 * 24 * 60 * 60
    );
    console.log("✅ Propuesta de executor programada");
    
    // 3. Esperar delay
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");
    
    // 4. Ejecutar propuestas
    await protocolTimelock.connect(executor).execute(
        protocolTimelockAddress, 0, grantProposerData, ethers.ZeroHash, ethers.ZeroHash
    );
    await protocolTimelock.connect(executor).execute(
        protocolTimelockAddress, 0, grantExecutorData, ethers.ZeroHash, ethers.ZeroHash
    );
    console.log("✅ Propuestas de roles ejecutadas");
    
    // 5. Verificar roles
    const user1IsProposer = await protocolTimelock.hasRole(
        await protocolTimelock.PROPOSER_ROLE(),
        user1.address
    );
    const user2IsExecutor = await protocolTimelock.hasRole(
        await protocolTimelock.EXECUTOR_ROLE(),
        user2.address
    );
    
    console.log("Usuario 1 es proposer:", user1IsProposer);
    console.log("Usuario 2 es executor:", user2IsExecutor);
}
```

### Ejemplo 3: Monitoreo de Eventos

```javascript
async function eventMonitoring() {
    console.log("🚀 Iniciando monitoreo de eventos...");
    
    // 1. Configurar listeners
    protocolStaking.on("NFTsStaked", (owner, tokenIds) => {
        console.log("🎯 NFTs staked:", owner, tokenIds);
    });
    
    protocolStaking.on("RewardsClaimed", (owner, tokenIds, amount) => {
        console.log("💰 Rewards claimed:", owner, tokenIds, ethers.formatEther(amount));
    });
    
    protocolStaking.on("NFTsUnstaked", (owner, tokenIds) => {
        console.log("🔄 NFTs unstaked:", owner, tokenIds);
    });
    
    protocolTimelock.on("CallScheduled", (id, target, value, data, predecessor, delay) => {
        console.log("📅 Proposal scheduled:", id);
    });
    
    protocolTimelock.on("CallExecuted", (id, target, value, data) => {
        console.log("✅ Proposal executed:", id);
    });
    
    // 2. Realizar acciones que generen eventos
    await protocolGuardians.mint(user1.address, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
    await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
    await protocolStaking.connect(user1).stake([1]);
    
    // 3. Esperar recompensas
    for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
    }
    
    // 4. Claimear recompensas
    await protocolStaking.connect(user1).claimRewards([1]);
    
    // 5. Unstake
    await protocolStaking.connect(user1).unstake([1]);
    
    console.log("✅ Monitoreo de eventos completado");
}
```

## Ejemplos de Integración

### Ejemplo 1: Dashboard de Monitoreo

```javascript
async function createDashboard() {
    console.log("🚀 Creando dashboard de monitoreo...");
    
    // 1. Función para obtener métricas del sistema
    const getSystemMetrics = async () => {
        const totalStaked = await protocolStaking.totalStaked();
        const rewardRate = await protocolStaking.getRewardRatePerBlock();
        const tokensPerDay = await protocolStaking.getTokensPerDay();
        
        return {
            totalStaked: totalStaked.toString(),
            rewardRate: rewardRate.toString(),
            tokensPerDay: ethers.formatEther(tokensPerDay)
        };
    };
    
    // 2. Función para obtener métricas de usuario
    const getUserMetrics = async (userAddress) => {
        const stakedTokens = await protocolStaking.getStakedTokens(userAddress);
        const totalRewards = await protocolStaking.getTotalPendingRewards(userAddress);
        const rewardBalance = await protocolPower.balanceOf(userAddress);
        const votingPower = await protocolPower.getVotes(userAddress);
        
        return {
            stakedTokens: stakedTokens,
            totalRewards: ethers.formatEther(totalRewards),
            rewardBalance: ethers.formatEther(rewardBalance),
            votingPower: ethers.formatEther(votingPower)
        };
    };
    
    // 3. Monitoreo continuo
    const monitorSystem = async () => {
        console.log("\n📊 Dashboard ProtocolGuardians");
        console.log("=".repeat(50));
        
        // Métricas del sistema
        const systemMetrics = await getSystemMetrics();
        console.log("Sistema:");
        console.log(`- Total NFTs en staking: ${systemMetrics.totalStaked}`);
        console.log(`- Tasa de recompensas por bloque: ${systemMetrics.rewardRate}`);
        console.log(`- Tokens por día: ${systemMetrics.tokensPerDay}`);
        
        // Métricas de usuarios
        const user1Metrics = await getUserMetrics(user1.address);
        const user2Metrics = await getUserMetrics(user2.address);
        
        console.log("\nUsuario 1:");
        console.log(`- NFTs stakeados: ${user1Metrics.stakedTokens.length}`);
        console.log(`- Recompensas pendientes: ${user1Metrics.totalRewards} CREWARD`);
        console.log(`- Balance CREWARD: ${user1Metrics.rewardBalance}`);
        console.log(`- Poder de voto: ${user1Metrics.votingPower}`);
        
        console.log("\nUsuario 2:");
        console.log(`- NFTs stakeados: ${user2Metrics.stakedTokens.length}`);
        console.log(`- Recompensas pendientes: ${user2Metrics.totalRewards} CREWARD`);
        console.log(`- Balance CREWARD: ${user2Metrics.rewardBalance}`);
        console.log(`- Poder de voto: ${user2Metrics.votingPower}`);
        
        console.log("=".repeat(50));
    };
    
    // 4. Ejecutar monitoreo
    await monitorSystem();
}
```

### Ejemplo 2: Bot de Staking Automático

```javascript
async function stakingBot() {
    console.log("🚀 Iniciando bot de staking automático...");
    
    // 1. Configuración del bot
    const botConfig = {
        userAddress: user1.address,
        checkInterval: 10000, // 10 segundos
        minRewardsThreshold: ethers.parseEther("1"), // 1 token mínimo
        autoClaim: true,
        autoStake: true
    };
    
    // 2. Función principal del bot
    const runBot = async () => {
        try {
            // Verificar NFTs disponibles para staking
            const nftBalance = await protocolGuardians.balanceOf(botConfig.userAddress);
            if (nftBalance > 0) {
                console.log(`📦 ${nftBalance} NFTs disponibles para staking`);
                
                if (botConfig.autoStake) {
                    // Obtener token IDs
                    const tokenIds = [];
                    for (let i = 1; i <= nftBalance; i++) {
                        try {
                            const owner = await protocolGuardians.ownerOf(i);
                            if (owner === botConfig.userAddress) {
                                tokenIds.push(i);
                            }
                        } catch (e) {
                            // Token no existe
                        }
                    }
                    
                    if (tokenIds.length > 0) {
                        // Aprobar si es necesario
                        const isApproved = await protocolGuardians.isApprovedForAll(
                            botConfig.userAddress,
                            protocolStakingAddress
                        );
                        
                        if (!isApproved) {
                            await protocolGuardians.connect(user1).setApprovalForAll(protocolStakingAddress, true);
                            console.log("✅ Staking contract aprobado");
                        }
                        
                        // Stake NFTs
                        await protocolStaking.connect(user1).stake(tokenIds);
                        console.log(`✅ ${tokenIds.length} NFTs staked automáticamente`);
                    }
                }
            }
            
            // Verificar recompensas pendientes
            const stakedTokens = await protocolStaking.getStakedTokens(botConfig.userAddress);
            if (stakedTokens.length > 0) {
                const totalRewards = await protocolStaking.getTotalPendingRewards(botConfig.userAddress);
                console.log(`💰 Recompensas pendientes: ${ethers.formatEther(totalRewards)} CREWARD`);
                
                if (totalRewards >= botConfig.minRewardsThreshold && botConfig.autoClaim) {
                    await protocolStaking.connect(user1).claimRewards(stakedTokens);
                    console.log("✅ Recompensas claimeadas automáticamente");
                }
            }
            
        } catch (error) {
            console.error("❌ Error en bot:", error.message);
        }
    };
    
    // 3. Ejecutar bot
    await runBot();
    
    // 4. Configurar ejecución periódica (simulado)
    console.log("⏰ Bot configurado para ejecución periódica");
}
```

## Próximos Pasos

1. **Explorar Más Ejemplos**: Experimenta con diferentes combinaciones
2. **Crear Tu Propia Integración**: Desarrolla aplicaciones personalizadas
3. **Contribuir**: Comparte tus ejemplos con la comunidad
4. **Optimizar**: Encuentra la mejor estrategia para tu caso de uso

## Recursos Adicionales

- [Guía de Staking](./staking-guide.md)
- [Guía de Gobernanza DAO](./dao-guide.md)
- [Documentación de Contratos](./contratos.md)
- [Arquitectura del Sistema](./arquitectura.md)

## Soporte

Si tienes problemas con los ejemplos:

1. Revisa la documentación técnica
2. Verifica que tienes los permisos correctos
3. Consulta los logs de error
4. Contacta al equipo de desarrollo
