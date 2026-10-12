from src.solana.utils import (
    format_sol,
    is_valid_solana_address,
    is_valid_solana_signature,
    shorten_address,
)


def test_shorten_address():
    addr = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
    assert shorten_address(addr, 4) == "7xKX…gAsU"
    assert shorten_address("short", 4) == "short"


def test_format_sol():
    assert format_sol(1_000_000_000) == "1"
    assert format_sol(20_000_000_000) == "20"
    assert format_sol(500_000_000) == "0.5"
    assert format_sol(50_000_000) == "0.05"
    assert format_sol(0) == "0"


def test_validate_address():
    valid = "9J4Kp2Lm8Qr5Vx3Nw7Zc1Tb6Fd4Gh9Mn2Qp8Rv5Vx3N8"
    # An actual 32 byte base58 string
    import base58

    real_valid = base58.b58encode(b"\x01" * 32).decode("ascii")
    assert is_valid_solana_address(real_valid) is True
    assert is_valid_solana_address("invalid_address") is False
    assert is_valid_solana_address("") is False


def test_validate_signature():
    import base58

    real_sig = base58.b58encode(b"\x01" * 64).decode("ascii")
    assert is_valid_solana_signature(real_sig) is True
    assert is_valid_solana_signature("invalid_sig") is False
