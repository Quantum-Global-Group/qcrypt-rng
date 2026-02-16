// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title QuantumRandomnessOracle
 * @dev A decentralized oracle that provides verifiable quantum randomness
 *      to blockchain applications using a two-phase commit-reveal scheme.
 *
 *      Flow:
 *        1. User calls requestRandomness() and pays a fee.
 *        2. Oracle node generates quantum randomness off-chain, computes
 *           commitment = keccak256(abi.encodePacked(randomness)), and calls
 *           submitCommitment(requestId, commitment).
 *        3. After COMMIT_REVEAL_DELAY blocks the oracle calls
 *           fulfillRandomness(requestId, randomness) which verifies the
 *           preimage, stores the result, and invokes the requester callback.
 */
contract QuantumRandomnessOracle {
    struct Request {
        address requester;
        uint256 fee;
        bytes32 commitment; // keccak256(abi.encodePacked(randomness))
        uint256 blockNumber;
        uint256 commitBlock; // block at which commitment was submitted
        bool fulfilled;
        uint256 randomness;
        uint256 timestamp;
    }

    // State variables
    mapping(uint256 => Request) public requests;
    uint256 public requestCounter;
    address public owner;
    address public oracleNode;
    uint256 public fee;
    uint256 public constant FULFILLMENT_GAS_LIMIT = 200000;
    uint256 public constant COMMIT_REVEAL_DELAY = 2; // blocks between commit and reveal

    // Events
    event RandomnessRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 feePaid
    );

    event CommitmentSubmitted(
        uint256 indexed requestId,
        bytes32 commitment
    );

    event RandomnessFulfilled(
        uint256 indexed requestId,
        uint256 randomness,
        uint256 entropyBits
    );

    event OracleNodeUpdated(address indexed oldNode, address indexed newNode);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyOracleNode() {
        require(msg.sender == oracleNode, "Only oracle node can fulfill requests");
        _;
    }

    /**
     * @dev Constructor to initialize the contract
     * @param _fee The fee required to request randomness
     * @param _oracleNode The address of the oracle node
     */
    constructor(uint256 _fee, address _oracleNode) {
        owner = msg.sender;
        fee = _fee;
        oracleNode = _oracleNode;
        requestCounter = 0;
    }

    /**
     * @dev Request quantum randomness from the oracle
     * @return requestId The unique identifier for this request
     */
    function requestRandomness() external payable returns (uint256 requestId) {
        require(msg.value >= fee, "Insufficient fee paid");

        requestId = requestCounter++;
        requests[requestId] = Request({
            requester: msg.sender,
            fee: msg.value,
            commitment: bytes32(0),
            blockNumber: block.number,
            commitBlock: 0,
            fulfilled: false,
            randomness: 0,
            timestamp: block.timestamp
        });

        emit RandomnessRequested(requestId, msg.sender, msg.value);
        return requestId;
    }

    /**
     * @dev Phase 1 -- Submit a commitment (hash of the quantum randomness).
     *      Must be called before fulfillRandomness.
     * @param requestId The request ID to commit for
     * @param commitment keccak256(abi.encodePacked(randomness))
     */
    function submitCommitment(
        uint256 requestId,
        bytes32 commitment
    ) external onlyOracleNode {
        Request storage request = requests[requestId];
        require(request.requester != address(0), "Invalid request ID");
        require(!request.fulfilled, "Request already fulfilled");
        require(request.commitment == bytes32(0), "Commitment already submitted");

        request.commitment = commitment;
        request.commitBlock = block.number;

        emit CommitmentSubmitted(requestId, commitment);
    }

    /**
     * @dev Phase 2 -- Reveal the randomness and fulfill the request.
     *      The commitment must have been submitted at least COMMIT_REVEAL_DELAY
     *      blocks ago.
     * @param requestId The request ID to fulfill
     * @param randomness The quantum-generated randomness value
     */
    function fulfillRandomness(
        uint256 requestId,
        uint256 randomness
    ) external onlyOracleNode {
        Request storage request = requests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        require(request.requester != address(0), "Invalid request ID");
        require(request.commitment != bytes32(0), "Commitment not yet submitted");
        require(
            block.number >= request.commitBlock + COMMIT_REVEAL_DELAY,
            "Commit-reveal delay not elapsed"
        );

        // Verify the preimage matches the stored commitment
        require(
            keccak256(abi.encodePacked(randomness)) == request.commitment,
            "Commitment mismatch"
        );

        // Update request state
        request.randomness = randomness;
        request.fulfilled = true;

        // Deliver randomness to requester via callback
        (bool success, ) = request.requester.call{gas: FULFILLMENT_GAS_LIMIT}(
            abi.encodeWithSelector(this.receiveRandomness.selector, requestId, randomness)
        );

        // If the callback fails, refund the requester
        if (!success) {
            uint256 amountToTransfer = request.fee;
            (bool refundSuccess, ) = request.requester.call{value: amountToTransfer}("");
            require(refundSuccess, "Refund failed");
        }

        emit RandomnessFulfilled(requestId, randomness, 256);
    }

    /**
     * @dev Callback function to receive randomness
     * @param requestId The request ID
     * @param randomness The randomness value
     */
    function receiveRandomness(uint256 requestId, uint256 randomness) external {
        require(requests[requestId].requester == msg.sender, "Only requester can receive randomness");
    }

    /**
     * @dev Withdraw accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Update the oracle node address (owner only)
     * @param newOracleNode The new oracle node address
     */
    function updateOracleNode(address newOracleNode) external onlyOwner {
        require(newOracleNode != address(0), "Invalid oracle node address");
        address oldOracleNode = oracleNode;
        oracleNode = newOracleNode;
        emit OracleNodeUpdated(oldOracleNode, newOracleNode);
    }

    /**
     * @dev Update the request fee (owner only)
     * @param newFee The new fee amount
     */
    function updateFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = fee;
        fee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Get request details
     * @param requestId The request ID
     * @return Request struct containing all request details
     */
    function getRequest(uint256 requestId) external view returns (Request memory) {
        return requests[requestId];
    }

    /**
     * @dev Check if a request is fulfilled
     * @param requestId The request ID
     * @return true if fulfilled, false otherwise
     */
    function isRequestFulfilled(uint256 requestId) external view returns (bool) {
        return requests[requestId].fulfilled;
    }

    /**
     * @dev Get the current contract balance
     * @return The contract's ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
