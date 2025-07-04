// ElGamal Shuffle/Deal Demo (no zk-SNARKs)
//
// ElGamal formulas:
// Encryption:    (c1, c2) = (g^y, m * pk^y) mod p
// Decryption:    m = c2 / c1^sk mod p
// Rerandomize:   (c1', c2') = (c1 * g^r, c2 * pk^r) mod p
// Collective decryption: Each player removes their share by multiplying c2 by (c1^sk)^-1 mod p
//
import { prime, randBetween, modPow, modInv } from 'bigint-crypto-utils';
import crypto from 'crypto';

const PLAYER_COUNT = 8;
const DECK_SIZE = 52;
const COMMUNITY_CARDS = 5;
const CARDS_PER_PLAYER = 2;

// Card mapping function
function getCardName(cardNumber: number): string {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];

  const suitIndex = Math.floor((cardNumber - 1) / 13);
  const rankIndex = (cardNumber - 1) % 13;

  return `${ranks[rankIndex]} ${suits[suitIndex]}`;
}

function getCardNumber(cardName: string): number {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];

  const suit = cardName.split(' ')[1];
  const rank = cardName.split(' ')[0];

  const suitIndex = suits.indexOf(suit);
  const rankIndex = ranks.indexOf(rank);

  return suitIndex * 13 + rankIndex + 1;
}

// 1. Setup ElGamal parameters (small prime for demo)
const p = BigInt('208351617316091241234326746312124448251235562226470491514186331217050270460481'); // 256-bit prime
const g = BigInt(2);

// Generate a random bigint in [min, max] inclusive
function randomBigInt(min: bigint, max: bigint): bigint {
  if (max < min) throw new RangeError('max must be >= min');
  const range = max - min + 1n;
  const byteLength = Math.ceil(Number(range.toString(2).length) / 8);
  let rnd: bigint;
  do {
    const buf = crypto.randomBytes(byteLength);
    rnd = BigInt('0x' + buf.toString('hex'));
  } while (rnd >= range);
  return min + rnd;
}

// TEE Server key pair interface
interface TEEServerKeyPair {
  sk: bigint;  // TEE server private key
  pk: bigint;  // TEE server public key
}

// Generate TEE server key pair
function genTEEServerKeyPair(): TEEServerKeyPair {
  const sk = randomBigInt(2n, p - 1n);
  const pk = modPow(g, sk, p);
  return { sk, pk };
}

// 2. Key generation for players with Diffie-Hellman
interface KeyPair { 
  sk: bigint, 
  pk: bigint, 
  shared_sk: bigint, 
  shared_pk: bigint 
}

function genKeyPair(): KeyPair {
  const sk = randomBigInt(2n, p - 1n);
  const pk = modPow(g, sk, p);
  return { sk, pk, shared_sk: BigInt(0), shared_pk: BigInt(0) };
}

// Diffie-Hellman key exchange between player and TEE server
function performDiffieHellmanExchange(playerKeyPair: KeyPair, teeServerKeyPair: TEEServerKeyPair): KeyPair {
  // Player computes shared secret: (TEE_pk)^player_sk mod p
  const shared_sk = modPow(teeServerKeyPair.pk, playerKeyPair.sk, p);
  
  // Player's shared public key: g^shared_sk mod p
  const shared_pk = modPow(g, shared_sk, p);
  
  return {
    ...playerKeyPair,
    shared_sk,
    shared_pk
  };
}

// Generate aggregate public key using Diffie-Hellman shared keys
function generateAggregatePublicKey(players: KeyPair[]): bigint {
  // Aggregate public key is the product of all shared public keys
  return players.reduce((acc, player) => (acc * player.shared_pk) % p, BigInt(1));
}

// 5. ElGamal encryption
interface Cipher {
  c1: bigint;
  c2: bigint;
}
function encrypt(m: bigint, pk: bigint): Cipher {
  const y = randomBigInt(2n, p - 1n);
  const c1 = modPow(g, y, p);
  const s = modPow(pk, y, p);
  const c2 = (m * s) % p;
  return { c1, c2 };
}
function decrypt(cipher: Cipher, sk: bigint): Cipher {
  const s = modPow(cipher.c1, sk, p);
  const sInv = modInv(s, p);
  return { c1: cipher.c1, c2: (cipher.c2 * sInv) % p };
}

// Rerandomize without decrypting (more secure)
function rerandomize(cipher: Cipher, pk: bigint): Cipher {
  const r = randomBigInt(2n, p - 1n);
  const newC1 = (cipher.c1 * modPow(g, r, p)) % p;
  const newC2 = (cipher.c2 * modPow(pk, r, p)) % p;
  return { c1: newC1, c2: newC2 };
}

// 7. Each player shuffles and re-encrypts the deck
function shuffleAndReencrypt(deck: Cipher[], pk: bigint): Cipher[] {
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Re-encrypt
  return deck.map(c => rerandomize(c, pk));
}

// 9. Decrypt cards (all players cooperate to decrypt)
function collectiveDecrypt(cipher: Cipher, players: KeyPair[]): bigint {
  let c = { ...cipher };
  for (const kp of players) {
    // Each player partially decrypts using their shared secret key
    const s = modPow(c.c1, kp.shared_sk, p);
    const sInv = modInv(s, p);
    c.c2 = (c.c2 * sInv) % p;
  }
  return c.c2;
}

