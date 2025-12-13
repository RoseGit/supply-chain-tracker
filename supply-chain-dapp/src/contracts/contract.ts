import { ethers } from "ethers";

// Dirección del contrato en Anvil
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI del contrato (simplificado con las funciones que usaremos)
export const CONTRACT_ABI = [
  "function isUserRegistered(address userAddress) public view returns (bool)",
  "function getUserInfo(address userAddress) public view returns (tuple(uint256 id, address userAddress, string role, uint8 status))",
  "function requestUserRole(string memory role) public",
  "function isAdmin(address userAddress) public view returns (bool)"
];

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}
