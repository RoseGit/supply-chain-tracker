
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

    function setUp() public {
        admin = address(this);
        supplyChain = new SupplyChain();
        // Registrar usuarios
        vm.prank(producer);
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
    function testUserRegistration() public {
        vm.prank(address(0x5));
        supplyChain.requestUserRole("Producer");
        SupplyChain.User memory user = supplyChain.getUserInfo(address(0x5));
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Pending));
    }

    function testAdminApproveUser() public {
        vm.prank(address(0x6));
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(address(0x6), SupplyChain.UserStatus.Approved);
        SupplyChain.User memory user = supplyChain.getUserInfo(address(0x6));
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Approved));
    }

    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
    }

    // ---------------- Tests de creación de tokens ----------------
    function testCreateTokenByProducer() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        (uint id,, string memory name,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, unicode"Maíz");
        assertEq(supplyChain.getTokenBalance(1, producer), 100);
    }

    function testTokenWithParentId() public {
        vm.startPrank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        supplyChain.createToken("Harina", 50, '{"processed":"yes"}', 1);
        vm.stopPrank();
        (,, string memory name,,,,) = supplyChain.getToken(2);
        assertEq(name, "Harina");
    }

    // ---------------- Tests de transferencias ----------------
    function testTransferFromProducerToFactory() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        SupplyChain.Transfer memory t = supplyChain.getTransfer(1);
        assertEq(t.amount, 50);
        assertEq(uint(t.status), uint(SupplyChain.TransferStatus.Pending));
    }

    function testAcceptTransfer() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        assertEq(supplyChain.getTokenBalance(1, factory), 50);
    }

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

    function testTransferInsufficientBalance() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.expectRevert();
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
    }

    // ---------------- Tests de permisos ----------------
    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(address(0x7));
        vm.expectRevert();
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
    }

    function testOnlyAdminCanChangeStatus() public {
        vm.prank(producer);
        vm.expectRevert();
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Rejected);
    }

    // ---------------- Tests de casos edge ----------------
    function testTransferZeroAmount() public {
        vm.prank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        vm.expectRevert();
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 0);
    }

    function testTransferNonExistentToken() public {
        vm.expectRevert();
        vm.prank(producer);
        supplyChain.transfer(factory, 99, 10);
    }

    // ---------------- Tests de eventos ----------------
    function testTokenCreatedEvent() public {
        vm.prank(producer);
        vm.expectEmit(true, true, false, true);
        emit SupplyChain.TokenCreated(1, producer, unicode"Maíz", 100);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
    }

    // ---------------- Flujo completo ----------------
    function testCompleteSupplyChainFlow() public {
        vm.startPrank(producer);
        supplyChain.createToken(unicode"Maíz", 100, '{"quality":"high"}', 0);
        supplyChain.transfer(factory, 1, 50);
        vm.stopPrank();

        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        assertEq(supplyChain.getTokenBalance(1, factory), 50);
    }
}
