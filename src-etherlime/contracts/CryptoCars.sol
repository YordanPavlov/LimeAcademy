pragma solidity ^0.4.24;

import '../../../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract CryptoCars is Ownable {

    struct CarDescription
    {
      uint256 price;
      address owner;
      uint posOwnerArray;
    }

    mapping(string => CarDescription ) private modelNameToDescr;
    mapping(address => string[] ) public ownerToCars;

    uint constant minInitialPrice = 1 ether;

    /**
     * events
     */

    event CarBought(address buyer, uint256 paid, string model);
    event LogWithdrawal(uint256 amount, uint256 timestamp);

    /**
     * functions
     */

    function eraseForOldOwner(address oldOwner,
                              uint position) private
    {
      require(ownerToCars[oldOwner].length > 0);

      uint lengthArray = ownerToCars[oldOwner].length;

      if(position < lengthArray -1 ) {
        ownerToCars[oldOwner][position] = ownerToCars[oldOwner][lengthArray - 1];
      }
      --ownerToCars[oldOwner].length;
    }

    function buy(string modelName) public payable {
        if(0 == modelNameToDescr[modelName].price) {
            // Initial buy
            require(msg.value >= minInitialPrice, "The ether sent was too low for initial buy");
        }
        else {
            // Re-sale
            require(msg.value >= modelNameToDescr[modelName].price * 3 / 2 , "The ether sent was too low for a re-sale");
            require(msg.sender != modelNameToDescr[modelName].owner , "Trying to re-sell a car to same user");
            
            eraseForOldOwner(modelNameToDescr[modelName].owner,
                             modelNameToDescr[modelName].posOwnerArray);
        }

        modelNameToDescr[modelName].price = msg.value;
        modelNameToDescr[modelName].owner = msg.sender;

        ownerToCars[msg.sender].push(modelName);
        modelNameToDescr[modelName].posOwnerArray = ownerToCars[msg.sender].length -1;

        emit CarBought(msg.sender, msg.value, modelName);
    }

    function carsByOwner(address owner) public view returns (uint) {
        return ownerToCars[owner].length;
    }

    function carInfo(string modelName) public view returns(address ownerAddress, uint256 price)
    {
        return (modelNameToDescr[modelName].owner, modelNameToDescr[modelName].price);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;

        require(balance > 0, "Contract balance is 0");

        owner.transfer(address(this).balance);

        emit LogWithdrawal(balance, now);
    }

}
