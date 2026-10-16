// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for standard ERC20 operations
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title PaymentLink
 * @notice Lets merchants create secure, tamper-proof payment requests in native BOT or ERC20 tokens.
 * Customers pay via a shareable link. The contract strictly binds each request to its intended recipient
 * and amount, preventing alterations and unauthorized duplicate payments.
 */
contract PaymentLink {
    // Reentrancy guard state
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    struct PaymentRequest {
        bytes32 id;
        address merchant;
        address payable recipient;
        address token; // address(0) for Native BOT
        uint256 amount;
        uint256 expiry; // 0 = no expiration, unix timestamp
        bool isReusable;
        uint32 maxUses; // 0 = unlimited for reusable, or exact cap (1 for single-use)
        uint32 paidCount;
        uint256 totalPaidAmount;
        bool isCancelled;
        string paymentRef; // Invoice ID, memo, order reference
        uint256 createdAt;
    }

    struct Receipt {
        bytes32 linkId;
        address payer;
        uint256 amount;
        uint256 timestamp;
        string payerNote;
    }

    // Mapping from link ID to payment request details
    mapping(bytes32 => PaymentRequest) public paymentLinks;

    // Mapping from link ID to array of receipts
    mapping(bytes32 => Receipt[]) private _linkReceipts;

    // List of link IDs created by a merchant
    mapping(address => bytes32[]) private _merchantLinks;

    // Global list of all link IDs for indexing/discovery
    bytes32[] public allLinkIds;

    // Nonce counter per merchant to guarantee unique deterministic IDs
    mapping(address => uint256) public merchantNonces;

    // Events
    event PaymentLinkCreated(
        bytes32 indexed linkId,
        address indexed merchant,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 expiry,
        bool isReusable,
        uint32 maxUses,
        string paymentRef,
        uint256 createdAt
    );

    event PaymentCompleted(
        bytes32 indexed linkId,
        address indexed payer,
        address indexed recipient,
        address token,
        uint256 amount,
        uint32 paymentIndex,
        uint256 timestamp,
        string paymentRef,
        string payerNote
    );

    event PaymentLinkCancelled(
        bytes32 indexed linkId,
        address indexed merchant,
        uint256 timestamp
    );

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Creates a new bound payment link
     * @param recipient The address that receives the funds upon payment
     * @param token Address of ERC20 token, or address(0) for native BOT
     * @param amount Required payment amount
     * @param expiry Unix timestamp after which link cannot be paid (0 for no expiry)
     * @param isReusable False for single-use, true for reusable
     * @param maxUses Maximum number of payments allowed (1 for single use; 0 for unlimited reusable)
     * @param paymentRef Invoice ID, memo or order description
     * @return linkId Unique identifier for the created payment link
     */
    function createPaymentLink(
        address payable recipient,
        address token,
        uint256 amount,
        uint256 expiry,
        bool isReusable,
        uint32 maxUses,
        string calldata paymentRef
    ) external returns (bytes32 linkId) {
        require(recipient != address(0), "PaymentLink: invalid recipient");
        require(amount > 0, "PaymentLink: amount must be > 0");

        if (expiry > 0) {
            require(expiry > block.timestamp, "PaymentLink: expiry must be in future");
        }

        uint32 enforcedMaxUses = maxUses;
        if (!isReusable) {
            enforcedMaxUses = 1;
        }

        uint256 nonce = merchantNonces[msg.sender]++;
        linkId = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                msg.sender,
                recipient,
                token,
                amount,
                nonce,
                block.timestamp
            )
        );

        PaymentRequest storage request = paymentLinks[linkId];
        require(request.id == bytes32(0), "PaymentLink: link already exists");

        request.id = linkId;
        request.merchant = msg.sender;
        request.recipient = recipient;
        request.token = token;
        request.amount = amount;
        request.expiry = expiry;
        request.isReusable = isReusable;
        request.maxUses = enforcedMaxUses;
        request.paidCount = 0;
        request.totalPaidAmount = 0;
        request.isCancelled = false;
        request.paymentRef = paymentRef;
        request.createdAt = block.timestamp;

        _merchantLinks[msg.sender].push(linkId);
        allLinkIds.push(linkId);

        emit PaymentLinkCreated(
            linkId,
            msg.sender,
            recipient,
            token,
            amount,
            expiry,
            isReusable,
            enforcedMaxUses,
            paymentRef,
            block.timestamp
        );
    }

    /**
     * @notice Pay a specific payment link
     * @param linkId The identifier of the payment link
     * @param payerNote Optional customer note/receipt memo
     */
    function pay(bytes32 linkId, string calldata payerNote) external payable nonReentrant {
        PaymentRequest storage link = paymentLinks[linkId];
        require(link.id != bytes32(0), "PaymentLink: does not exist");
        require(!link.isCancelled, "PaymentLink: link is cancelled");

        if (link.expiry > 0) {
            require(block.timestamp <= link.expiry, "PaymentLink: link has expired");
        }

        if (!link.isReusable) {
            require(link.paidCount == 0, "PaymentLink: single-use link already paid");
        } else if (link.maxUses > 0) {
            require(link.paidCount < link.maxUses, "PaymentLink: max payments reached");
        }

        uint256 requiredAmount = link.amount;
        address payable destination = link.recipient;

        link.paidCount += 1;
        link.totalPaidAmount += requiredAmount;

        // Process payment transfer directly to the bound recipient
        if (link.token == address(0)) {
            // Native BOT payment
            require(msg.value == requiredAmount, "PaymentLink: incorrect native BOT value sent");
            (bool success, ) = destination.call{value: msg.value}("");
            require(success, "PaymentLink: native transfer failed");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "PaymentLink: native BOT not expected for ERC20 payment");
            bool success = IERC20(link.token).transferFrom(msg.sender, destination, requiredAmount);
            require(success, "PaymentLink: ERC20 transfer failed");
        }

        // Store receipt
        _linkReceipts[linkId].push(Receipt({
            linkId: linkId,
            payer: msg.sender,
            amount: requiredAmount,
            timestamp: block.timestamp,
            payerNote: payerNote
        }));

        emit PaymentCompleted(
            linkId,
            msg.sender,
            destination,
            link.token,
            requiredAmount,
            link.paidCount,
            block.timestamp,
            link.paymentRef,
            payerNote
        );
    }

    /**
     * @notice Merchant cancels an active payment link
     * @param linkId The identifier of the payment link
     */
    function cancelPaymentLink(bytes32 linkId) external {
        PaymentRequest storage link = paymentLinks[linkId];
        require(link.id != bytes32(0), "PaymentLink: does not exist");
        require(msg.sender == link.merchant, "PaymentLink: unauthorized");
        require(!link.isCancelled, "PaymentLink: already cancelled");

        link.isCancelled = true;

        emit PaymentLinkCancelled(linkId, msg.sender, block.timestamp);
    }

    /**
     * @notice Checks if a link is currently payable
     */
    function isPayable(bytes32 linkId) external view returns (bool payableStatus, string memory reason) {
        PaymentRequest storage link = paymentLinks[linkId];
        if (link.id == bytes32(0)) {
            return (false, "Link not found");
        }
        if (link.isCancelled) {
            return (false, "Link is cancelled");
        }
        if (link.expiry > 0 && block.timestamp > link.expiry) {
            return (false, "Link is expired");
        }
        if (!link.isReusable && link.paidCount > 0) {
            return (false, "Single-use link already paid");
        }
        if (link.maxUses > 0 && link.paidCount >= link.maxUses) {
            return (false, "Maximum uses reached");
        }
        return (true, "Active");
    }

    /**
     * @notice Returns payment link details
     */
    function getPaymentLink(bytes32 linkId) external view returns (PaymentRequest memory) {
        PaymentRequest memory link = paymentLinks[linkId];
        require(link.id != bytes32(0), "PaymentLink: not found");
        return link;
    }

    /**
     * @notice Returns all receipts for a given link
     */
    function getReceipts(bytes32 linkId) external view returns (Receipt[] memory) {
        return _linkReceipts[linkId];
    }

    /**
     * @notice Returns list of link IDs created by a merchant
     */
    function getMerchantLinks(address merchant) external view returns (bytes32[] memory) {
        return _merchantLinks[merchant];
    }

    /**
     * @notice Returns total number of links created
     */
    function getTotalLinksCount() external view returns (uint256) {
        return allLinkIds.length;
    }
}
