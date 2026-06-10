// solidity-coverage configuration.
// Exclude test-only helper contracts from the coverage report so the numbers
// reflect production code (contracts deployed to mainnet) only.
module.exports = {
  skipFiles: ["test/RPSLogicHarness.sol"],
};
