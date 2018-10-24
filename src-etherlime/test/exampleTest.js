
const CryptoCars = require('../build/CryptoCars.json');
const etherlime = require('etherlime');

describe('CryptoCars', () => {
    let owner = accounts[0];
    let notOwner = accounts[1];

    let deployer;
    let provider;
    let deployedContractWrapper;
    let contract;

    let port = 8545;
    let defaultOverrideOptions = {
        gasLimit: 4000000
    }

    const ONE_ETHER = ethers.utils.bigNumberify('1000000000000000000');
    const PROFIT_RE_SELL_FIRST_OWNER = ethers.utils.bigNumberify('-250000000000000000');
    const ONE_AND_A_HALF_ETHER = ethers.utils.bigNumberify('1500000000000000000');
    const TWO_ETHER = ethers.utils.bigNumberify('1000000000000000000');

    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey, port, defaultOverrideOptions);
        provider = deployer.provider;
        deployedContractWrapper = await deployer.deploy(CryptoCars);
        contract = deployedContractWrapper.contract;
    });

/*    describe('initialization', () => {

        it('should initialize contract with correct values', async () => {
            let _price = await contract.price();
            let _owner = await contract.owner();
            let _billboardOwner = await contract.billboardOwner();
            let _historyLength = await contract.historyLength();
            let _slogan  = await contract.slogan();
            let _contractBalance = await provider.getBalance(contract.address);

            assert(_price.eq(ONE_ETHER), 'Initial price should be 1 ether');
            assert.strictEqual(_owner, owner.wallet.address, 'Initial contract owner does not match');
            assert(ethers.utils.bigNumberify(_billboardOwner).isZero(), 'Initial billboard owner should not be set');
            assert.strictEqual(_historyLength.toNumber(), 0, 'Initial history of owners should be empty');
            assert.strictEqual(_slogan, '', 'Initial slogan should be empty');
            assert(ethers.utils.bigNumberify(_contractBalance).isZero(), 'Initial contract balance should be empty');
        });

    });*/

async function commonEventCheck(tx, modelName, expectedPrice, expectedBuyer) {
  let txReceipt = await provider.getTransactionReceipt(tx.hash);

  // check for event
  let isEmitted = utils.hasEvent(txReceipt, contract, 'CarBought');

  assert(isEmitted, 'Event CarBought not emitted');

  // parse logs
  let logs = utils.parseLogs(txReceipt, contract, 'CarBought');

  // check log details
  assert(ethers.utils.bigNumberify(logs.length).eq('1'));
  assert.strictEqual(logs[0].buyer, expectedBuyer, "Buyer does not match");
  assert(ethers.utils.bigNumberify(logs[0].paid).eq(expectedPrice), "Paid amount ethers does not match");
  assert.strictEqual(logs[0].model, modelName, "Model name does not match");
}
    describe('buy', () => {

        let modelName = 'Sample Name';

        it('should buy successfully initially and check event', async () => {
            let tx = await contract.buy(modelName, {value: ONE_ETHER});

            let carForOwner = await contract.ownerToCars(owner.wallet.address, 0);

            assert.strictEqual(carForOwner, modelName, 'Car not correctly marked as bought for owner');

            let registeredCar = await contract.carInfo(modelName);
            assert.strictEqual(registeredCar.ownerAddress, owner.wallet.address, 'Car owner not set correctly');

            await commonEventCheck(tx, modelName, ONE_ETHER, owner.wallet.address);

        });

        it('should re-sell successfully and check event', async () => {
          let _newOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
          let _contract = new ethers.Contract(contract.address, CryptoCars.abi, _newOwnerWallet);

          // First do the initial buy through the account of the first owner
          await contract.buy(modelName, {value: ONE_ETHER});
          let tx = await _contract.buy(modelName, {value: ONE_AND_A_HALF_ETHER });

          let carsOldOwner =  await _contract.getCarsCountOfOwner(owner.wallet.address);

          assert(0 == carsOldOwner);

          let carForOwner = await _contract.ownerToCars(_newOwnerWallet.address, 0);
          assert.strictEqual(carForOwner, modelName, 'Car not correctly marked as bought for owner. Second hand.');

          let registeredCar = await _contract.carInfo(modelName);
          assert.strictEqual(registeredCar.ownerAddress, _newOwnerWallet.address, 'New car owner not set correctly after re-sell.');

          await commonEventCheck(tx, modelName, ONE_AND_A_HALF_ETHER, _newOwnerWallet.address);

          let newOwnerSpent = await _contract.moneySpent(_newOwnerWallet.address);
          assert(ethers.utils.bigNumberify(newOwnerSpent).eq(ONE_AND_A_HALF_ETHER));

          let oldOwnerSpent = await _contract.moneySpent(owner.wallet.address);
          assert(ethers.utils.bigNumberify(oldOwnerSpent).eq(PROFIT_RE_SELL_FIRST_OWNER));
        });

        it('should throw if transferred ethers are not enough', async () => {
            assert.revert(contract.buy(modelName, {value: 1000}));
        });

    });

    describe('withdraw', () => {

        let modelName = 'Sample Name';

        it('should withdraw successfully', async () => {
            await contract.buy(modelName, {value: ONE_ETHER});

            let _contractBalance = await provider.getBalance(contract.address);
            assert(_contractBalance.eq(ONE_ETHER), 'Contract balance does not match before withdraw');

            await contract.withdraw(defaultOverrideOptions);

            let contractBalance = await provider.getBalance(contract.address);
            assert.strictEqual(contractBalance.toNumber(), 0, 'Contract balance does not match after withdrawal');
        });

        it('should withdraw successfully and check event', async () => {
            await contract.buy(modelName, {value: ONE_ETHER});

            let tx = await contract.withdraw(defaultOverrideOptions);

            let txReceipt = await provider.getTransactionReceipt(tx.hash);

            // check for event
            let isEmitted = utils.hasEvent(txReceipt, contract, 'LogWithdrawal');

            assert(isEmitted, 'Event LogWithdrawal not emitted');

            // parse logs
            let logs = utils.parseLogs(txReceipt, contract, 'LogWithdrawal');

            // check log details
            assert(ethers.utils.bigNumberify(logs[0].amount).eq(ONE_ETHER), "Amount does not match");
            assert(!ethers.utils.bigNumberify(logs[0].timestamp).isZero(), "Timestamp should be set");
        });

        it('should throw trying to withraw when balance is empty', async () => {
            assert.revert(contract.withdraw());
        });

        it('should throw when non-authorized user tries to withdraw', async () => {
            let _notOwnerWallet = new ethers.Wallet(notOwner.secretKey, provider);
            let _contract = new ethers.Contract(contract.address, CryptoCars.abi, _notOwnerWallet);
            assert.revert(_contract.withdraw());
        });

    });

});
