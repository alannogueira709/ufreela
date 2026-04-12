import re


def digits_only(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_cpf(value: str) -> bool:
    cpf = digits_only(value)

    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    total = sum(int(digit) * weight for digit, weight in zip(cpf[:9], range(10, 1, -1)))
    first_digit = (total * 10 % 11) % 10

    total = sum(int(digit) * weight for digit, weight in zip(cpf[:10], range(11, 1, -1)))
    second_digit = (total * 10 % 11) % 10

    return cpf[-2:] == f"{first_digit}{second_digit}"


def is_valid_cnpj(value: str) -> bool:
    cnpj = digits_only(value)

    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False

    def calculate_digit(base: str, weights: list[int]) -> str:
        total = sum(int(digit) * weight for digit, weight in zip(base, weights))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    first_digit = calculate_digit(cnpj[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    second_digit = calculate_digit(cnpj[:12] + first_digit, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

    return cnpj[-2:] == f"{first_digit}{second_digit}"
