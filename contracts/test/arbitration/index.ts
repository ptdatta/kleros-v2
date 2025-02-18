import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import getContractAddress from "../../deploy-helpers/getContractAddress";

const ONE_ETH = BigNumber.from(10).pow(18);
const WINNER_STAKE_MULTIPLIER = 3000;
const LOSER_STAKE_MULTIPLIER = 7000;
const MULTIPLIER_DENOMINATOR = 10000;
const LOOKAHEAD = 20;

describe("DisputeKitClassic", async () => {
  // eslint-disable-next-line no-unused-vars
  let deployer;
  let core, disputeKit;

  before("Deploying", async () => {
    [deployer] = await ethers.getSigners();
    [core, disputeKit] = await deployContracts(deployer);
  });

  it("Kleros Core initialization", async () => {
    let events = await core.queryFilter(core.filters.DisputeKitCreated());
    expect(events.length).to.equal(1);
    expect(events[0].args._disputeKitID).to.equal(1);
    expect(events[0].args._disputeKitAddress).to.equal(disputeKit.address);
    expect(events[0].args._parent).to.equal(0);

    // Reminder: the Forking court will be added which will break these expectations.
    events = await core.queryFilter(core.filters.CourtCreated());
    expect(events.length).to.equal(1);
    expect(events[0].args._courtID).to.equal(1);
    expect(events[0].args._parent).to.equal(0);
    expect(events[0].args._hiddenVotes).to.equal(false);
    expect(events[0].args._minStake).to.equal(200);
    expect(events[0].args._alpha).to.equal(10000);
    expect(events[0].args._feeForJuror).to.equal(100);
    expect(events[0].args._jurorsForCourtJump).to.equal(3);
    expect(events[0].args._timesPerPeriod).to.deep.equal([
      ethers.constants.Zero,
      ethers.constants.Zero,
      ethers.constants.Zero,
      ethers.constants.Zero,
    ]);
    expect(events[0].args._supportedDisputeKits).to.deep.equal([]);

    events = await core.queryFilter(core.filters.DisputeKitEnabled());
    expect(events.length).to.equal(1);
    expect(events[0].args._courtID).to.equal(1);
    expect(events[0].args._disputeKitID).to.equal(1);
    expect(events[0].args._enable).to.equal(true);
  });

  it("Should create a dispute", async () => {
    await expect(disputeKit.connect(deployer).createDispute(0, 0, 3, "0x00")).to.be.revertedWith(
      "Access not allowed: KlerosCore only."
    );

    const tx = await core.connect(deployer).functions["createDispute(uint256,bytes)"](2, "0x00", { value: 1000 });
    expect(tx).to.emit(core, "DisputeCreation").withArgs(0, deployer.address);
    expect(tx).to.emit(disputeKit, "DisputeCreation").withArgs(0, 2, "0x00");

    await disputeKit.disputes(0).then((disputes) => {
      expect(BigNumber.from(Object.values(disputes)[0])).to.equal(2);
    });

    console.log(`choice 0: ${await disputeKit.getRoundInfo(0, 0, 0)}`);
    console.log(`choice 1: ${await disputeKit.getRoundInfo(0, 0, 1)}`);
    console.log(`choice 2: ${await disputeKit.getRoundInfo(0, 0, 2)}`);
  });
});

async function deployContracts(deployer) {
  const rngFactory = await ethers.getContractFactory("BlockHashRNG", deployer);
  const rng = await rngFactory.deploy();
  await rng.deployed();

  const disputeKitFactory = await ethers.getContractFactory("DisputeKitClassic", deployer);
  const disputeKit = await disputeKitFactory.deploy(
    deployer.address,
    ethers.constants.AddressZero // KlerosCore is set later once it is deployed
  );
  await disputeKit.deployed();
  let nonce;
  nonce = await deployer.getTransactionCount();
  nonce += 1;
  const KlerosCoreAddress = getContractAddress(deployer.address, nonce);

  const sortitionModuleFactory = await ethers.getContractFactory("SortitionModule", deployer);
  const sortitionModule = await sortitionModuleFactory.deploy(
    deployer.address,
    KlerosCoreAddress,
    120,
    120,
    rng.address,
    LOOKAHEAD
  ); // minStakingTime, maxFreezingTime

  const klerosCoreFactory = await ethers.getContractFactory("KlerosCore", {
    signer: deployer,
  });
  const core = await klerosCoreFactory.deploy(
    deployer.address,
    ethers.constants.AddressZero, // should be an ERC20
    ethers.constants.AddressZero, // should be a Juror Prosecution module
    disputeKit.address,
    false,
    [200, 10000, 100, 3],
    [0, 0, 0, 0],
    0xfa,
    sortitionModule.address
  );
  await core.deployed();

  await disputeKit.changeCore(core.address);

  return [core, disputeKit];
}
