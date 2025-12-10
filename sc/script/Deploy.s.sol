// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/SupplyChain.sol";

contract DeploySupplyChain is Script {
    function run() external {
        // Cargar la clave privada desde variables de entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Iniciar la transacción con la cuenta del deployer
        vm.startBroadcast(deployerPrivateKey);

        // Desplegar el contrato
        SupplyChain supplyChain = new SupplyChain();

        // Mostrar la dirección del contrato en la consola
        console.log("SupplyChain deployed at:", address(supplyChain));

        vm.stopBroadcast();
    }
}