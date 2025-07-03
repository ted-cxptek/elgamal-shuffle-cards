# ElGamal Variable Reference

## Table of Contents
- [Variable Table](#variable-table)
- [ElGamal Formulas](#elgamal-formulas)
- [Example in Code](#example-in-code)
- [Detailed Explanations](#detailed-explanations)
- [Collective Decryption](#collective-decryption)
- [FAQ](#faq)
- [Tiếng Việt](#tieng-viet)

---

## Variable Table

| Symbol | Name/Role                | Description                                                                 |
|--------|--------------------------|-----------------------------------------------------------------------------|
| **p**      | Prime modulus            | Large prime for modular arithmetic. All calculations are done mod `p`.      |
| **g**      | Generator                | Base for exponentiation, defines the group.                                 |
| **sk**     | Secret key               | Player's private key, randomly chosen in `[2, p-1]`.                        |
| **pk**     | Public key               | Player's public key, `pk = g^sk mod p`.                                     |
| **y**      | Ephemeral secret         | Random for each encryption, ensures ciphertext uniqueness.                   |
| **r**      | Rerandomization random   | Random for each rerandomization, refreshes ciphertext.                      |
| **m**      | Message                  | The plaintext (card number) being encrypted.                                |
| **c1**     | Ciphertext part 1        | `c1 = g^y mod p`                                                            |
| **c2**     | Ciphertext part 2        | `c2 = m * pk^y mod p`                                                       |
| **s**      | Shared secret            | `s = pk^y mod p` (encryption), `s = c1^sk mod p` (decryption)               |
| **sInv**   | Shared secret inverse    | Modular inverse of `s`, used in decryption: `m = c2 * sInv mod p`           |

---

## ElGamal Formulas

```
Encryption:    (c1, c2) = (g^y, m * pk^y) mod p
Decryption:    m = c2 / c1^sk mod p
Rerandomize:   (c1', c2') = (c1 * g^r, c2 * pk^r) mod p
Collective decryption: Each player removes their share by multiplying c2 by (c1^sk)^-1 mod p
```

---

## Example in Code

```typescript
// Key generation
const sk = randomBigInt(2n, p - 1n); // secret key
const pk = modPow(g, sk, p);         // public key

// Encryption
const y = randomBigInt(2n, p - 1n);  // ephemeral secret
const c1 = modPow(g, y, p);
const s = modPow(pk, y, p);
const c2 = (m * s) % p;

// Decryption
const s = modPow(c1, sk, p);
const sInv = modInv(s, p);
const m = (c2 * sInv) % p;

// Rerandomization
const r = randomBigInt(2n, p - 1n);
const newC1 = (c1 * modPow(g, r, p)) % p;
const newC2 = (c2 * modPow(pk, r, p)) % p;
```

---

## Detailed Explanations

### What is `g` (the generator)?
- `g` is a generator of the multiplicative group modulo `p`.
- It is used as the base for exponentiation in key generation and encryption.
- **How to choose `g`?**
  - `g` must be an integer such that `1 < g < p` and `g` is a generator of the group (i.e., its powers generate all elements of the group).
  - `g = 2` is commonly used, but any valid generator can be chosen.
  - If `g` is not a generator, the cryptosystem may not be secure or may not work as expected.

### What is `y`?
- `y` is a random ephemeral secret chosen for each encryption.
- It ensures that encrypting the same message twice yields different ciphertexts.

### What is `r`?
- `r` is a random value used for rerandomization (refreshing) of ciphertexts.
- It makes the ciphertext unlinkable to the original, even though it encrypts the same message.

### What is `c1`, `c2`?
- `c1` is the first part of the ciphertext: `c1 = g^y mod p`.
- `c2` is the second part: `c2 = m * pk^y mod p`.
- Together, `(c1, c2)` is the encrypted message.

### Why does `c1` not change during decryption?
- In collective decryption, each player only updates `c2` by removing their share.
- `c1` is used as a reference for all players to compute their share, but it does not change.

---

## Collective Decryption
- Each player removes their share by multiplying `c2` by the modular inverse of `c1^sk`.
- After all players have done this, the final `c2` is the plaintext message.
- This allows for threshold or distributed decryption, where no single player can decrypt alone.

---

## FAQ

**Q: Can `g` be a large number?**
- Yes, as long as `g` is a generator of the group modulo `p`.
- Commonly, `g = 2` is used for simplicity.

**Q: Why is `y` random for each encryption?**
- To ensure semantic security: the same message encrypted twice yields different ciphertexts.

**Q: What happens if `g` is not a generator?**
- The cryptosystem may not be secure or may not work as expected.

**Q: Why does only `c2` change during partial decryption?**
- Because each player removes their share from `c2` using their secret key, but `c1` is needed for all players and remains constant.

---

# Tiếng Việt

## Bảng biến

| Ký hiệu | Vai trò/Tên gọi         | Giải thích                                                                 |
|---------|-------------------------|----------------------------------------------------------------------------|
| **p**      | Số nguyên tố lớn           | Sử dụng cho các phép toán modulo.                                          |
| **g**      | Số sinh (generator)       | Cơ sở cho phép lũy thừa, xác định nhóm.                                   |
| **sk**     | Khóa bí mật               | Khóa riêng của người chơi, chọn ngẫu nhiên trong `[2, p-1]`.               |
| **pk**     | Khóa công khai            | Khóa công khai, `pk = g^sk mod p`.                                        |
| **y**      | Bí mật tạm thời           | Ngẫu nhiên cho mỗi lần mã hóa, đảm bảo tính duy nhất của bản mã.           |
| **r**      | Ngẫu nhiên làm mới        | Ngẫu nhiên cho mỗi lần làm mới bản mã.                                     |
| **m**      | Thông điệp                | Giá trị gốc (số lá bài) được mã hóa.                                      |
| **c1**     | Bản mã phần 1             | `c1 = g^y mod p`                                                           |
| **c2**     | Bản mã phần 2             | `c2 = m * pk^y mod p`                                                      |
| **s**      | Bí mật chia sẻ            | `s = pk^y mod p` (mã hóa), `s = c1^sk mod p` (giải mã)                     |
| **sInv**   | Nghịch đảo bí mật chia sẻ | Nghịch đảo modulo của `s`, dùng để giải mã: `m = c2 * sInv mod p`          |

## Công thức ElGamal

```
Mã hóa:        (c1, c2) = (g^y, m * pk^y) mod p
Giải mã:       m = c2 / c1^sk mod p
Làm mới:       (c1', c2') = (c1 * g^r, c2 * pk^r) mod p
Giải mã tập thể: Mỗi người chơi loại bỏ phần của mình bằng cách nhân c2 với (c1^sk)^-1 mod p
```

---

Nếu bạn cần thêm ví dụ hoặc giải thích chi tiết hơn, hãy liên hệ! 