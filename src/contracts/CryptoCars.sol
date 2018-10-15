pragma solidity ^0.4.24;

contract Ownable {

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "This transaction was not sent by the owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }
}


contract CryptoCars is Ownable {

    struct CarDescription
    {
      uint256 price;
      address owner;
    }

    mapping(bytes32 => CarDescription ) public modelNameToDescr;
    mapping(address => bytes32[] ) public ownerToCars;

    uint constant minInitialPrice = 1 ether;

    /**
     * events
     */

    event CarBought(address buyer, uint256 paid, bytes32 model);
    event CarsByOwner(address owner, bytes32[] models);
    event LogWithdrawal(uint256 amount, uint256 timestamp);

    /**
     * modifiers
     */

    modifier onlyPositive(uint256 newPrice) {
        require(newPrice > 0, "The price cannot be 0");
        _;
    }

    /**
     * functions
     */

    function eraseForOldOwner(address oldOwner, bytes32 modelName) private
    {
      require(ownerToCars[oldOwner].length > 0);

      // TODO find out how to declare reference to array to spare typing
      for(uint8 index = 0; index < ownerToCars[oldOwner].length; ++index) {
        if(modelName == ownerToCars[oldOwner][index]) {
          if(index < ownerToCars[oldOwner].length -1 ) {
            ownerToCars[oldOwner][index] = ownerToCars[oldOwner][ownerToCars[oldOwner].length - 1];
          }
          --ownerToCars[oldOwner].length;
          break;
        }
      }
    }

    function buy(bytes32 modelName) public payable {
        if(0 == modelNameToDescr[modelName].price) {
            // Initial buy
            require(msg.value >= minInitialPrice, "The ether sent was too low for initial buy");
        }
        else {
            // Re-sale
            require(msg.value >= modelNameToDescr[modelName].price * 3 / 2 , "The ether sent was too low for a re-sale");
            eraseForOldOwner(modelNameToDescr[modelName].owner, modelName);
        }

        modelNameToDescr[modelName].price = msg.value;
        modelNameToDescr[modelName].owner = msg.sender;

        ownerToCars[msg.sender].push(modelName);

        emit CarBought(msg.sender, msg.value, modelName);
    }

    function carsByOwner(address owner) public view returns (bytes32[]) {
        return ownerToCars[owner];
    }

    function carInfo(bytes32 modelName) public view returns(address, uint256 price)
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
