
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public supplyChain;
    address admin;
    address producer = address(0x1);
    address factory = address(0x2);
    address retailer = address(0x3);
    address consumer = address(0x4);

    // Inicializa todo lo necesario para los casos de prueba 
    function setUp() public {
        admin = address(this);
        supplyChain = new SupplyChain();
        // Registrar usuarios
        vm.prank(producer); // Le dice a la máquina virtual que la siguiente llamada de función debe simularse como si viniera de la dirección producer
        supplyChain.requestUserRole("Producer");
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");

        // Aprobar roles
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
    }

    // ---------------- Tests de gestión de usuarios ----------------
    // Define un caso de prueba para un realizar un registro de nuevo usuario y dejandolo en estatus pendinete
    function testUserRegistration() public {
        vm.prank(address(0x5));
        supplyChain.requestUserRole("Producer");
        SupplyChain.User memory user = supplyChain.getUserInfo(address(0x5));
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Pending));
    }

    //registrar un nuevo usuario y que posteriormente sea aprobado
    function testAdminApproveUser() public {
        vm.prank(address(0x6));
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(address(0x6), SupplyChain.UserStatus.Approved); // como no hay v.prank el msg.sender es el contrato de prueba(admin)
        SupplyChain.User memory user = supplyChain.getUserInfo(address(0x6));
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Approved));
    }

    // valida la funcion para validar los permisos d eun admin
    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
    }

    // ---------------- Tests de creación de tokens ----------------
    // verifica que un usuario autorizado (producer) puede crear un nuevo Token y que se le asigna correctamente la propiedad inicial.
    function testCreateTokenByProducer() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        (uint id,, string memory name,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, unicode"Maíz");
        assertEq(supplyChain.getTokenBalance(1, producer), 100);
    }

    // verifica que se pueden crear Tokens derivados que referencian a un Token padre
    // es util para saber que el maiz se convirtio en harina por ejemplo.
    function testTokenWithParentId() public {
        vm.startPrank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        supplyChain.createToken("Harina", 50, '{"processed":"yes"}', 1);
        vm.stopPrank();
        (,, string memory name,,,,) = supplyChain.getToken(2);
        assertEq(name, "Harina");
    }

    // ---------------- Tests de transferencias ----------------
    // verifica que un usuario puede solicitar una transferencia y que esta queda correctamente registrada en estado pendiente
    function testTransferFromProducerToFactory() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        SupplyChain.Transfer memory t = supplyChain.getTransfer(1);
        assertEq(t.amount, 50);
        assertEq(uint(t.status), uint(SupplyChain.TransferStatus.Pending));
    }

    //verifica que el destinatario puede aceptar una transferencia pendiente y que esta acción actualiza correctamente los saldos de los dos usuarios
    function testAcceptTransfer() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        assertEq(supplyChain.getTokenBalance(1, factory), 50);
    }

    //verifica que el destinatario puede rechazar una transferencia pendiente y que el sistema registra ese estado sin afectar los saldos del activo
    function testRejectTransfer() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
        SupplyChain.Transfer memory t = supplyChain.getTransfer(1);
        assertEq(uint(t.status), uint(SupplyChain.TransferStatus.Rejected));
    }

    //verifica que la función de trasnfer falla correctamente (revierte) si el remitente intenta enviar más activos de los que posee.
    function testTransferInsufficientBalance() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.expectRevert();  // se le indica que la siguiente instruccion falle y revierta la transaccion 
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200); // aqui revierte
    }

    // ---------------- Tests de permisos ----------------
    // verifica que un usuario que no ha sido aprobado por el administrador no puede realizar una acción crítica en el contrato, como crear un activo
    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(address(0x7));
        vm.expectRevert();
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
    }

    //verifica que las acciones administrativas críticas, como cambiar el estado de un usuario, están estrictamente reservadas para la dirección del administrador
    function testOnlyAdminCanChangeStatus() public {
        vm.prank(producer);
        vm.expectRevert();
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Rejected);
    }

    // ---------------- Tests de casos edge ----------------
    // asegura que el contrato prohíbe la transferencia de una cantidad de cero activos
    function testTransferZeroAmount() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.expectRevert();
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 0);
    }

    // verifica que el contrato revierte si un usuario intenta transferir un Token que nunca ha sido creado
    function testTransferNonExistentToken() public {
        vm.expectRevert();
        vm.prank(producer);
        supplyChain.transfer(factory, 99, 10); // como el struct Token no esta creado por default devuelve un struct con valores inicializados a cero 
    }

    // ---------------- Tests de eventos ----------------
    // Valida que los eventos se generen correctamente
    function testTokenCreatedEvent() public {
        vm.prank(producer);
        vm.expectEmit(true, true, false, true); // Le dice a Foundry que espere que se emita un evento con ciertas propiedades en la siguiente llamada
        emit SupplyChain.TokenCreated(1, producer, unicode"Maíz", 100);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
    }

    // realiza una transferencia valida entre producer -> factory
    function testValidTransferProducerToFactory() public {
        vm.prank(producer);
        supplyChain.createToken("Maiz", 100, '{"quality":"high"}', 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        SupplyChain.Transfer memory t = supplyChain.getTransfer(1);
        assertEq(t.from, producer);
        assertEq(t.to, factory);
        assertEq(t.amount, 50);
    }

    // transferencia invalida de producer a consumer 
    function testInvalidTransferProducerToConsumer() public {
        vm.prank(producer);
        supplyChain.createToken("Maiz", 100, '{"quality":"high"}', 0);

        vm.expectRevert(bytes("Transferencia no permitida en este orden"));
        vm.prank(producer);
        supplyChain.transfer(consumer, 1, 10);
    }

    
    function testInvalidTransferRetailerToProducer() public {
        vm.prank(producer);
        supplyChain.createToken("Maiz", 100, '{"quality":"high"}', 0);

        // Primero mover token hasta Retailer para simular flujo
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 50);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // Intentar transferencia inválida Retailer → Producer
        vm.expectRevert(bytes("Transferencia no permitida en este orden"));
        vm.prank(retailer);
        supplyChain.transfer(producer, 1, 10);
    }

    // ---------------- Flujo completo ----------------
    // verifica que se puede crear un activo y moverlo exitosamente del productor a la fábrica a través del sistema de transferencia de dos pasos.
    function testCompleteSupplyChainFlow() public {
        vm.prank(producer);
        supplyChain.createToken("Maiz", 100, '{"quality":"high"}', 0);
        
        // Producer → Factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Factory → Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 50);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // Retailer → Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 50);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);

        assertEq(supplyChain.getTokenBalance(1, consumer), 50);
    }
}
