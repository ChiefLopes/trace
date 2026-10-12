import base58

LAMPORTS_PER_SOL = 1_000_000_000


def shorten_address(address: str, chars: int = 4) -> str:
    """Format `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` -> `7xKX…gAsU`."""
    if len(address) <= chars * 2 + 1:
        return address
    return f"{address[:chars]}…{address[-chars:]}"


def format_sol(lamports: int, max_decimals: int = 4) -> str:
    """Format integer lamports to SOL string representation."""
    negative = lamports < 0
    abs_val = abs(lamports)
    whole = abs_val // LAMPORTS_PER_SOL
    remainder = abs_val % LAMPORTS_PER_SOL

    fraction_str = f"{remainder:09d}"[:max_decimals].rstrip("0")
    formatted_whole = f"{whole:,}"
    result = f"{'-' if negative else ''}{formatted_whole}"
    if fraction_str:
        result += f".{fraction_str}"
    return result


def is_valid_solana_address(address: str) -> bool:
    """Validate a 32-byte Base58 Solana public key."""
    try:
        decoded = base58.b58decode(address)
        return len(decoded) == 32
    except Exception:
        return False


def is_valid_solana_signature(signature: str) -> bool:
    """Validate a 64-byte Base58 Solana transaction or message signature."""
    try:
        decoded = base58.b58decode(signature)
        return len(decoded) == 64
    except Exception:
        return False
