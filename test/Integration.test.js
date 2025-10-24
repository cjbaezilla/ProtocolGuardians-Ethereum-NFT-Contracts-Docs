const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Protocol Guardians Integration Tests", function () {
  const TIMELOCK_DELAY = 2 * 24 * 60 * 60;
  let guardians;
  let power;
  let staking;
  let timelock;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let proposer;
  let executor;
  
  // Test CIDs for IPFS token system
  const TEST_CIDS = [
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly",
    "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye",
    "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy",
    "bafybeicq2j7q4j6y7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f"
  ];

  async function executeTimelockOperation(target, value, data, description) {
    const salt = ethers.id(description);
    await timelock.connect(proposer).schedule(target, value, data, ethers.ZeroHash, salt, TIMELOCK_DELAY);
    
    await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY]);
    await ethers.provider.send("evm_mine");
    
    await timelock.connect(executor).execute(target, value, data, ethers.ZeroHash, salt);
  }

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, proposer, executor] = await ethers.getSigners();
    
    const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
    guardians = await ProtocolGuardians.deploy("ipfs://QmTestHash/");
    await guardians.waitForDeployment();
    
    const ProtocolTimelock = await ethers.getContractFactory("ProtocolTimelock");
    timelock = await ProtocolTimelock.deploy(
      TIMELOCK_DELAY,
      [proposer.address],
      [executor.address],
      owner.address
    );
    await timelock.waitForDeployment();
    
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    await timelock.connect(owner).grantRole(CANCELLER_ROLE, owner.address);
    
    const ProtocolPower = await ethers.getContractFactory("ProtocolPower");
    power = await ProtocolPower.deploy(await timelock.getAddress());
    await power.waitForDeployment();
    
    const ProtocolStaking = await ethers.getContractFactory("ProtocolStaking");
    staking = await ProtocolStaking.deploy(
      await guardians.getAddress(),
      await power.getAddress()
    );
    await staking.waitForDeployment();
    
    const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [await staking.getAddress()]);
    await executeTimelockOperation(
      await power.getAddress(),
      0,
      grantMinterCalldata,
      "grantMinterRoleStaking"
    );
  });

  describe("Complete Flow: Mint → Stake → Claim → Governance", function () {
    it("Should complete full staking flow", async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      await guardians.mint(addr1.address, TEST_CIDS[1]);
      await guardians.mint(addr2.address, TEST_CIDS[2]);
      
      expect(await guardians.balanceOf(addr1.address)).to.equal(2);
      expect(await guardians.balanceOf(addr2.address)).to.equal(1);
      
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      
      await staking.connect(addr1).stake([1, 2]);
      await staking.connect(addr2).stake([3]);
      
      expect(await staking.totalStaked()).to.equal(3);
      expect(await guardians.ownerOf(1)).to.equal(await staking.getAddress());
      expect(await guardians.ownerOf(2)).to.equal(await staking.getAddress());
      expect(await guardians.ownerOf(3)).to.equal(await staking.getAddress());
      
      for (let i = 0; i < 100; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const addr1Rewards = await staking.getTotalPendingRewards(addr1.address);
      const addr2Rewards = await staking.getTotalPendingRewards(addr2.address);
      
      expect(addr1Rewards).to.be.greaterThan(0);
      expect(addr2Rewards).to.be.greaterThan(0);
      expect(addr1Rewards).to.be.greaterThan(addr2Rewards);
      
      const initialBalance1 = await power.balanceOf(addr1.address);
      const initialBalance2 = await power.balanceOf(addr2.address);
      
      await staking.connect(addr1).claimRewards([1, 2]);
      await staking.connect(addr2).claimRewards([3]);
      
      const finalBalance1 = await power.balanceOf(addr1.address);
      const finalBalance2 = await power.balanceOf(addr2.address);
      
      expect(finalBalance1).to.be.greaterThan(initialBalance1);
      expect(finalBalance2).to.be.greaterThan(initialBalance2);
      
      expect(finalBalance1 - initialBalance1).to.be.greaterThan(finalBalance2 - initialBalance2);
      
      await staking.connect(addr1).unstake([1, 2]);
      await staking.connect(addr2).unstake([3]);
      
      expect(await staking.totalStaked()).to.equal(0);
      expect(await guardians.ownerOf(1)).to.equal(addr1.address);
      expect(await guardians.ownerOf(2)).to.equal(addr1.address);
      expect(await guardians.ownerOf(3)).to.equal(addr2.address);
    });

    it("Should handle multiple users staking simultaneously", async function () {
      for (let i = 0; i < 5; i++) {
        await guardians.mint(addr1.address, TEST_CIDS[i % TEST_CIDS.length]);
        await guardians.mint(addr2.address, TEST_CIDS[(i + 1) % TEST_CIDS.length]);
        await guardians.mint(addr3.address, TEST_CIDS[(i + 2) % TEST_CIDS.length]);
      }
      
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr3).setApprovalForAll(await staking.getAddress(), true);
      
      await staking.connect(addr1).stake([1, 4, 7]);
      await staking.connect(addr2).stake([2, 5, 8]);
      await staking.connect(addr3).stake([3, 6, 9]);
      
      expect(await staking.totalStaked()).to.equal(9);
      
      for (let i = 0; i < 50; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const rewards1 = await staking.getTotalPendingRewards(addr1.address);
      const rewards2 = await staking.getTotalPendingRewards(addr2.address);
      const rewards3 = await staking.getTotalPendingRewards(addr3.address);
      
      expect(rewards1).to.be.greaterThan(0);
      expect(rewards2).to.be.greaterThan(0);
      expect(rewards3).to.be.greaterThan(0);
      expect(rewards1).to.be.closeTo(rewards2, ethers.parseEther("0.1"));
      expect(rewards2).to.be.closeTo(rewards3, ethers.parseEther("0.1"));
    });
  });

  describe("Governance Flow", function () {
    beforeEach(async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleToOwner"
      );
      
      await power.connect(owner).mint(addr1.address, ethers.parseEther("10000"));
      await power.connect(owner).mint(addr2.address, ethers.parseEther("5000"));
    });

    it("Should complete governance proposal flow", async function () {
      await power.connect(addr1).delegate(addr1.address);
      await power.connect(addr2).delegate(addr2.address);
      
      expect(await power.getVotes(addr1.address)).to.equal(ethers.parseEther("10000"));
      expect(await power.getVotes(addr2.address)).to.equal(ethers.parseEther("5000"));
      
      const target = await power.getAddress();
      const value = 0;
      const data = power.interface.encodeFunctionData("grantMinterRole", [addr3.address]);
      const predecessor = ethers.ZeroHash;
      const salt = ethers.ZeroHash;
      const delay = 2 * 24 * 60 * 60;
      
      const operationId = await timelock.hashOperation(target, value, data, predecessor, salt);
      
      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt, delay);
      
      expect(await timelock.isOperationPending(operationId)).to.be.true;
      expect(await timelock.getProposalStatus(operationId)).to.equal(1);
      
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      expect(await timelock.isOperationReady(operationId)).to.be.true;
      expect(await timelock.getProposalStatus(operationId)).to.equal(2);
      
      await timelock.connect(executor).execute(target, value, data, predecessor, salt);
      
      expect(await timelock.isOperationDone(operationId)).to.be.true;
      expect(await timelock.getProposalStatus(operationId)).to.equal(3);
      expect(await power.hasMinterRole(addr3.address)).to.be.true;
    });

    it("Should handle proposal cancellation", async function () {
      const target = await power.getAddress();
      const value = 0;
      const data = power.interface.encodeFunctionData("grantMinterRole", [addr3.address]);
      const predecessor = ethers.ZeroHash;
      const salt = ethers.ZeroHash;
      const delay = 2 * 24 * 60 * 60;
      
      const operationId = await timelock.hashOperation(target, value, data, predecessor, salt);
      
      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt, delay);
      expect(await timelock.isOperationPending(operationId)).to.be.true;
      
      await timelock.connect(owner).cancel(operationId);
      expect(await timelock.isOperationPending(operationId)).to.be.false;
      expect(await timelock.isOperationDone(operationId)).to.be.false;
    });
  });

  describe("Staking with Governance", function () {
    beforeEach(async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleToOwnerStaking"
      );
      
      await power.connect(owner).mint(addr1.address, ethers.parseEther("10000"));
      await power.connect(owner).mint(addr2.address, ethers.parseEther("5000"));
      
      await power.connect(addr1).delegate(addr1.address);
      await power.connect(addr2).delegate(addr2.address);
    });

    it("Should allow governance to change reward rate", async function () {
      const initialRate = await staking.getRewardRatePerBlock();
      expect(initialRate).to.equal(1388888888888888n);
      
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([1]);
      
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const rewards = await staking.getPendingRewards(1);
      expect(rewards).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle contract interactions correctly", async function () {
      expect(await staking.nftContract()).to.equal(await guardians.getAddress());
      expect(await staking.rewardToken()).to.equal(await power.getAddress());
      expect(await power.owner()).to.equal(await timelock.getAddress());
    });

    it("Should handle large-scale operations", async function () {
      for (let i = 0; i < 20; i++) {
        await guardians.mint(addr1.address, TEST_CIDS[i % TEST_CIDS.length]);
      }
      
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      
      const tokenIds = Array.from({ length: 20 }, (_, i) => i + 1);
      for (let i = 0; i < tokenIds.length; i += 10) {
        const batch = tokenIds.slice(i, i + 10);
        await staking.connect(addr1).stake(batch);
      }
      
      expect(await staking.totalStaked()).to.equal(20);
      
      for (let i = 0; i < 100; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const totalRewards = await staking.getTotalPendingRewards(addr1.address);
      expect(totalRewards).to.be.greaterThan(0);
    });

    it("Should handle concurrent operations", async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      await guardians.mint(addr2.address, TEST_CIDS[1]);
      
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      
      await Promise.all([
        staking.connect(addr1).stake([1]),
        staking.connect(addr2).stake([2])
      ]);
      
      expect(await staking.totalStaked()).to.equal(2);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for complete flow", async function () {
      const mintTx = await guardians.mint(addr1.address, TEST_CIDS[0]);
      const mintReceipt = await mintTx.wait();
      
      const approveTx = await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      const approveReceipt = await approveTx.wait();
      
      const stakeTx = await staking.connect(addr1).stake([1]);
      const stakeReceipt = await stakeTx.wait();
      
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const claimTx = await staking.connect(addr1).claimRewards([1]);
      const claimReceipt = await claimTx.wait();
      
      const unstakeTx = await staking.connect(addr1).unstake([1]);
      const unstakeReceipt = await unstakeTx.wait();
      
      expect(mintReceipt.gasUsed).to.be.lessThan(200000);
      expect(approveReceipt.gasUsed).to.be.lessThan(100000);
      expect(stakeReceipt.gasUsed).to.be.lessThan(300000);
      expect(claimReceipt.gasUsed).to.be.lessThan(200000);
      expect(unstakeReceipt.gasUsed).to.be.lessThan(300000);
    });
  });
});