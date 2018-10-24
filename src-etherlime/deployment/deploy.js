
const etherlime = require('etherlime');
const LimeFactory = require('../build/LimeFactory.json');
const CryptoCars = require('../build/CryptoCars.json');


	deploy = async (network, secret) => {
		if (typeof secret !== 'undefined') {
				console.log("Deploying to network " + network + " with secret " + secret)
			//deploy our smart contract on Remote Test Net using Ufura Service!
			const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, 'a082b43a140345eebfb45c70061838c1');
			const estimateGas = await deployer.estimateGas(CryptoCars);
			console.log(estimateGas);
			const contractWrapper = await deployer.deploy(CryptoCars);
			const setPriceInitialtransaction = await contractWrapper.contract.setPrice(50);
			await contractWrapper.verboseWaitForTransaction(setPriceInitialtransaction, 'Initial Set Price Transaction');
		}
		else {
			console.log("Deploying to local network ")
				deploy = async () => {
				//deploy our smart contracts on Etherlime Ganache Local Node!
				const deployer = new etherlime.EtherlimeGanacheDeployer();
				const result = await deployer.deploy(LimeFactory);
			  const billboardContractResult = await deployer.deploy(CryptoCars);
			};
		}
	};



module.exports = {
	deploy
};
