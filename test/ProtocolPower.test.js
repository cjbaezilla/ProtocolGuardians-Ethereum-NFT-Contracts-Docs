const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtocolPower", function () {
  let power;
  let timelock;
  let owner;
  let addr1;
  let addr2;
  let minter;

  async function executeTimelockOperation(target, value, data, description) {
    const salt = ethers.id(description);
    await timelock.schedule(target, value, data, ethers.ZeroHash, salt, 172800);
    
    await ethers.provider.send("evm_increaseTime", [172800]);
    await ethers.provider.send("evm_mine");
    
    return await timelock.execute(target, value, data, ethers.ZeroHash, salt);
  }

  beforeEach(async function () {
    [owner, addr1, addr2, minter] = await ethers.getSigners();
    
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
    
    const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [minter.address]);
    await timelock.schedule(
      await power.getAddress(),
      0,
      grantMinterCalldata,
      ethers.ZeroHash,
      ethers.id("grantMinterRole"),
      172800
    );
    
    await ethers.provider.send("evm_increaseTime", [172800]);
    await ethers.provider.send("evm_mine");
    
    await timelock.execute(
      await power.getAddress(),
      0,
      grantMinterCalldata,
      ethers.ZeroHash,
      ethers.id("grantMinterRole")
    );
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await power.name()).to.equal("Protocol Power");
      expect(await power.symbol()).to.equal("POWER");
    });

    it("Should set timelock as owner", async function () {
      expect(await power.owner()).to.equal(await timelock.getAddress());
    });

    it("Should have zero total supply initially", async function () {
      expect(await power.totalSupply()).to.equal(0);
    });

    it("Should have correct decimals", async function () {
      expect(await power.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      await expect(power.connect(minter).mint(addr1.address, amount))
        .to.emit(power, "TokensMinted")
        .withArgs(addr1.address, amount);
      
      expect(await power.balanceOf(addr1.address)).to.equal(amount);
      expect(await power.totalSupply()).to.equal(amount);
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        power.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWith("ProtocolPower: caller is not a minter");
    });

    it("Should not allow minting to zero address", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        power.connect(minter).mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ProtocolPower: mint to zero address");
    });

    it("Should not allow minting zero amount", async function () {
      await expect(
        power.connect(minter).mint(addr1.address, 0)
      ).to.be.revertedWith("ProtocolPower: mint amount must be greater than 0");
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await power.MAX_SUPPLY();
      const amount = maxSupply + 1n;
      
      await expect(
        power.connect(minter).mint(addr1.address, amount)
      ).to.be.revertedWith("ProtocolPower: mint would exceed max supply");
    });

    it("Should allow multiple mints", async function () {
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("2000");
      
      await power.connect(minter).mint(addr1.address, amount1);
      await power.connect(minter).mint(addr2.address, amount2);
      
      expect(await power.balanceOf(addr1.address)).to.equal(amount1);
      expect(await power.balanceOf(addr2.address)).to.equal(amount2);
      expect(await power.totalSupply()).to.equal(amount1 + amount2);
    });
  });

  describe("Minter Role Management", function () {
    it("Should allow owner to grant minter role", async function () {
      const [,,,newMinter] = await ethers.getSigners();
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [newMinter.address]);
      
      const tx = await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleNew"
      );
      
      await expect(tx)
        .to.emit(power, "MinterRoleGranted")
        .withArgs(newMinter.address);
      
      expect(await power.hasMinterRole(newMinter.address)).to.be.true;
    });

    it("Should allow owner to revoke minter role", async function () {
      const [,,,newMinter] = await ethers.getSigners();
      
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [newMinter.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleForRevoke"
      );
      expect(await power.hasMinterRole(newMinter.address)).to.be.true;
      
      const revokeMinterCalldata = power.interface.encodeFunctionData("revokeMinterRole", [newMinter.address]);
      const tx = await executeTimelockOperation(
        await power.getAddress(),
        0,
        revokeMinterCalldata,
        "revokeMinterRoleTest"
      );
      
      await expect(tx)
        .to.emit(power, "MinterRoleRevoked")
        .withArgs(newMinter.address);
      
      expect(await power.hasMinterRole(newMinter.address)).to.be.false;
    });

    it("Should not allow non-owner to grant minter role", async function () {
      await expect(
        power.connect(addr1).grantMinterRole(minter.address)
      ).to.be.revertedWithCustomError(power, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to revoke minter role", async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [minter.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleForRevokeTest"
      );
      
      await expect(
        power.connect(addr1).revokeMinterRole(minter.address)
      ).to.be.revertedWithCustomError(power, "OwnableUnauthorizedAccount");
    });

    it("Should not allow granting role to zero address", async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [ethers.ZeroAddress]);
      
      await expect(
        executeTimelockOperation(
          await power.getAddress(),
          0,
          grantMinterCalldata,
          "grantMinterRoleZero"
        )
      ).to.be.revertedWith("ProtocolPower: grant to zero address");
    });

    it("Should not allow revoking role from zero address", async function () {
      const revokeMinterCalldata = power.interface.encodeFunctionData("revokeMinterRole", [ethers.ZeroAddress]);
      
      await expect(
        executeTimelockOperation(
          await power.getAddress(),
          0,
          revokeMinterCalldata,
          "revokeMinterRoleZero"
        )
      ).to.be.revertedWith("ProtocolPower: revoke from zero address");
    });
  });

  describe("Governance Features", function () {
    beforeEach(async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleOwner"
      );
      
      await power.connect(owner).mint(addr1.address, ethers.parseEther("10000"));
      await power.connect(owner).mint(addr2.address, ethers.parseEther("5000"));
    });

    it("Should support voting power", async function () {
      expect(await power.getVotes(addr1.address)).to.equal(0);
      
      await power.connect(addr1).delegate(addr1.address);
      expect(await power.getVotes(addr1.address)).to.equal(ethers.parseEther("10000"));
    });

    it("Should support delegation", async function () {
      await power.connect(addr1).delegate(addr2.address);
      expect(await power.getVotes(addr2.address)).to.equal(ethers.parseEther("10000"));
    });

    it("Should support permit functionality", async function () {
      const amount = ethers.parseEther("1000");
      const currentTime = await ethers.provider.getBlock('latest').then(block => block.timestamp);
      const deadline = currentTime + 3600; // 1 hour from now
      
      const nonce = await power.nonces(addr1.address);
      const domain = {
        name: "Protocol Power",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: await power.getAddress()
      };
      
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };
      
      const value = {
        owner: addr1.address,
        spender: addr2.address,
        value: amount,
        nonce: nonce,
        deadline: deadline
      };
      
      const signature = await addr1.signTypedData(domain, types, value);
      const { v, r, s } = ethers.Signature.from(signature);
      
      await power.permit(
        addr1.address,
        addr2.address,
        amount,
        deadline,
        v,
        r,
        s
      );
      
      expect(await power.allowance(addr1.address, addr2.address)).to.equal(amount);
    });

    it("Should support clock mode for governance", async function () {
      expect(await power.clock()).to.equal(await ethers.provider.getBlockNumber());
      expect(await power.CLOCK_MODE()).to.equal("mode=blocknumber&from=default");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleOwnerTransfers"
      );
      
      await power.connect(owner).mint(addr1.address, ethers.parseEther("1000"));
    });

    it("Should allow standard transfers", async function () {
      const amount = ethers.parseEther("100");
      await power.connect(addr1).transfer(addr2.address, amount);
      
      expect(await power.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
      expect(await power.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should support approval and transferFrom", async function () {
      const amount = ethers.parseEther("100");
      await power.connect(addr1).approve(addr2.address, amount);
      await power.connect(addr2).transferFrom(addr1.address, addr2.address, amount);
      
      expect(await power.balanceOf(addr2.address)).to.equal(amount);
      expect(await power.allowance(addr1.address, addr2.address)).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle max supply correctly", async function () {
      const maxSupply = await power.MAX_SUPPLY();
      expect(maxSupply).to.equal(ethers.parseEther("100000000"));
    });

    it("Should handle large mint amounts", async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleOwnerLargeMint"
      );
      
      const largeAmount = ethers.parseEther("1000000");
      
      await power.connect(owner).mint(addr1.address, largeAmount);
      expect(await power.balanceOf(addr1.address)).to.equal(largeAmount);
    });

    it("Should handle multiple minters", async function () {
      const grantMinterCalldata1 = power.interface.encodeFunctionData("grantMinterRole", [minter.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata1,
        "grantMinterRoleMinter"
      );
      
      const grantMinterCalldata2 = power.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata2,
        "grantMinterRoleAddr1"
      );
      
      expect(await power.hasMinterRole(minter.address)).to.be.true;
      expect(await power.hasMinterRole(addr1.address)).to.be.true;
      
      await power.connect(minter).mint(addr2.address, ethers.parseEther("100"));
      await power.connect(addr1).mint(addr2.address, ethers.parseEther("200"));
      
      expect(await power.balanceOf(addr2.address)).to.equal(ethers.parseEther("300"));
    });
  });

  describe("Events", function () {
    it("Should emit TokensMinted event", async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleOwnerEvents"
      );
      
      const amount = ethers.parseEther("1000");
      
      await expect(power.connect(owner).mint(addr1.address, amount))
        .to.emit(power, "TokensMinted")
        .withArgs(addr1.address, amount);
    });

    it("Should emit Transfer event on mint", async function () {
      const grantMinterCalldata = power.interface.encodeFunctionData("grantMinterRole", [owner.address]);
      await executeTimelockOperation(
        await power.getAddress(),
        0,
        grantMinterCalldata,
        "grantMinterRoleOwnerEvents2"
      );
      
      const amount = ethers.parseEther("1000");
      
      await expect(power.connect(owner).mint(addr1.address, amount))
        .to.emit(power, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount);
    });
  });
});
