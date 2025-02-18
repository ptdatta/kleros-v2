import hre = require("hardhat");
import relayer from "./disputeRelayerBot";
import { HttpNetworkConfig } from "hardhat/types";

async function main() {
  await relayer(
    hre.config.networks.goerli as HttpNetworkConfig,
    hre.companionNetworks.foreignGoerli.deployments,
    "ForeignGatewayOnEthereum",
    "HomeGatewayToEthereum"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
