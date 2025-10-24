const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtocolTimelock", function () {
  const TIMELOCK_DELAY = 2 * 24 * 60 * 60;
  let timelock;
  let proposer;
  let executor;
  let admin;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [proposer, executor, admin, addr1, addr2] = await ethers.getSigners();
    
    const ProtocolTimelock = await ethers.getContractFactory("ProtocolTimelock");
    timelock = await ProtocolTimelock.deploy(
      TIMELOCK_DELAY,
      [proposer.address],
      [executor.address],
      admin.address
    );
    await timelock.waitForDeployment();
    
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    await timelock.connect(admin).grantRole(CANCELLER_ROLE, admin.address);
  });

  describe("Deployment", function () {
    it("Should set the correct minimum delay", async function () {
      expect(await timelock.getMinDelay()).to.equal(TIMELOCK_DELAY);
    });

    it("Should set proposers correctly", async function () {
      expect(await timelock.hasRole(await timelock.PROPOSER_ROLE(), proposer.address)).to.be.true;
    });

    it("Should set executors correctly", async function () {
      expect(await timelock.hasRole(await timelock.EXECUTOR_ROLE(), executor.address)).to.be.true;
    });

    it("Should set admin correctly", async function () {
      expect(await timelock.hasRole(await timelock.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should emit TimelockInitialized event", async function () {
      expect(timelock).to.not.be.undefined;
    });
  });

  describe("Proposal Management", function () {
    let target;
    let value = 0;
    let data;
    let predecessor = ethers.ZeroHash;
    let salt = ethers.ZeroHash;

    beforeEach(async function () {
      const TestContract = await ethers.getContractFactory("ProtocolPower");
      target = await TestContract.deploy(await timelock.getAddress());
      await target.waitForDeployment();
      
      data = target.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
    });

    it("Should allow proposer to schedule operation", async function () {
      const operationId = await timelock.hashOperation(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt
      );

      await expect(
        timelock.connect(proposer).schedule(
          await target.getAddress(),
          value,
          data,
          predecessor,
          salt,
          TIMELOCK_DELAY
        )
      ).to.emit(timelock, "CallScheduled");

      expect(await timelock.isOperationPending(operationId)).to.be.true;
    });

    it("Should not allow non-proposer to schedule operation", async function () {
      await expect(
        timelock.connect(addr1).schedule(
          await target.getAddress(),
          value,
          data,
          predecessor,
          salt,
          TIMELOCK_DELAY
        )
      ).to.be.revertedWithCustomError(timelock, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow execution before delay", async function () {
      const operationId = await timelock.hashOperation(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt
      );

      await timelock.connect(proposer).schedule(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt,
        TIMELOCK_DELAY
      );

      expect(await timelock.isOperationReady(operationId)).to.be.false;
      expect(await timelock.isOperationDone(operationId)).to.be.false;

      await expect(
        timelock.connect(executor).execute(
          await target.getAddress(),
          value,
          data,
          predecessor,
          salt
        )
      ).to.be.revertedWithCustomError(timelock, "TimelockUnexpectedOperationState");
    });

    it("Should allow execution after delay", async function () {
      const operationId = await timelock.hashOperation(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt
      );

      await timelock.connect(proposer).schedule(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt,
        TIMELOCK_DELAY
      );

      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine");

      expect(await timelock.isOperationReady(operationId)).to.be.true;

      await expect(
        timelock.connect(executor).execute(
          await target.getAddress(),
          value,
          data,
          predecessor,
          salt
        )
      ).to.emit(timelock, "CallExecuted");

      expect(await timelock.isOperationDone(operationId)).to.be.true;
    });

    it("Should not allow non-executor to execute", async function () {
      const operationId = await timelock.hashOperation(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt
      );

      await timelock.connect(proposer).schedule(
        await target.getAddress(),
        value,
        data,
        predecessor,
        salt,
        TIMELOCK_DELAY
      );

      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        timelock.connect(addr1).execute(
          await target.getAddress(),
          value,
          data,
          predecessor,
          salt
        )
      ).to.be.revertedWithCustomError(timelock, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant proposer role", async function () {
      await timelock.connect(admin).grantRole(
        await timelock.PROPOSER_ROLE(),
        addr1.address
      );

      expect(await timelock.hasRole(await timelock.PROPOSER_ROLE(), addr1.address)).to.be.true;
    });

    it("Should allow admin to grant executor role", async function () {
      await timelock.connect(admin).grantRole(
        await timelock.EXECUTOR_ROLE(),
        addr1.address
      );

      expect(await timelock.hasRole(await timelock.EXECUTOR_ROLE(), addr1.address)).to.be.true;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        timelock.connect(addr1).grantRole(
          await timelock.PROPOSER_ROLE(),
          addr2.address
        )
      ).to.be.revertedWithCustomError(timelock, "AccessControlUnauthorizedAccount");
    });

    it("Should allow admin to revoke roles", async function () {
      await timelock.connect(admin).grantRole(
        await timelock.PROPOSER_ROLE(),
        addr1.address
      );

      await timelock.connect(admin).revokeRole(
        await timelock.PROPOSER_ROLE(),
        addr1.address
      );

      expect(await timelock.hasRole(await timelock.PROPOSER_ROLE(), addr1.address)).to.be.false;
    });
  });

  describe("Utility Functions", function () {
    it("Should return correct current timestamp", async function () {
      const currentTimestamp = await timelock.getCurrentTimestamp();
      const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
      
      expect(currentTimestamp).to.be.closeTo(blockTimestamp, 2);
    });

    it("Should return correct execution timestamp", async function () {
      const target = await ethers.getContractFactory("ProtocolPower");
      const testContract = await target.deploy(admin.address);
      await testContract.waitForDeployment();
      
      const data = testContract.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
      const operationId = await timelock.hashOperation(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      await timelock.connect(proposer).schedule(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash,
        TIMELOCK_DELAY
      );

      const executionTimestamp = await timelock.getExecutionTimestamp(operationId);
      const expectedTimestamp = (await ethers.provider.getBlock("latest")).timestamp + TIMELOCK_DELAY;
      
      expect(executionTimestamp).to.be.closeTo(expectedTimestamp, 2);
    });

    it("Should return correct proposal status", async function () {
      const target = await ethers.getContractFactory("ProtocolPower");
      const testContract = await target.deploy(await timelock.getAddress());
      await testContract.waitForDeployment();
      
      const data = testContract.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
      const operationId = await timelock.hashOperation(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      expect(await timelock.getProposalStatus(operationId)).to.equal(0);

      await timelock.connect(proposer).schedule(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash,
        TIMELOCK_DELAY
      );

      expect(await timelock.getProposalStatus(operationId)).to.equal(1);

      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine");

      expect(await timelock.getProposalStatus(operationId)).to.equal(2);

      await timelock.connect(executor).execute(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      expect(await timelock.getProposalStatus(operationId)).to.equal(3);
    });

    it("Should return correct proposal info", async function () {
      const target = await ethers.getContractFactory("ProtocolPower");
      const testContract = await target.deploy(admin.address);
      await testContract.waitForDeployment();
      
      const data = testContract.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
      const operationId = await timelock.hashOperation(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      await timelock.connect(proposer).schedule(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash,
        TIMELOCK_DELAY
      );

      const info = await timelock.getProposalInfo(operationId);
      expect(info.target).to.equal(ethers.ZeroAddress);
      expect(info.value).to.equal(0);
      expect(info.data).to.equal("0x");
      expect(info.predecessor).to.equal(ethers.ZeroHash);
      expect(info.salt).to.equal(ethers.ZeroHash);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple operations", async function () {
      const target = await ethers.getContractFactory("ProtocolPower");
      const testContract = await target.deploy(admin.address);
      await testContract.waitForDeployment();
      
      const data1 = testContract.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
      const data2 = testContract.interface.encodeFunctionData("grantMinterRole", [addr2.address]);
      
      const operationId1 = await timelock.hashOperation(
        await testContract.getAddress(),
        0,
        data1,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      const operationId2 = await timelock.hashOperation(
        await testContract.getAddress(),
        0,
        data2,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      await timelock.connect(proposer).schedule(
        await testContract.getAddress(),
        0,
        data1,
        ethers.ZeroHash,
        ethers.ZeroHash,
        TIMELOCK_DELAY
      );

      await timelock.connect(proposer).schedule(
        await testContract.getAddress(),
        0,
        data2,
        ethers.ZeroHash,
        ethers.ZeroHash,
        TIMELOCK_DELAY
      );

      expect(await timelock.isOperationPending(operationId1)).to.be.true;
      expect(await timelock.isOperationPending(operationId2)).to.be.true;
    });

    it("Should handle cancellation", async function () {
      const target = await ethers.getContractFactory("ProtocolPower");
      const testContract = await target.deploy(admin.address);
      await testContract.waitForDeployment();
      
      const data = testContract.interface.encodeFunctionData("grantMinterRole", [addr1.address]);
      const operationId = await timelock.hashOperation(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash
      );

      await timelock.connect(proposer).schedule(
        await testContract.getAddress(),
        0,
        data,
        ethers.ZeroHash,
        ethers.ZeroHash,
        TIMELOCK_DELAY
      );

      expect(await timelock.isOperationPending(operationId)).to.be.true;

      await timelock.connect(admin).cancel(operationId);

      expect(await timelock.isOperationPending(operationId)).to.be.false;
      expect(await timelock.isOperationDone(operationId)).to.be.false;
    });
  });
});
