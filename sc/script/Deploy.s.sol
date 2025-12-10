// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/SupplyChain.sol";

contract DeploySupplyChain is Script {
    // funcion de ejecucion del script 
    function run() external {
        // Cargar la clave privada desde variables de entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Iniciar la transacción con la cuenta del deployer
        // Apartir de aqui todas las transacciones deben ser firmadas por la cuenta cuya clave privada se acaba de proporcionar
        vm.startBroadcast(deployerPrivateKey);

        // Desplegar el contrato, se envia el bytecode
        SupplyChain supplyChain = new SupplyChain();

        // Mostrar la dirección del contrato en la consola
        console.log("SupplyChain deployed at:", address(supplyChain));

        vm.stopBroadcast(); // Graba los resultados en la carpeta broadcast
    }
}