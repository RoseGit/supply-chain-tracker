// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    // Enums 
    // Los valores se asignan en el orden en que son declarados(Pending = 0, Approved = 1, etc)
    enum UserStatus { Pending, Approved, Rejected, Canceled }
    enum TransferStatus { Pending, Accepted, Rejected }

    // Structs
    // son similares a los DTO de Java
    // Token, representa el activo que se esta rastreando o gestionando en la cadena de suministro.
    struct Token {
        uint256 id;                          //Identificador unico del token 
        address creator;                     // Direccion de quien creo el token inicial por elejemplo el emisor incial
        string name;                         // Nombre descriptivo del activo
        uint256 totalSupply;                 // La cantidad total existente del token
        string features;                     // JSON string, se espera que contega atributos complejos ej. {"color": "verde", "peso": "10kg"}
        uint256 parentId;                    // si este token se genera a partir de otro (util para rastrear el origen)
        uint256 dateCreated;                 //indica cuando fue creado el token 
        mapping(address => uint256) balance; //Indica cuanto de este token posee cada usuario(por su direccion) (como el libro de contabilidad del activo)
    }

    // Transfer, Registra cada movimiento del activo en dos partes, from y to 
    struct Transfer {
        uint256 id;             // Identificador unico de la transferencia 
        address from;           // La direccion de quien envia el token 
        address to;             // La direccion de quien recibe el token 
        uint256 tokenId;        // El identificador del token o del activo que se esta moviendo
        uint256 dateCreated;    // Indica cuando se registro la trasnferencia 
        uint256 amount;         // La cantidad del token que se transfiere 
        TransferStatus status;  // El estado actual de la transferencia 
    }

    // User, define atributos de cada participante dentro del flujo de la cadena de suministro
    struct User {
        uint256 id;             // Identificador unico del usuario
        address userAddress;    // La direccion de la billetera del usuario 
        string role;            // El rol que tiene el usuario en la cadena de suministro (Producer, Manufacturer, Factory, etc.)
        UserStatus status;      // El estado de aprobacion del usuario por el admin(Gestion de usuarios)
    }

    // Variables globales
    address public admin;               // Lamacena la direccion del usuario que tiene los maximos privilegios sobre el contrato
    uint256 public nextTokenId = 1;     // nextTokenId, nextTransferId y nextUserId son contadores para asegurar que cada uno tenga un ID unico.
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    // Mappings, Al ser public se genera automaticamente una funcion que permite consultar los datos del mapping usando su clave, ID.
    mapping(uint256 => Token) public tokens;            // Sirve para obtener todos los datos de un token por su ID.
    mapping(uint256 => Transfer) public transfers;      // Sirve para obtener todos los datos de un Transfer por su ID.
    mapping(uint256 => User) public users;              // Sirve para obtener todos los datos deun User por su ID.
    mapping(address => uint256) public addressToUserId; // Mantiene la relacion entre la direccion del usuario y poder obtener su ID.

    // Eventos
    // Son una forma de emitir un registro de lo que ocurrio y se almacenan en la historia de transacciones de la blockchain. Muy util para Historial y auditoria
    // Se registra cada que se crea un token
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);                         

     //Cuando un usuario incia solicitud de mover un token 
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);

    // Cuando la solicitud de transferencia es aprobada
    event TransferAccepted(uint256 indexed transferId); 

    // Cuando la solicitud de transferencia es rechazada
    event TransferRejected(uint256 indexed transferId);                                                                             
    
    // Cuando un usuario solicita ser anadido o cambiar su rol 
    event UserRoleRequested(address indexed user, string role);                                                                     

    // Cuando el estado de aprobacion de un usuario cambia (Pending, Approved, etc.)
    event UserStatusChanged(address indexed user, UserStatus status);                                                               

    // Constructor
    // El administrador sera quein despliega el contrato en la block chain 
    /* Del README,md
        admin (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266), 
        producer (0x70997970C51812dc3A010C7d01b50e0d17dc79C8), 
        factory (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC), 
        retailer (0x90F79bf6EB2c4f870365E785982E1f101E93b906), 
        consumer (0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65))
     */
    constructor() {
        admin = msg.sender; // msg.sender contiene el valor de la billetara, constructor se ejecuta al desplegar el contrato
    }

    // ---------------- Gestión de Usuarios ----------------
    // Permite a cualquier direccion que no haya sido registrada previamente, solicitar un rol dentro de la cadena de suministro
    function requestUserRole(string memory role) public {
        require(addressToUserId[msg.sender] == 0, "Usuario ya registrado");
        uint256 userId = nextUserId++;
        users[userId] = User(userId, msg.sender, role, UserStatus.Pending);
        addressToUserId[msg.sender] = userId;
        emit UserRoleRequested(msg.sender, role);
    }

    // Modifica el estatus de un usuario, por ejemplo de Pending a Approved
    function changeStatusUser(address userAddress, UserStatus newStatus) public {
        require(msg.sender == admin, "Solo el admin puede cambiar el estado");
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "Usuario no encontrado");
        users[userId].status = newStatus;
        emit UserStatusChanged(userAddress, newStatus);
    }

    // Permite obtener la informacion del usuario(consulta) en base a su billetera
    function getUserInfo(address userAddress) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "Usuario no encontrado");
        return users[userId];
    }

    // Solo valida si la direccion que se le pasa como parametro, perteneece al administrador.
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // ---------------- Gestión de Tokens ----------------
    // Esta es la funcion que permite crear el token o el activo que se va a reastrear
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

    // nos permite obtener los detalles de un token(activo) en especifico mediante su ID
    function getToken(uint tokenId) public view returns (uint256, address, string memory, uint256, string memory, uint256, uint256) {
        Token storage t = tokens[tokenId];
        return (t.id, t.creator, t.name, t.totalSupply, t.features, t.parentId, t.dateCreated);
    }

    //consulta el saldo de un token(activo) de un usuario en especifico
    function getTokenBalance(uint tokenId, address userAddress) public view returns (uint) {
        return tokens[tokenId].balance[userAddress];
    }

    // ---------------- Gestión de Transferencias ----------------
    // Registra una solicitud para mover una cantidad de un token del saldo del remitente a un destinatario to
    function transfer(address to, uint tokenId, uint amount) public {
        require(amount > 0, "Amount must be greater than zero");
        
        require(tokens[tokenId].balance[msg.sender] >= amount, "Saldo insuficiente");
        uint256 transferId = nextTransferId++;
        transfers[transferId] = Transfer(transferId, msg.sender, to, tokenId, block.timestamp, amount, TransferStatus.Pending);
        emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
    }

    // Es la encargada de mover los token(activo) y actualizar el balance
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

    // Funcion que permite rechazar una transferencia pero solo por el receptor del activo
    function rejectTransfer(uint transferId) public {
        Transfer storage t = transfers[transferId];
        require(msg.sender == t.to, "Solo el receptor puede rechazar");
        require(t.status == TransferStatus.Pending, "Transferencia no pendiente");
        t.status = TransferStatus.Rejected;
        emit TransferRejected(transferId);
    }

    // Recupera los detalles de una transferencia en concreto
    function getTransfer(uint transferId) public view returns (Transfer memory) {
        return transfers[transferId];
    }

    // ---------------- Funciones auxiliares ----------------
    // Nos permite saber que tokens posee un usuario determinado
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
    
    // Nos permite consultar el historial de transferencias de un usuario, ya sea emitidas o recibidas
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