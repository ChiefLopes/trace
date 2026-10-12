import secrets
import base58
import bcrypt
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric import ed25519


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def is_valid_solana_address(address: str) -> bool:
    """Validate that a string is a valid 32-byte Base58 Solana public key."""
    try:
        decoded = base58.b58decode(address)
        return len(decoded) == 32
    except Exception:
        return False


def verify_solana_signature(wallet_address: str, signature_b58: str, message: str) -> bool:
    """
    Verify an Ed25519 signature from a Solana wallet.
    - wallet_address: Base58 encoded 32-byte public key
    - signature_b58: Base58 encoded 64-byte Ed25519 signature
    - message: The plaintext challenge string that was signed
    """
    try:
        pubkey_bytes = base58.b58decode(wallet_address)
        if len(pubkey_bytes) != 32:
            return False

        sig_bytes = base58.b58decode(signature_b58)
        if len(sig_bytes) != 64:
            return False

        public_key = ed25519.Ed25519PublicKey.from_public_bytes(pubkey_bytes)
        public_key.verify(sig_bytes, message.encode("utf-8"))
        return True
    except (InvalidSignature, ValueError, Exception):
        return False


def generate_nonce() -> str:
    """Generate a random cryptographic hex nonce for wallet sign-in challenges."""
    return secrets.token_hex(16)
