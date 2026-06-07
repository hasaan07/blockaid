// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Campaign.sol";

/**
 * @title CampaignFactory
 * @notice Single long-lived contract that deploys child Campaign contracts and tracks them.
 *
 * Frontend flow:
 *   1. Creator clicks "Publish Campaign" in the UI.
 *   2. Frontend calls factory.createCampaign(title, goal, deadline).
 *   3. Factory deploys a new Campaign contract and records its address.
 *   4. Frontend reads the CampaignCreated event to get the new address,
 *      then stores the address in MongoDB alongside off-chain metadata.
 */
contract CampaignFactory {
  // Every campaign ever created (addresses only).
  address[] public deployedCampaigns;

  // Creator -> their campaigns, for "My Campaigns" page.
  mapping(address => address[]) public campaignsByCreator;

  event CampaignCreated(
    address indexed campaignAddress,
    address indexed creator,
    string title,
    uint256 goalAmount,
    uint256 deadline
  );

  /**
   * @notice Deploys a new Campaign contract owned by msg.sender.
   * @param title       Human-readable campaign title (also stored off-chain).
   * @param goalAmount  Funding goal in wei (smallest unit of POL).
   * @param deadline    Unix timestamp at which donations close.
   * @return            Address of the deployed Campaign contract.
   */
  function createCampaign(
    string memory title,
    uint256 goalAmount,
    uint256 deadline
  ) external returns (address) {
    Campaign newCampaign = new Campaign(msg.sender, title, goalAmount, deadline);
    address newAddress = address(newCampaign);

    deployedCampaigns.push(newAddress);
    campaignsByCreator[msg.sender].push(newAddress);

    emit CampaignCreated(newAddress, msg.sender, title, goalAmount, deadline);
    return newAddress;
  }

  function getDeployedCampaigns() external view returns (address[] memory) {
    return deployedCampaigns;
  }

  function getCampaignsByCreator(address creator) external view returns (address[] memory) {
    return campaignsByCreator[creator];
  }

  function campaignCount() external view returns (uint256) {
    return deployedCampaigns.length;
  }
}

//
