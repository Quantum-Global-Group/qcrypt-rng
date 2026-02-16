// contracts/test/QuantumRandomnessOracle.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuantumRandomnessOracle", function () {
  let quantumOracle;
  let owner;
  let user1;
  let user2;
  let oracleNode;

  const REQUEST_FEE = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2, oracleNode] = await ethers.getSigners();

    const QuantumRandomnessOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
    quantumOracle = await QuantumRandomnessOracle.deploy(REQUEST_FEE, oracleNode.address);
    await quantumOracle.deployed();
  });

  // Helper: mine N empty blocks so commit-reveal delay elapses
  async function mineBlocks(n) {
    for (let i = 0; i < n; i++) {
      await ethers.provider.send("evm_mine", []);
    }
  }

  // ---------------------------------------------------------------------------
  // Deployment
  // ---------------------------------------------------------------------------
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await quantumOracle.owner()).to.equal(owner.address);
    });

    it("Should set the right oracle node", async function () {
      expect(await quantumOracle.oracleNode()).to.equal(oracleNode.address);
    });

    it("Should set the right fee", async function () {
      expect(await quantumOracle.fee()).to.equal(REQUEST_FEE);
    });
  });

  // ---------------------------------------------------------------------------
  // Request Randomness
  // ---------------------------------------------------------------------------
  describe("Request Randomness", function () {
    it("Should allow users to request randomness", async function () {
      await expect(
        quantumOracle.connect(user1).requestRandomness({ value: REQUEST_FEE })
      )
        .to.emit(quantumOracle, "RandomnessRequested")
        .withArgs(0, user1.address, REQUEST_FEE);

      const request = await quantumOracle.getRequest(0);
      expect(request.requester).to.equal(user1.address);
      expect(request.fee).to.equal(REQUEST_FEE);
      expect(request.fulfilled).to.be.false;
    });

    it("Should reject requests with insufficient fee", async function () {
      await expect(
        quantumOracle.connect(user1).requestRandomness({
          value: ethers.utils.parseEther("0.001"),
        })
      ).to.be.revertedWith("Insufficient fee paid");
    });

    it("Should increment request counter", async function () {
      await quantumOracle.connect(user1).requestRandomness({ value: REQUEST_FEE });
      await quantumOracle.connect(user2).requestRandomness({ value: REQUEST_FEE });

      const request1 = await quantumOracle.getRequest(0);
      const request2 = await quantumOracle.getRequest(1);

      expect(request1.requester).to.equal(user1.address);
      expect(request2.requester).to.equal(user2.address);
    });
  });

  // ---------------------------------------------------------------------------
  // Two-phase commit-reveal
  // ---------------------------------------------------------------------------
  describe("Commit-Reveal Flow", function () {
    let requestId;
    let randomnessValue;
    let commitment;

    beforeEach(async function () {
      await quantumOracle.connect(user1).requestRandomness({ value: REQUEST_FEE });
      requestId = 0;

      // Generate a random value and its keccak256 commitment
      randomnessValue = ethers.BigNumber.from(ethers.utils.randomBytes(32));
      commitment = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["uint256"], [randomnessValue])
      );
    });

    it("Should allow oracle node to submit a commitment", async function () {
      await expect(
        quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment)
      )
        .to.emit(quantumOracle, "CommitmentSubmitted")
        .withArgs(requestId, commitment);

      const request = await quantumOracle.getRequest(requestId);
      expect(request.commitment).to.equal(commitment);
    });

    it("Should reject duplicate commitment", async function () {
      await quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment);
      await expect(
        quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment)
      ).to.be.revertedWith("Commitment already submitted");
    });

    it("Should reject commitment from non-oracle node", async function () {
      await expect(
        quantumOracle.connect(user1).submitCommitment(requestId, commitment)
      ).to.be.revertedWith("Only oracle node can fulfill requests");
    });

    it("Should fulfill after commit-reveal delay", async function () {
      await quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment);

      // Mine enough blocks so the delay elapses
      await mineBlocks(2);

      await expect(
        quantumOracle.connect(oracleNode).fulfillRandomness(requestId, randomnessValue)
      )
        .to.emit(quantumOracle, "RandomnessFulfilled")
        .withArgs(requestId, randomnessValue, 256);

      const request = await quantumOracle.getRequest(requestId);
      expect(request.fulfilled).to.be.true;
      expect(request.randomness).to.equal(randomnessValue);
    });

    it("Should reject reveal before delay elapses", async function () {
      await quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment);

      // Do NOT mine extra blocks
      await expect(
        quantumOracle.connect(oracleNode).fulfillRandomness(requestId, randomnessValue)
      ).to.be.revertedWith("Commit-reveal delay not elapsed");
    });

    it("Should reject reveal without a commitment", async function () {
      await expect(
        quantumOracle.connect(oracleNode).fulfillRandomness(requestId, randomnessValue)
      ).to.be.revertedWith("Commitment not yet submitted");
    });

    it("Should reject reveal with wrong preimage", async function () {
      await quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment);
      await mineBlocks(2);

      const wrongRandomness = ethers.BigNumber.from(ethers.utils.randomBytes(32));
      await expect(
        quantumOracle.connect(oracleNode).fulfillRandomness(requestId, wrongRandomness)
      ).to.be.revertedWith("Commitment mismatch");
    });

    it("Should reject fulfillment by non-oracle node", async function () {
      await quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment);
      await mineBlocks(2);

      await expect(
        quantumOracle.connect(user1).fulfillRandomness(requestId, randomnessValue)
      ).to.be.revertedWith("Only oracle node can fulfill requests");
    });

    it("Should reject double fulfillment", async function () {
      await quantumOracle.connect(oracleNode).submitCommitment(requestId, commitment);
      await mineBlocks(2);

      await quantumOracle.connect(oracleNode).fulfillRandomness(requestId, randomnessValue);

      await expect(
        quantumOracle.connect(oracleNode).fulfillRandomness(requestId, randomnessValue)
      ).to.be.revertedWith("Request already fulfilled");
    });
  });

  // ---------------------------------------------------------------------------
  // Access Control
  // ---------------------------------------------------------------------------
  describe("Access Control", function () {
    it("Should allow owner to update oracle node", async function () {
      const newOracleNode = user2.address;

      await expect(quantumOracle.connect(owner).updateOracleNode(newOracleNode))
        .to.emit(quantumOracle, "OracleNodeUpdated")
        .withArgs(oracleNode.address, newOracleNode);

      expect(await quantumOracle.oracleNode()).to.equal(newOracleNode);
    });

    it("Should reject oracle node update by non-owner", async function () {
      await expect(
        quantumOracle.connect(user1).updateOracleNode(user2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should allow owner to update fee", async function () {
      const newFee = ethers.utils.parseEther("0.02");

      await expect(quantumOracle.connect(owner).updateFee(newFee))
        .to.emit(quantumOracle, "FeeUpdated")
        .withArgs(REQUEST_FEE, newFee);

      expect(await quantumOracle.fee()).to.equal(newFee);
    });

    it("Should reject fee update by non-owner", async function () {
      const newFee = ethers.utils.parseEther("0.02");

      await expect(
        quantumOracle.connect(user1).updateFee(newFee)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});