// Decrypt a specific player's cards (other players decrypt first, then the player)
function decryptPlayerCards(playerCards: Cipher[], players: KeyPair[], requestingPlayerIndex: number): string[] {
  const requestingPlayer = players[requestingPlayerIndex];
  const otherPlayers = players.filter((_, index) => index !== requestingPlayerIndex);
  
  // console.log(`\n🔐 Player ${requestingPlayerIndex + 1} requesting to see their cards...`);
  
  return playerCards.map(card => {
    let c = { ...card };
    // Other players decrypt first using their shared secret keys
    for (const kp of otherPlayers) {
      const s = modPow(c.c1, kp.shared_sk, p);
      const sInv = modInv(s, p);
      c.c2 = (c.c2 * sInv) % p;
    }
    
    // Requesting player decrypts last to reveal the card using their shared secret key
    const s = modPow(c.c1, requestingPlayer.shared_sk, p);
    const sInv = modInv(s, p);
    const plaintext = (c.c2 * sInv) % p;
    return getCardName(Number(plaintext));
  });
}

// Main container function for the ElGamal shuffle/deal demo
function runElGamalShuffleDemo(): void {
  console.log('🚀 Starting ElGamal Shuffle/Deal Demo with Diffie-Hellman TEE Server...\n');

  // 1. Generate TEE server key pair
  const teeServer = genTEEServerKeyPair();
  console.log('🔐 TEE Server public key:', teeServer.pk.toString());

  // 2. Generate keys for all players
  const players: KeyPair[] = [];
  for (let i = 0; i < PLAYER_COUNT; i++) {
    players.push(genKeyPair());
  }

  // 3. Perform Diffie-Hellman key exchange between each player and TEE server
  console.log('🤝 Performing Diffie-Hellman key exchanges...');
  for (let i = 0; i < PLAYER_COUNT; i++) {
    players[i] = performDiffieHellmanExchange(players[i], teeServer);
    console.log(`Player ${i + 1} shared public key:`, players[i].shared_pk.toString());
  }

  // 4. Generate aggregate public key using Diffie-Hellman shared keys
  const aggPk = generateAggregatePublicKey(players);
  console.log('🔑 Aggregate public key (Diffie-Hellman):', aggPk.toString());

  // 5. Deck preparation
  let deck: number[] = Array.from({ length: DECK_SIZE }, (_, i) => i + 1);

  // 6. Encrypt deck with aggregate public key
  let encDeck: Cipher[] = deck.map(card => encrypt(BigInt(card), aggPk));

  console.log("The original deck is", encDeck);
  // 7. Each player shuffles and re-encrypts the deck
  for (let i = 0; i < PLAYER_COUNT; i++) {
    let prevDeck = encDeck;
    encDeck = shuffleAndReencrypt(encDeck, aggPk);
    // Verify that shuffle and re-encryption actually changed the deck
    const deckChanged = prevDeck.some((prevCard, index) => {
      const newCard = encDeck[index];
      return prevCard.c1 !== newCard.c1 || prevCard.c2 !== newCard.c2;
    });

    if (!deckChanged) {
      console.warn(`⚠️  Warning: Player ${i + 1}'s shuffle/re-encryption may not have changed the deck!`);
    } else {
      console.log(`✅ Player ${i + 1} successfully shuffled and re-encrypted the deck`);
    }

  }

  console.log("The final shuffled deck is", encDeck);


  // 8. Deal cards
  const playerCards: Cipher[][] = Array.from({ length: PLAYER_COUNT }, () => []);
  for (let i = 0; i < PLAYER_COUNT; i++) {
    playerCards[i].push(encDeck[i * CARDS_PER_PLAYER]);
    playerCards[i].push(encDeck[i * CARDS_PER_PLAYER + 1]);
  }
  const communityCards: Cipher[] = encDeck.slice(PLAYER_COUNT * CARDS_PER_PLAYER, PLAYER_COUNT * CARDS_PER_PLAYER + COMMUNITY_CARDS);
  
  // Divide community cards into flop, turn, and river
  const flopCards: Cipher[] = communityCards.slice(0, 3);
  const turnCard: Cipher = communityCards[3];
  const riverCard: Cipher = communityCards[4];

  // Output results
  console.log('\n📊 Results:');
  // console.log('Player public keys:', players.map(p => p.pk.toString()));
  console.log('Aggregate public key:', aggPk.toString());
  console.log('--- Dealing cards ---');
  
  // Each player reveals their cards individually
  for (let i = 0; i < PLAYER_COUNT; i++) {
    const cardNames = decryptPlayerCards(playerCards[i], players, i);
    console.log(`Player ${i + 1} cards:`, cardNames);
  }

  const flopCardsDecrypted = flopCards.map(c => collectiveDecrypt(c, players));
  const turnCardDecrypted = collectiveDecrypt(turnCard, players);
  const riverCardDecrypted = collectiveDecrypt(riverCard, players);

  console.log("Flop cards:", flopCardsDecrypted.map(cardNum => getCardName(Number(cardNum))));
  console.log("Turn card:", [getCardName(Number(turnCardDecrypted))]);
  console.log("River card:", [getCardName(Number(riverCardDecrypted))]);


  console.log('\n✅ ElGamal Shuffle/Deal Demo completed!');

  let riverCardD: any = riverCard;
  riverCardD = decrypt(riverCardD, players[1].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[3].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[2].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[4].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[6].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[7].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[5].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:", riverCardD)
  riverCardD = decrypt(riverCardD, players[0].shared_sk);
  console.log("🚀 ~ runElGamalShuffleDemo ~ riverCardD:",riverCardD, getCardName(Number(riverCardD.c2)))

  
}

// Run the demo
runElGamalShuffleDemo();
