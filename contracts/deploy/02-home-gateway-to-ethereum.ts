import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

enum HomeChains {
  ARBITRUM_ONE = 42161,
  ARBITRUM_GOERLI = 421613,
}

// TODO: use deterministic deployments

const deployHomeGateway: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const deployer = (await getNamedAccounts()).deployer ?? (await hre.ethers.getSigners())[0].address;
  const chainId = Number(await getChainId());
  console.log("Deploying to chainId %s with deployer %s", chainId, deployer);

  const veaInbox = await deployments.get("VeaInboxArbToEthDevnet");
  const klerosCore = await deployments.get("KlerosCore");

  const foreignGateway = await hre.companionNetworks.foreignGoerli.deployments.get("ForeignGatewayOnEthereum");
  const foreignChainId = Number(await hre.companionNetworks.foreignGoerli.getChainId());
  const foreignChainName = await hre.companionNetworks.foreignGoerli.deployments.getNetworkName();
  console.log("Using ForeignGateway %s on chainId %s (%s)", foreignGateway.address, foreignChainId, foreignChainName);

  await deploy("HomeGatewayToEthereum", {
    from: deployer,
    contract: "HomeGateway",
    args: [
      deployer,
      klerosCore.address,
      veaInbox.address,
      foreignChainId,
      foreignGateway.address,
      ethers.constants.AddressZero, // feeToken is ETH
    ],
    log: true,
  }); // nonce+0
};

deployHomeGateway.tags = ["HomeGatewayToEthereum"];
deployHomeGateway.skip = async ({ getChainId }) => {
  const chainId = Number(await getChainId());
  return !HomeChains[chainId];
};

export default deployHomeGateway;
