# Sequence Diagram Prompt: Diffie-Hellman TEE-Based Secure Card Game

## Context
Create a detailed sequence diagram for a secure multiplayer card game using Trusted Execution Environment (TEE) and Diffie-Hellman key exchange. The system ensures privacy and fairness through cryptographic protocols.

## System Architecture
- **TEE Server**: Trusted Execution Environment that manages game state and cryptographic operations
- **Players**: Multiple participants who interact with the TEE server
- **Cryptographic Parameters**: 
  - Prime modulus: p (256-bit prime)
  - Generator: g = 2
  - ElGamal encryption scheme

## Sequence Flow

### Phase 1: Initialization and Key Generation
1. **TEE Server Initialization**
   - TEE generates its own key pair using ElGamal
   - TEE stores private key securely in trusted environment

2. **Player Key Generation**
   - Each player generates local key pair using ElGamal
   - Players keep their private keys secure locally

### Phase 2: Key Exchange
3. **Shared Key Establishment**
   - Players and TEE compute shared secrets using Diffie-Hellman
   - Players and TEE now know their respective shared keys
   - Players compute shared public keys and send to TEE
   - TEE receives all shared public keys from all players

4. **Aggregate Public Key Generation**
   - TEE computes aggregate public key from all shared public keys
   - This represents the combined encryption key for the game

### Phase 3: Deck Preparation and Encryption
5. **Deck Initialization**
   - TEE creates deck of 52 cards
   - TEE encrypts each card using aggregate public key with ElGamal
   - TEE sends encrypted deck to all players

### Phase 4: Shuffling and Re-encryption
6. **Sequential Player Shuffling**
   - For each player in sequence:
     - Player receives encrypted deck
     - Player shuffles deck order randomly
     - Player re-encrypts each card using aggregate public key
     - Player sends shuffled and re-encrypted deck to next player
   - Final shuffled deck is distributed to all players

### Phase 5: Card Dealing
7. **Card Distribution**
   - Each player receives 2 encrypted cards
   - Community cards (5 cards) are set aside encrypted
   - All cards remain encrypted with aggregate public key

### Phase 6: Card Revelation
8. **Individual Card Decryption**
   - When player wants to see their cards:
     - Other players partially decrypt using their shared secrets
     - Requesting player completes decryption using their shared secret
     - Card value is revealed only to requesting player

9. **Community Card Decryption**
   - When community cards need to be revealed:
     - All players cooperate in decryption
     - Each player applies partial decryption using their shared secret
     - Final result reveals card value to all players

## Security Properties
- **Privacy**: Players cannot see others' cards without cooperation
- **Fairness**: TEE ensures unbiased shuffling and dealing
- **Verifiability**: All cryptographic operations are verifiable
- **Trust**: TEE provides trusted execution environment

## Technical Details to Include
- Show cryptographic operations (key generation, encryption, decryption)
- Indicate which keys are used for each operation
- Show data flow between TEE and players
- Include error handling and verification steps
- Show parallel operations where applicable

## Diagram Elements
- **Actors**: TEE Server, Players (collapsed into single entity)
- **Messages**: Key exchanges, encrypted data, decryption requests
- **Notes**: Algorithm names, security properties
- **Timing**: Sequential and parallel operations
- **Data**: Key pairs, encrypted cards, shared secrets

## Output Format
Generate a sequence diagram showing:
1. Clear actor identification (TEE vs Players)
2. Message flow with algorithm names
3. Data transformations (encryption/decryption)
4. Security boundaries and trusted operations
5. Parallel and sequential processing
6. Error handling and verification steps

## Key Cryptographic Operations to Highlight
- **Key Generation**: ElGamal key pairs
- **Diffie-Hellman**: Shared secret computation
- **ElGamal Encryption**: Card encryption
- **ElGamal Decryption**: Card decryption
- **Aggregate Key Generation**: Combined public key computation
- **Partial Decryption**: Cooperative decryption process

This diagram should clearly illustrate how the TEE orchestrates the secure card game while maintaining player privacy and game fairness through cryptographic protocols. 