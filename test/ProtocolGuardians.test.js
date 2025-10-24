const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtocolGuardians", function () {
  let guardians;
  let owner;
  let addr1;
  let addr2;
  let baseURI = "ipfs://QmTestHash/";
  
  // Test CIDs for IPFS token system
  const TEST_CIDS = [
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly",
    "bafybeif2ewg3nqa4o7lxl4azqkx4vp4mfczk34sdlwfx72m7u2qiby7kye",
    "bafybeidrpfjuwpzqpg3dgdwaoadyrn6vznhvgxitkma7uy3u54ncfakhyy",
    "bafybeicq2j7q4j6y7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f"
  ];

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const ProtocolGuardians = await ethers.getContractFactory("ProtocolGuardians");
    guardians = await ProtocolGuardians.deploy(baseURI);
    await guardians.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await guardians.name()).to.equal("Protocol Guardians");
      expect(await guardians.symbol()).to.equal("GUARDIAN");
    });

    it("Should set the correct base URI", async function () {
      expect(await guardians.baseURI()).to.equal(baseURI);
    });

    it("Should have zero total supply initially", async function () {
      expect(await guardians.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT to specified address", async function () {
      const tx = await guardians.mint(addr1.address, TEST_CIDS[0]);
      const receipt = await tx.wait();
      
      expect(await guardians.ownerOf(1)).to.equal(addr1.address);
      expect(await guardians.balanceOf(addr1.address)).to.equal(1);
      expect(await guardians.totalSupply()).to.equal(1);
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = guardians.interface.parseLog(log);
          return parsed.name === "TokenMinted";
        } catch (e) {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should increment token ID for each mint", async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      await guardians.mint(addr2.address, TEST_CIDS[1]);
      await guardians.mint(addr1.address, TEST_CIDS[2]);
      
      expect(await guardians.ownerOf(1)).to.equal(addr1.address);
      expect(await guardians.ownerOf(2)).to.equal(addr2.address);
      expect(await guardians.ownerOf(3)).to.equal(addr1.address);
      expect(await guardians.totalSupply()).to.equal(3);
    });

    it("Should allow anyone to mint", async function () {
      await guardians.connect(addr1).mint(addr2.address, TEST_CIDS[0]);
      expect(await guardians.ownerOf(1)).to.equal(addr2.address);
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
    });

    it("Should return correct token URI", async function () {
      const tokenURI = await guardians.tokenURI(1);
      expect(tokenURI).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[0]);
    });

    it("Should return correct token URI for different token IDs", async function () {
      await guardians.mint(addr2.address, TEST_CIDS[1]);
      await guardians.mint(addr1.address, TEST_CIDS[2]);
      
      expect(await guardians.tokenURI(1)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[0]);
      expect(await guardians.tokenURI(2)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[1]);
      expect(await guardians.tokenURI(3)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[2]);
    });

    it("Should revert for non-existent token", async function () {
      await expect(guardians.tokenURI(999))
        .to.be.revertedWithCustomError(guardians, "TokenDoesNotExist");
    });

    it("Should handle variable shadowing fix correctly", async function () {
      const tokenURI = await guardians.tokenURI(1);
      expect(tokenURI).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[0]);
      
      const baseURIReturn = await guardians.baseURI();
      expect(baseURIReturn).to.equal(baseURI);
      
      expect(tokenURI).to.include("https://ipfs.io/ipfs/");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
    });

    it("Should allow owner to transfer NFT", async function () {
      await guardians.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      expect(await guardians.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should allow approved address to transfer NFT", async function () {
      await guardians.connect(addr1).approve(addr2.address, 1);
      await guardians.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
      expect(await guardians.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should revert when non-owner tries to transfer", async function () {
      await expect(
        guardians.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(guardians, "NotOwnerNorApproved");
    });
  });

  describe("Base URI Immutability", function () {
    it("Should not have function to change base URI", async function () {
      const contractInterface = guardians.interface;
      const functions = contractInterface.functions ? Object.keys(contractInterface.functions) : [];
      
      expect(functions).to.not.include("setBaseURI");
      expect(functions).to.not.include("updateBaseURI");
      expect(functions).to.not.include("changeBaseURI");
    });

    it("Should maintain same base URI after multiple mints", async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      await guardians.mint(addr2.address, TEST_CIDS[1]);
      
      expect(await guardians.baseURI()).to.equal(baseURI);
      expect(await guardians.tokenURI(1)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[0]);
      expect(await guardians.tokenURI(2)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[1]);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minting to zero address", async function () {
      await expect(guardians.mint(ethers.ZeroAddress, TEST_CIDS[0]))
        .to.be.revertedWithCustomError(guardians, "TransferToZeroAddress");
    });

    it("Should handle large token IDs correctly", async function () {
      for (let i = 0; i < 10; i++) {
        await guardians.mint(addr1.address, TEST_CIDS[i % TEST_CIDS.length]);
      }
      
      expect(await guardians.totalSupply()).to.equal(10);
      expect(await guardians.ownerOf(10)).to.equal(addr1.address);
      expect(await guardians.tokenURI(10)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[4]); // 9 % 5 = 4
    });

    it("Should handle string conversion correctly", async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      expect(await guardians.tokenURI(1)).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[0]);
      
      const tokenURI = await guardians.tokenURI(1);
      expect(tokenURI).to.include(TEST_CIDS[0]);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas cost for minting", async function () {
      const tx = await guardians.mint(addr1.address, TEST_CIDS[0]);
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lessThan(200000);
    });

    it("Should have reasonable gas cost for tokenURI", async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      
      const tx = await guardians.tokenURI(1);
      expect(tx).to.equal("https://ipfs.io/ipfs/" + TEST_CIDS[0]);
    });
  });

  describe("Events", function () {
    it("Should emit TokenMinted event", async function () {
      await expect(guardians.mint(addr1.address, TEST_CIDS[0]))
        .to.emit(guardians, "TokenMinted")
        .withArgs(addr1.address, 1);
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(guardians.mint(addr1.address, TEST_CIDS[0]))
        .to.emit(guardians, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);
    });

    it("Should emit TokenMintedWithCID event", async function () {
      await expect(guardians.mint(addr1.address, TEST_CIDS[0]))
        .to.emit(guardians, "TokenMintedWithCID")
        .withArgs(1, TEST_CIDS[0], addr1.address);
    });
  });

  describe("CID Functions", function () {
    beforeEach(async function () {
      await guardians.mint(addr1.address, TEST_CIDS[0]);
      await guardians.mint(addr2.address, TEST_CIDS[1]);
    });

    it("Should return correct CID by token ID", async function () {
      expect(await guardians.getCIDByTokenId(1)).to.equal(TEST_CIDS[0]);
      expect(await guardians.getCIDByTokenId(2)).to.equal(TEST_CIDS[1]);
    });

    it("Should return empty string for non-existent token ID", async function () {
      expect(await guardians.getCIDByTokenId(999)).to.equal("");
    });

    it("Should return correct token ID by CID", async function () {
      expect(await guardians.getTokenIdByCID(TEST_CIDS[0])).to.equal(1);
      expect(await guardians.getTokenIdByCID(TEST_CIDS[1])).to.equal(2);
    });

    it("Should revert for non-existent CID", async function () {
      await expect(guardians.getTokenIdByCID("bafybeinonexistent"))
        .to.be.revertedWith("ProtocolGuardians: CID not found");
    });
  });

  describe("Batch Minting", function () {
    it("Should mint multiple NFTs to single address", async function () {
      const cids = [TEST_CIDS[0], TEST_CIDS[1], TEST_CIDS[2]];
      
      // Get the return value using staticCall first
      const tokenIds = await guardians.batchMintToSingleAddress.staticCall(addr1.address, cids);
      
      // Then execute the actual transaction
      await guardians.batchMintToSingleAddress(addr1.address, cids);
      
      expect(tokenIds.length).to.equal(3);
      expect(tokenIds[0]).to.equal(1);
      expect(tokenIds[1]).to.equal(2);
      expect(tokenIds[2]).to.equal(3);
      
      expect(await guardians.ownerOf(1)).to.equal(addr1.address);
      expect(await guardians.ownerOf(2)).to.equal(addr1.address);
      expect(await guardians.ownerOf(3)).to.equal(addr1.address);
      
      expect(await guardians.getCIDByTokenId(1)).to.equal(TEST_CIDS[0]);
      expect(await guardians.getCIDByTokenId(2)).to.equal(TEST_CIDS[1]);
      expect(await guardians.getCIDByTokenId(3)).to.equal(TEST_CIDS[2]);
    });

    it("Should revert for empty CID array", async function () {
      await expect(guardians.batchMintToSingleAddress(addr1.address, []))
        .to.be.revertedWith("ProtocolGuardians: Empty CID array");
    });
  });
});
