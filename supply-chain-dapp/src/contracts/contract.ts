import { ethers } from "ethers";

// Dirección del contrato en Anvil
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI del contrato (simplificado con las funciones que usaremos)
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

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}
