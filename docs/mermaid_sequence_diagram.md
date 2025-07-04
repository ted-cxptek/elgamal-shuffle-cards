# Mermaid Sequence Diagram: Diffie-Hellman TEE-Based Secure Card Game

```mermaid
sequenceDiagram
    participant TEE as TEE Server
    participant PN as Player N

    Note over TEE, PN: Phase 1: Initialization and Key Generation
    
    TEE->>TEE: Generate TEE key pair

    PN->>PN: Generate Player key pairs
    

    Note over TEE, PN: Phase 2: Diffle Hellman Key Exchange

    PN<<->>TEE: Caculate Shared KeyPair
    PN->>PN: Compute shared secrets with TEE    
    TEE->>TEE: Compute shared secrets with players


    Note over TEE, PN: Players and TEE now know shared keys

    TEE->>TEE: Compute Aggregate Public Key

    Note over TEE, PN: Phase 3: Deck Preparation and Encryption

    TEE->>TEE: Create deck (52 cards)
    TEE->>TEE: Encrypt each card with Aggregate Public Key
    TEE->>PN: Send encrypted deck

    Note over TEE, PN: Phase 4: Sequential Shuffling and Re-encryption

    PN->>PN: Shuffle deck order randomly
    PN->>PN: Re-encrypt each card with Aggregate Public Key
    PN->>PN: Pass deck to next player
    Note over PN: Repeat for all players

    PN->>TEE: Submit final shuffled deck to TEE

    Note over TEE, PN: Phase 5: Card Dealing and Decryption

    TEE->>TEE: Deal 2 cards to each player
    TEE->>TEE: Set aside 5 community cards
    TEE->>PN: Send encrypted player cards

    PN->>PN: Request partial decryption from other players
    PN->>PN: Receive partial decryptions from other players
    PN->>PN: Complete decryption using own shared secret
    PN->>PN: Reveal own card values

    Note over TEE, PN: Community Card Revelation

    TEE->>PN: Request partial decryption of community cards
    PN->>TEE: Send partial decryption using shared secret
    TEE->>TEE: Complete community card decryption
    TEE->>PN: Broadcast community card values
```

## Key Security Features Highlighted:

1. **TEE Trust**: All critical operations happen in trusted execution environment
2. **Diffie-Hellman Security**: Each player has unique shared secret with TEE
3. **Collective Encryption**: Aggregate public key requires all players' cooperation
4. **Sequential Shuffling**: Each player contributes to deck randomization
5. **Partial Decryption**: Cards can only be revealed with all players' cooperation
6. **Privacy Preservation**: Players can only see their own cards individually

## Cryptographic Operations:
- **Key Generation**: ElGamal key pairs
- **Diffie-Hellman**: Shared secret computation
- **ElGamal Encryption**: Card encryption
- **ElGamal Decryption**: Card decryption
- **Re-encryption**: Card re-encryption for shuffling 