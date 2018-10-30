declare let require: any;
import { Component } from '@angular/core';
import * as ethers from 'ethers';
const CryptoCars = require('./contract_interfaces/CryptoCars.json');

@Component({
  selector: 'dapp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {

  public address: string;
  public currentBlock: number;
  public listCars: Array<string> = [];
  public listCarsString: string = null;
  public carBoughtString: string = null;
  public moneySpent: number;
  public carInfoString: string = null;
  public walletPrivateKey: string = null;
  public walletConnectedString: string = null;
  public infuraApiKey = 'a082b43a140345eebfb45c70061838c1';
  public infuraProvider: ethers.providers.InfuraProvider;
  public contractAddress = '0x3c724305Cbd0227aDED6D4055B966c5AbA1BBD66';
  private EthersToWei = 1000000000000000000;

  public deployedContract: ethers.Contract;
  public connectedContract: ethers.Contract = null;
  public wallet: ethers.Wallet = null;

  constructor() {
    this.infuraProvider = new ethers.providers.InfuraProvider('ropsten', this.infuraApiKey);
    this.infuraProvider.on('block', blockNumber => {
      this.currentBlock = blockNumber;
    });
    this.deployedContract = new ethers.Contract(this.contractAddress, CryptoCars.abi, this.infuraProvider);

    this.deployedContract.on("CarBought", (buyer, paid, model) => {
      // TODO add this check as filter to the event
      if(this.wallet && this.wallet.address == buyer) {
          this.carBoughtString = "Buyer " + buyer + " bought " + model + " for " + paid;
          console.log(this.carBoughtString);
      }


    });

  }

  public async getCurrentBlock() {
    this.currentBlock = await this.infuraProvider.getBlockNumber();
  }

  public async getListCars(address) {
    const carsOfOwner = await this.deployedContract.getCarsCountOfOwner(address);

    console.log("Owner " + address + " has " + carsOfOwner +  " cars")
    for(let count = 0; count < carsOfOwner; ++count) {
      let currentCar = await this.deployedContract.ownerToCars(address, count);
      console.log("Car " + count + " resolved as: " + currentCar)
      this.listCars.push( currentCar );
      if(this.listCarsString) {
        this.listCarsString = this.listCarsString + ", " + currentCar;
      }
      else {
          this.listCarsString = currentCar;
      }
    }
  }

  /*public async getTransactionHash(transactionHash) {
    const transaction = await this.infuraProvider.getTransactionReceipt(transactionHash);
    console.log(transaction);
  }*/

  public async moneySpentByAddress(address) {
    this.moneySpent = await this.deployedContract.moneySpent(address);
    console.log(this.moneySpent);
  }

  public async carInfo(modelName) {
    let carInfo = await this.deployedContract.carInfo(modelName);

    this.carInfoString = "The car is owned by " + carInfo.ownerAddress +
    " who paid " + carInfo.price.toNumber().toString() + " wei";
  }

  public async buyCar(modelName, priceETH) {
    let tx = await this.connectedContract.buy(modelName, {value :priceETH * this.EthersToWei});

console.log("tx return value is: ")
console.log(tx)

    const receipt = await this.wallet.provider.getTransactionReceipt(tx.hash);


    console.log(receipt);

  }

  public async connectWallet() {
    this.wallet = new ethers.Wallet(this.walletPrivateKey, this.infuraProvider);
    this.connectedContract = this.deployedContract.connect(this.wallet);
    this.walletConnectedString = "Wallet with address: " + this.wallet.address + " is now connected";
  }

}
