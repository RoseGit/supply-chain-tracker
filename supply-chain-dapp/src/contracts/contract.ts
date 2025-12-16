/**
 * @fileoverview Configuración y utilidades para la interacción con el contrato inteligente(SupplyChain.sol).
 * Proporciona las constantes de red y la interfaz para instanciar el contrato usando ethers.js.
 */
import { ethers } from "ethers";

/**
 * Dirección del contrato desplegado en la red local (Anvil).
 * @constant
 */
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

/**
 * Fragmentos de la Interfaz Binaria de Aplicación (ABI) del contrato.
 * Define los métodos disponibles para la gestión de usuarios, roles y tokens.
 */
export const CONTRACT_ABI = [
  "function isUserRegistered(address userAddress) public view returns (bool)",
  "function getUserInfo(address userAddress) public view returns (tuple(uint256 id, address userAddress, string role, uint8 status))",
  "function requestUserRole(string memory role) public",
  "function isAdmin(address userAddress) public view returns (bool)",
  "function changeStatusUser(address userAddress, uint8 newStatus)",
  "function nextUserId() view returns (uint256)",
  "function users(uint256) view returns (uint256 id, address userAddress, string role, uint8 status)",
  "function createToken(string name, uint256 totalSupply, string features, uint256 parentId)",
  "function getToken(uint256 tokenId) view returns (uint256 id, address creator, string name, uint256 totalSupply, string features, uint256 parentId, uint256 dateCreated)",
  "function getTokenBalance(uint256 tokenId, address userAddress) view returns (uint256)",
  "function getUserTokens(address userAddress) view returns (uint256[])",
  "function transfer(address to, uint256 tokenId, uint256 amount)",
  "function acceptTransfer(uint256 transferId)",
  "function rejectTransfer(uint256 transferId)",
  "function getTransfer(uint256 transferId) view returns (uint256 id, address from, address to, uint256 tokenId, uint256 dateCreated, uint256 amount, uint8 status)",
  "function getUserTransfers(address userAddress) view returns (uint256[])"
];

/**
 * Crea una instancia conectada del contrato inteligente.
 * * @param signerOrProvider - El firmante (Signer) para enviar transacciones o el proveedor (Provider) para solo lectura.
 * @returns Una instancia de `ethers.Contract` tipada con la dirección y el ABI definidos.
 * * @example
 * ```ts
 * const contract = getContract(provider);
 * const isAdmin = await contract.isAdmin("0x...");
 * ```
 */
export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}
