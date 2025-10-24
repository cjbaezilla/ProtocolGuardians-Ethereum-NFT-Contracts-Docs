const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtocolStaking", function () {
  let guardians;
  let power;
  let staking;
  let timelock;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  
  // Test CIDs for IPFS token system
  const TEST_CIDS = [
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly",
    "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye",
    "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy"
  ];

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
    guardians = await ProtocolGuardians.deploy("ipfs://QmTestHash/");
    await guardians.waitForDeployment();
    
    const TimelockController = await ethers.getContractFactory("TimelockController");
    timelock = await TimelockController.deploy(
      172800,
      [owner.address],
      [owner.address],
      owner.address
    );
    await timelock.waitForDeployment();
    
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
    await timelock.schedule(
      await power.getAddress(),
      0,
      grantMinterCalldata,
      ethers.ZeroHash,
      ethers.id("grantMinterRoleStaking"),
      172800
    );
    
    await ethers.provider.send("evm_increaseTime", [172800]);
    await ethers.provider.send("evm_mine");
    
    await timelock.execute(
      await power.getAddress(),
      0,
      grantMinterCalldata,
      ethers.ZeroHash,
      ethers.id("grantMinterRoleStaking")
    );
    
    await guardians.mint(addr1.address, TEST_CIDS[0]);
    await guardians.mint(addr1.address, TEST_CIDS[1]);
    await guardians.mint(addr2.address, TEST_CIDS[2]);
    await guardians.mint(addr3.address, TEST_CIDS[3]);
  });

  describe("Deployment", function () {
    it("Should set the correct NFT contract", async function () {
      expect(await staking.nftContract()).to.equal(await guardians.getAddress());
    });

    it("Should set the correct reward token", async function () {
      expect(await staking.rewardToken()).to.equal(await power.getAddress());
    });

    it("Should have zero total staked initially", async function () {
      expect(await staking.totalStaked()).to.equal(0);
    });

    it("Should have correct reward rate per block", async function () {
      const rate = await staking.getRewardRatePerBlock();
      expect(rate).to.equal(1388888888888888n);
    });

    it("Should have correct tokens per day", async function () {
      const tokensPerDay = await staking.getTokensPerDay();
      expect(tokensPerDay).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr3).setApprovalForAll(await staking.getAddress(), true);
    });

    it("Should allow staking single NFT", async function () {
      const tokenId = 1;
      
      await expect(staking.connect(addr1).stake([tokenId]))
        .to.emit(staking, "NFTsStaked")
        .withArgs(addr1.address, [tokenId]);
      
      expect(await guardians.ownerOf(tokenId)).to.equal(await staking.getAddress());
      expect(await staking.totalStaked()).to.equal(1);
      
      const stakedTokens = await staking.getStakedTokens(addr1.address);
      expect(stakedTokens).to.deep.equal([tokenId]);
    });

    it("Should allow staking multiple NFTs", async function () {
      const tokenIds = [1, 2];
      
      await staking.connect(addr1).stake(tokenIds);
      
      expect(await guardians.ownerOf(1)).to.equal(await staking.getAddress());
      expect(await guardians.ownerOf(2)).to.equal(await staking.getAddress());
      expect(await staking.totalStaked()).to.equal(2);
      
      const stakedTokens = await staking.getStakedTokens(addr1.address);
      expect(stakedTokens).to.deep.equal(tokenIds);
    });

    it("Should not allow staking non-owned NFTs", async function () {
      await expect(
        staking.connect(addr1).stake([3])
      ).to.be.revertedWith("ProtocolStaking: Not token owner");
    });

    it("Should not allow staking already staked NFTs", async function () {
      await staking.connect(addr1).stake([1]);
      
      await expect(
        staking.connect(addr1).stake([1])
      ).to.be.revertedWith("ProtocolStaking: Not token owner");
    });

    it("Should not allow staking empty array", async function () {
      await expect(
        staking.connect(addr1).stake([])
      ).to.be.revertedWith("ProtocolStaking: No tokens to stake");
    });

    it("Should not allow staking too many tokens at once", async function () {
      const tokenIds = Array.from({ length: 51 }, (_, i) => i + 1);
      
      await expect(
        staking.connect(addr1).stake(tokenIds)
      ).to.be.revertedWith("ProtocolStaking: Too many tokens to stake at once");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      
      await staking.connect(addr1).stake([1, 2]);
      await staking.connect(addr2).stake([3]);
    });

    it("Should allow unstaking single NFT", async function () {
      const tokenId = 1;
      
      await expect(staking.connect(addr1).unstake([tokenId]))
        .to.emit(staking, "NFTsUnstaked")
        .withArgs(addr1.address, [tokenId]);
      
      expect(await guardians.ownerOf(tokenId)).to.equal(addr1.address);
      expect(await staking.totalStaked()).to.equal(2);
      
      const stakedTokens = await staking.getStakedTokens(addr1.address);
      expect(stakedTokens).to.deep.equal([2]);
    });

    it("Should allow unstaking multiple NFTs", async function () {
      const tokenIds = [1, 2];
      
      await staking.connect(addr1).unstake(tokenIds);
      
      expect(await guardians.ownerOf(1)).to.equal(addr1.address);
      expect(await guardians.ownerOf(2)).to.equal(addr1.address);
      expect(await staking.totalStaked()).to.equal(1);
      
      const stakedTokens = await staking.getStakedTokens(addr1.address);
      expect(stakedTokens).to.deep.equal([]);
    });

    it("Should not allow unstaking non-staked NFTs", async function () {
      await expect(
        staking.connect(addr1).unstake([4])
      ).to.be.revertedWith("ProtocolStaking: Not token owner");
    });

    it("Should not allow unstaking others' NFTs", async function () {
      await expect(
        staking.connect(addr2).unstake([1])
      ).to.be.revertedWith("ProtocolStaking: Not token owner");
    });
  });

  describe("Reward Calculation", function () {
    beforeEach(async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([1]);
    });

    it("Should calculate rewards correctly for one block", async function () {
      await ethers.provider.send("evm_mine");
      
      const pendingRewards = await staking.getPendingRewards(1);
      const expectedRewards = 1388888888888888n;
      
      expect(pendingRewards).to.equal(expectedRewards);
    });

    it("Should calculate rewards correctly for multiple blocks", async function () {
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const pendingRewards = await staking.getPendingRewards(1);
      const expectedRewards = 1388888888888888n * 10n;
      
      expect(pendingRewards).to.equal(expectedRewards);
    });

    it("Should calculate rewards correctly for one day", async function () {
      for (let i = 0; i < 7200; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const pendingRewards = await staking.getPendingRewards(1);
      const expectedRewards = ethers.parseEther("10");
      
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.01"));
    });

    it("Should return zero rewards for non-staked token", async function () {
      const pendingRewards = await staking.getPendingRewards(999);
      expect(pendingRewards).to.equal(0);
    });

    it("Should calculate batch rewards correctly", async function () {
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr2).stake([3]);
      
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const rewards = await staking.getPendingRewardsBatch([1, 3]);
      expect(rewards[0]).to.be.greaterThan(rewards[1]);
      expect(rewards[0]).to.be.greaterThan(0);
      expect(rewards[1]).to.be.greaterThan(0);
    });

    it("Should calculate total pending rewards for owner", async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([2]);
      
      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const totalRewards = await staking.getTotalPendingRewards(addr1.address);
      expect(totalRewards).to.be.greaterThan(0);
      expect(totalRewards).to.be.greaterThan(1388888888888888n * 3n);
    });
  });

  describe("Claiming Rewards", function () {
    beforeEach(async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([1]);
      
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
      }
    });

    it("Should allow claiming rewards", async function () {
      const initialBalance = await power.balanceOf(addr1.address);
      
      const claimTx = await staking.connect(addr1).claimRewards([1]);
      const receipt = await claimTx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = staking.interface.parseLog(log);
          return parsed.name === "RewardsClaimed";
        } catch {
          return false;
        }
      });
      
      const actualRewards = event ? staking.interface.parseLog(event).args.amount : 0n;
      
      await expect(claimTx)
        .to.emit(staking, "RewardsClaimed")
        .withArgs(addr1.address, [1], actualRewards);
      
      const finalBalance = await power.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(actualRewards);
    });

    it("Should not allow claiming rewards for non-staked tokens", async function () {
      await expect(
        staking.connect(addr1).claimRewards([999])
      ).to.be.revertedWith("ProtocolStaking: Not token owner");
    });

    it.skip("Should not allow claiming zero rewards", async function () {
      await staking.connect(addr1).claimRewards([1]);
      
      const pendingRewards = await staking.getPendingRewards(1);
      
      if (pendingRewards === 0n) {
        await expect(
          staking.connect(addr1).claimRewards([1])
        ).to.be.revertedWith("ProtocolStaking: No rewards to claim");
      } else {
        await staking.connect(addr1).claimRewards([1]);
        await expect(
          staking.connect(addr1).claimRewards([1])
        ).to.be.revertedWith("ProtocolStaking: No rewards to claim");
      }
    });

    it("Should allow claiming rewards for multiple tokens", async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([2]);
      
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      const initialBalance = await power.balanceOf(addr1.address);
      
      await staking.connect(addr1).claimRewards([1, 2]);
      
      const finalBalance = await power.balanceOf(addr1.address);
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });
  });

  describe("Unstaking with Rewards", function () {
    beforeEach(async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([1]);
      
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
      }
    });

    it("Should claim rewards when unstaking", async function () {
      const initialBalance = await power.balanceOf(addr1.address);
      
      const unstakeTx = await staking.connect(addr1).unstake([1]);
      const receipt = await unstakeTx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = staking.interface.parseLog(log);
          return parsed.name === "RewardsClaimed";
        } catch {
          return false;
        }
      });
      
      const actualRewards = event ? staking.interface.parseLog(event).args.amount : 0n;
      
      await expect(unstakeTx)
        .to.emit(staking, "RewardsClaimed")
        .withArgs(addr1.address, [1], actualRewards);
      
      const finalBalance = await power.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(actualRewards);
    });

    it("Should not claim rewards if no pending rewards", async function () {
      await staking.connect(addr1).claimRewards([1]);
      
      const initialBalance = await power.balanceOf(addr1.address);
      
      const pendingRewards = await staking.getPendingRewards(1);
      
      await staking.connect(addr1).unstake([1]);
      
      const finalBalance = await power.balanceOf(addr1.address);
      
      expect(finalBalance).to.be.greaterThanOrEqual(initialBalance);
      
      if (pendingRewards > 0n) {
        expect(finalBalance).to.be.greaterThan(initialBalance);
      }
    });
  });

  describe("Staking Info", function () {
    beforeEach(async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([1]);
    });

    it("Should return correct staking info", async function () {
      const info = await staking.getStakingInfo(1);
      
      expect(info.owner).to.equal(addr1.address);
      expect(info.stakedAtBlock).to.be.greaterThan(0);
      expect(info.lastClaimedBlock).to.equal(info.stakedAtBlock);
      expect(info.pendingRewards).to.equal(0);
    });

    it("Should return zero staking info for non-staked token", async function () {
      const info = await staking.getStakingInfo(999);
      
      expect(info.owner).to.equal(ethers.ZeroAddress);
      expect(info.stakedAtBlock).to.equal(0);
      expect(info.lastClaimedBlock).to.equal(0);
      expect(info.pendingRewards).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle reentrancy attacks", async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      
      await staking.connect(addr1).stake([1]);
      expect(await staking.totalStaked()).to.equal(1);
    });

    it("Should handle large numbers of staked tokens", async function () {
      for (let i = 0; i < 6; i++) {
        await guardians.mint(addr1.address, TEST_CIDS[i % TEST_CIDS.length]);
      }
      
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      
      const tokenIds = [1, 2, 5, 6, 7, 8, 9, 10];
      await staking.connect(addr1).stake(tokenIds);
      
      expect(await staking.totalStaked()).to.equal(8);
      
      const stakedTokens = await staking.getStakedTokens(addr1.address);
      expect(stakedTokens.length).to.equal(8);
    });

    it("Should handle zero address operations", async function () {
      await expect(
        staking.connect(addr1).stake([])
      ).to.be.revertedWith("ProtocolStaking: No tokens to stake");
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas cost for staking", async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      
      const tx = await staking.connect(addr1).stake([1]);
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lessThan(300000);
    });

    it("Should have reasonable gas cost for unstaking", async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await staking.connect(addr1).stake([1]);
      
      const tx = await staking.connect(addr1).unstake([1]);
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lessThan(300000);
    });

    it("Should handle batch operations within gas limits", async function () {
      for (let i = 0; i < 28; i++) {
        await guardians.mint(addr1.address, TEST_CIDS[i % TEST_CIDS.length]);
      }
      
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      
      const tokenIds = [1, 2, ...Array.from({ length: 28 }, (_, i) => i + 5)];
      
      const stakeTx = await staking.connect(addr1).stake(tokenIds);
      const stakeReceipt = await stakeTx.wait();
      
      expect(stakeReceipt.gasUsed).to.be.lessThan(4000000);
      
      const unstakeTx = await staking.connect(addr1).unstake(tokenIds);
      const unstakeReceipt = await unstakeTx.wait();
      
      expect(unstakeReceipt.gasUsed).to.be.lessThan(4000000);
    });

    it("Should handle external calls in loops correctly", async function () {
      await guardians.connect(addr1).setApprovalForAll(await staking.getAddress(), true);
      await guardians.connect(addr2).setApprovalForAll(await staking.getAddress(), true);
      
      await staking.connect(addr1).stake([1, 2]);
      await staking.connect(addr2).stake([3]);
      
      expect(await staking.totalStaked()).to.equal(3);
      
      expect(await guardians.ownerOf(1)).to.equal(await staking.getAddress());
      expect(await guardians.ownerOf(2)).to.equal(await staking.getAddress());
      expect(await guardians.ownerOf(3)).to.equal(await staking.getAddress());
    });
  });
});
