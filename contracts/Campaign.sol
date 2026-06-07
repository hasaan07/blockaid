// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Campaign
 * @notice Single fundraising campaign with escrow logic.
 *
 * Lifecycle:
 *   Active  -> donate() while now < deadline
 *   Funded  -> reached when receivedAmount >= goalAmount (still during active period or after)
 *   Expired -> deadline passed and goal NOT met -> contributors can refund
 *
 * Fund handling:
 *   - donate()   : payable; only while Active; tracks per-contributor balance.
 *   - withdraw() : creator only; only if goal met; transfers entire balance to creator.
 *   - refund()   : contributor only; only if Expired (deadline passed, goal not met);
 *                  pull-based, each contributor claims their own contribution.
 *
 * Security:
 *   - ReentrancyGuard on withdraw() and refund() (external calls send native token).
 *   - State changes happen BEFORE the external call (Checks-Effects-Interactions pattern).
 *   - No admin pause, no owner-set-deadline mid-flight — once deployed, rules are fixed.
 */
contract Campaign is ReentrancyGuard {
  // -------- Storage --------
  address public immutable creator;
  string public title;
  uint256 public immutable goalAmount;
  uint256 public immutable deadline; // Unix timestamp
  uint256 public receivedAmount;
  bool public withdrawn;

  // Per-contributor donation balances (used for refunds).
  mapping(address => uint256) public contributions;
  address[] public contributors;
  mapping(address => bool) private hasContributed; // tracks first-time donor

  // -------- Events --------
  event Donated(address indexed contributor, uint256 amount, uint256 newTotal);
  event Withdrawn(address indexed creator, uint256 amount);
  event Refunded(address indexed contributor, uint256 amount);

  // -------- Constructor --------
  constructor(address _creator, string memory _title, uint256 _goalAmount, uint256 _deadline) {
    require(_creator != address(0), "Creator cannot be zero address");
    require(_goalAmount > 0, "Goal must be > 0");
    require(_deadline > block.timestamp, "Deadline must be in the future");

    creator = _creator;
    title = _title;
    goalAmount = _goalAmount;
    deadline = _deadline;
  }

  // -------- Public actions --------

  /**
   * @notice Donate native token (POL) to this campaign.
   * @dev Funds are held in the contract until withdraw() or refund().
   */
  function donate() external payable {
    require(block.timestamp < deadline, "Campaign has ended");
    require(msg.value > 0, "Donation must be > 0");

    if (!hasContributed[msg.sender]) {
      hasContributed[msg.sender] = true;
      contributors.push(msg.sender);
    }

    contributions[msg.sender] += msg.value;
    receivedAmount += msg.value;

    emit Donated(msg.sender, msg.value, receivedAmount);
  }

  /**
   * @notice Creator withdraws all funds once goal is met.
   * @dev Can be called at any time after the goal is reached (does NOT require deadline to pass).
   */
  function withdraw() external nonReentrant {
    require(msg.sender == creator, "Only creator can withdraw");
    require(receivedAmount >= goalAmount, "Goal not reached");
    require(!withdrawn, "Already withdrawn");

    withdrawn = true;
    uint256 amount = address(this).balance;

    (bool success, ) = payable(creator).call{value: amount}("");
    require(success, "Withdraw transfer failed");

    emit Withdrawn(creator, amount);
  }

  /**
   * @notice Contributor claims their refund if the campaign expired without reaching its goal.
   * @dev Pull-based: each contributor calls this themselves.
   */
  function refund() external nonReentrant {
    require(block.timestamp >= deadline, "Deadline has not passed");
    require(receivedAmount < goalAmount, "Goal was reached, no refunds");
    require(!withdrawn, "Funds already withdrawn");

    uint256 amount = contributions[msg.sender];
    require(amount > 0, "No contribution to refund");

    // Effects before interaction (CEI pattern).
    contributions[msg.sender] = 0;

    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Refund transfer failed");

    emit Refunded(msg.sender, amount);
  }

  // -------- Views --------

  /**
   * @notice Returns the campaign state as a string label for frontend convenience.
   * @dev State is derived from on-chain values, not stored, so it's always fresh.
   */
  function status() external view returns (string memory) {
    if (withdrawn) return "Withdrawn";
    if (receivedAmount >= goalAmount) return "Funded";
    if (block.timestamp >= deadline) return "Expired";
    return "Active";
  }

  function contributorCount() external view returns (uint256) {
    return contributors.length;
  }

  /**
   * @notice Returns a quick summary of campaign state for the frontend.
   */
  function summary()
    external
    view
    returns (
      address _creator,
      string memory _title,
      uint256 _goalAmount,
      uint256 _deadline,
      uint256 _receivedAmount,
      bool _withdrawn,
      uint256 _contributorCount
    )
  {
    return (creator, title, goalAmount, deadline, receivedAmount, withdrawn, contributors.length);
  }
}
