
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    // Enums
    enum UserStatus { Pending, Approved, Rejected, Canceled }
    enum TransferStatus { Pending, Accepted, Rejected }

    // Structs
    struct Token {
        uint256 id;
        address creator;
        string name;
        uint256 totalSupply;
        string features; // JSON string
        uint256 parentId;
        uint256 dateCreated;
        mapping(address => uint256) balance;
    }

    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 tokenId;
        uint256 dateCreated;
        uint256 amount;
        TransferStatus status;
    }

    struct User {
        uint256 id;
        address userAddress;
        string role;
        UserStatus status;
    }

    // Variables globales
    address public admin;
    uint256 public nextTokenId = 1;
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    // Mappings
    mapping(uint256 => Token) public tokens;
    mapping(uint256 => Transfer) public transfers;
    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToUserId;

    // Eventos
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);

    // Constructor
    constructor() {
        admin = msg.sender;
    }

    // ---------------- Gestión de Usuarios ----------------
    function requestUserRole(string memory role) public {
        require(addressToUserId[msg.sender] == 0, "Usuario ya registrado");
        uint256 userId = nextUserId++;
        users[userId] = User(userId, msg.sender, role, UserStatus.Pending);
        addressToUserId[msg.sender] = userId;
        emit UserRoleRequested(msg.sender, role);
    }

    function changeStatusUser(address userAddress, UserStatus newStatus) public {
        require(msg.sender == admin, "Solo el admin puede cambiar el estado");
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "Usuario no encontrado");
        users[userId].status = newStatus;
        emit UserStatusChanged(userAddress, newStatus);
    }

    function getUserInfo(address userAddress) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "Usuario no encontrado");
        return users[userId];
    }

    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // ---------------- Gestión de Tokens ----------------
    function createToken(string memory name, uint totalSupply, string memory features, uint parentId) public {
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0 && users[userId].status == UserStatus.Approved, "Usuario no autorizado");
        uint256 tokenId = nextTokenId++;
        Token storage newToken = tokens[tokenId];
        newToken.id = tokenId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.parentId = parentId;
        newToken.dateCreated = block.timestamp;
        newToken.balance[msg.sender] = totalSupply;
        emit TokenCreated(tokenId, msg.sender, name, totalSupply);
    }

    function getToken(uint tokenId) public view returns (uint256, address, string memory, uint256, string memory, uint256, uint256) {
        Token storage t = tokens[tokenId];
        return (t.id, t.creator, t.name, t.totalSupply, t.features, t.parentId, t.dateCreated);
    }

    function getTokenBalance(uint tokenId, address userAddress) public view returns (uint) {
        return tokens[tokenId].balance[userAddress];
    }

    // ---------------- Gestión de Transferencias ----------------
    function transfer(address to, uint tokenId, uint amount) public {
        require(amount > 0, "Amount must be greater than zero");
        
        require(tokens[tokenId].balance[msg.sender] >= amount, "Saldo insuficiente");
        uint256 transferId = nextTransferId++;
        transfers[transferId] = Transfer(transferId, msg.sender, to, tokenId, block.timestamp, amount, TransferStatus.Pending);
        emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
    }

    function acceptTransfer(uint transferId) public {
        Transfer storage t = transfers[transferId];
        require(msg.sender == t.to, "Solo el receptor puede aceptar");
        require(t.status == TransferStatus.Pending, "Transferencia no pendiente");
        Token storage token = tokens[t.tokenId];
        require(token.balance[t.from] >= t.amount, "Saldo insuficiente");
        token.balance[t.from] -= t.amount;
        token.balance[t.to] += t.amount;
        t.status = TransferStatus.Accepted;
        emit TransferAccepted(transferId);
    }

    function rejectTransfer(uint transferId) public {
        Transfer storage t = transfers[transferId];
        require(msg.sender == t.to, "Solo el receptor puede rechazar");
        require(t.status == TransferStatus.Pending, "Transferencia no pendiente");
        t.status = TransferStatus.Rejected;
        emit TransferRejected(transferId);
    }

    function getTransfer(uint transferId) public view returns (Transfer memory) {
        return transfers[transferId];
    }

    // ---------------- Funciones auxiliares ----------------
    
function getUserTokens(address userAddress) public view returns (uint[] memory) {
    uint count = 0;
    // Primero contamos cuántos tokens tiene el usuario
    for (uint i = 1; i < nextTokenId; i++) {
        if (tokens[i].balance[userAddress] > 0) {
            count++;
        }
    }

    // Creamos el array con el tamaño exacto
    uint[] memory result = new uint[](count);
    uint index = 0;
    for (uint i = 1; i < nextTokenId; i++) {
        if (tokens[i].balance[userAddress] > 0) {
            result[index] = i;
            index++;
        }
    }
    return result;
}


    
function getUserTransfers(address userAddress) public view returns (uint[] memory) {
    uint count = 0;
    // Contamos cuántas transferencias involucran al usuario
    for (uint i = 1; i < nextTransferId; i++) {
        if (transfers[i].from == userAddress || transfers[i].to == userAddress) {
            count++;
        }
    }

    // Creamos el array con el tamaño exacto
    uint[] memory result = new uint[](count);
    uint index = 0;
    for (uint i = 1; i < nextTransferId; i++) {
        if (transfers[i].from == userAddress || transfers[i].to == userAddress) {
            result[index] = i;
            index++;
        }
    }
    return result;
}

}
