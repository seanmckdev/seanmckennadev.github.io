const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
  parent: 'game-container',
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let scale = 3; // Scale factor for card sprites
let cardWidth = 48;
let cardHeight = 64;

let deck = [];
let playerHand = [];
let dealerHand = [];
let dealerSecondCardHidden = true; // Track whether the dealer's second card is hidden
const dealerActionDelay = 250; // Delay in milliseconds for dealer's actions

let dealButton, hitButton, standButton, splitButton, doubleButton;
let messageText, dealerScoreText, playerScoreText;

let cardMap = {}; // Maps rank+suit to frame index
const suits = ['♠', '♥', '♣', '♦'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let playerSplitHand = []; // Array for the player's split hand
let activeHand = 'main'; // Tracks the active hand: 'main' or 'split'

let alwaysDealPair = false; // Toggle for testing: always deal the player a pair of cards

let mainHandStood = false; // Tracks if the main hand has been stood on
let splitHandStood = false; // Tracks if the split hand has been stood on

const grayOverlayAlpha = 0.45; // Global variable to control the alpha of gray overlays

let bank = 1000; // Starting bank amount
let minBet = 5; // Minimum bet amount
let betMain = 0; // Current bet amount
let betSplit = 0; // Current split bet amount

function preload() {
    // TODO: load sound effects
    // this.load.audio('deal', 'assets/deal.mp3');
    this.load.spritesheet('cards', 'assets/cards.png', { frameWidth: 48, frameHeight: 64 });
    this.load.image('cardBack', 'assets/cardBack.png');
}

function create() {
    // UI elements (using DOM, as Phaser text is canvas-based)
    dealButton = document.getElementById('deal');
    hitButton = document.getElementById('hit');
    hitButton.disabled = true;
    standButton = document.getElementById('stand');
    standButton.disabled = true;
    splitButton = document.getElementById('split');
    splitButton.disabled = true;
    doubleButton = document.getElementById('double');
    doubleButton.disabled = true;
    bet5Button = document.getElementById('bet-5');
    bet5Button.disabled = false;
    nextRoundButton = document.getElementById('next-round');
    nextRoundButton.disabled = true;

    messageText = document.getElementById('message');
    dealerScoreText = document.getElementById('dealer-score');
    playerScoreText = document.getElementById('player-score');

    // Button events
    dealButton.addEventListener('click', () => startGame.call(this));
    hitButton.addEventListener('click', () => hit.call(this));
    standButton.addEventListener('click', () => stand.call(this));
    splitButton.addEventListener('click', () => split.call(this));
    doubleButton.addEventListener('click', () => double.call(this));
    bet5Button.addEventListener('click', () => placeBet(5));
    nextRoundButton.addEventListener('click', () => nextRound.call(this));

    // Create cardMap
    suits.forEach((suit, suitIndex) => {
        ranks.forEach((rank, rankIndex) => {
            const frame = suitIndex * 13 + rankIndex; // Frame = row * cols + col
            cardMap[`${rank}${suit}`] = frame;
        });
    });

    // Initialize deck
    createDeck.call(this);

    // Automatically place the minimum bet on page load
    if (betMain === 0) {
        if (bank >= minBet) {
            betMain = minBet;
            bank -= minBet;
        } else {
            messageText.textContent = 'Not enough funds to place the minimum bet!';
        }
    }

    betSplit = 0;
    updateBetUI();
    updateBankUI();
}

function update() {
    // TODO: Add animations or updates here
}

function getCardSprite(rank, suit) {
    const frame = cardMap[`${rank}${suit}`];
    if (frame === undefined) {
        console.error(`Invalid card: ${rank}${suit}`);
        return null;
    }
    return this.add.sprite(0, 0, 'cards', frame);
}

function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
        deck.push({ rank, suit });
        }
    }
    deck = deck.sort(() => Math.random() - 0.5);
}

function calculateHand(hand) {
    let value = 0;
    let aces = 0;
    for (let card of hand) {
        if (card.rank === 'A') {
        aces++;
        } else if (['J', 'Q', 'K'].includes(card.rank)) {
        value += 10;
        } else {
        value += parseInt(card.rank);
        }
    }
    for (let i = 0; i < aces; i++) {
        if (value + 11 <= 21) {
        value += 11;
        } else {
        value += 1;
        }
    }
    return value;
}

function renderHands() {
    // Clear previous cards
    this.children.removeAll();

    // Render dealer hand
    dealerHand.forEach((card, i) => {
        let sprite;
        if (i === 1 && dealerSecondCardHidden) {
            sprite = this.add.sprite(0, 0, 'cardBack');
        } else {
            sprite = getCardSprite.call(this, card.rank, card.suit);
        }
        if (sprite) {
            sprite.setPosition(
                (cardHeight * scale * 0.5) + i * (cardWidth * scale * 0.25),
                (cardHeight * (scale * 0.5) + 20) + i * (cardHeight * scale * 0.1)
            );
            sprite.setScale(scale);
        }
    });

    // Render player's main hand
    const mainHandGray = mainHandStood || activeHand !== 'main'; // Gray out if stood or not active
    playerHand.forEach((card, i) => {
        const sprite = getCardSprite.call(this, card.rank, card.suit);
        if (sprite) {
            sprite.setPosition(
                (cardHeight * scale * 0.5) + i * (cardWidth * scale * 0.25),
                (cardHeight * (scale) * 2) + i * (cardHeight * scale * 0.1)
            );
            sprite.setScale(scale);

            if (mainHandGray) {
                const grayOverlay = this.add.rectangle(
                    sprite.x,
                    sprite.y,
                    cardWidth * scale,
                    cardHeight * scale,
                    0x000000,
                    grayOverlayAlpha
                );
                grayOverlay.setOrigin(0.5, 0.5);
            }
        }
    });

    // Render player's split hand
    const splitHandGray = splitHandStood || activeHand !== 'split'; // Gray out if stood or not active
    playerSplitHand.forEach((card, i) => {
        const sprite = getCardSprite.call(this, card.rank, card.suit);
        if (sprite) {
            sprite.setPosition(
                (cardHeight * scale * 3) + i * (cardWidth * scale * 0.25), // Adjust x position to the right
                (cardHeight * (scale) * 2) + i * (cardHeight * scale * 0.1) // Same y position as the main hand
            );
            sprite.setScale(scale);

            if (splitHandGray) {
                const grayOverlay = this.add.rectangle(
                    sprite.x,
                    sprite.y,
                    cardWidth * scale,
                    cardHeight * scale,
                    0x000000,
                    grayOverlayAlpha
                );
                grayOverlay.setOrigin(0.5, 0.5);
            }
        }
    });

    // Update scores
    if (activeHand === 'main') {
        playerScoreText.textContent = calculateHand(playerHand);
    } else {
        playerScoreText.textContent = calculateHand(playerSplitHand);
    }

    dealerScoreText.textContent = dealerSecondCardHidden
        ? calculateHand([dealerHand[0]]) + " ?"
        : calculateHand(dealerHand);
}

function startGame() {
    createDeck.call(this);

    if (alwaysDealPair) {
        // Deal a random pair of cards to the player
        const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
        const suit1 = suits[Math.floor(Math.random() * suits.length)];
        const suit2 = suits[Math.floor(Math.random() * suits.length)];
        playerHand = [{ rank: randomRank, suit: suit1 }, { rank: randomRank, suit: suit2 }];
        // Remove the dealt cards from the deck
        deck = deck.filter(card => !(card.rank === randomRank && (card.suit === suit1 || card.suit === suit2)));
    } else {
        // Deal random cards normally
        playerHand = [deck.pop(), deck.pop()];
    }

    playerSplitHand = []; // Reset split hand
    activeHand = 'main'; // Start with the main hand
    mainHandStood = false; // Reset main hand stood status
    splitHandStood = false; // Reset split hand stood status
    dealerHand = [deck.pop(), deck.pop()];
    dealerSecondCardHidden = true;

    renderHands.call(this);
    messageText.textContent = '';
    dealButton.disabled = true;
    hitButton.disabled = false;
    standButton.disabled = false;
    splitButton.disabled = !canSplit(); // Enable split button if splitting is possible
    doubleButton.disabled = bank < betMain; // Enable "Double" button only if the player has enough funds
    bet5Button.disabled = true; // Disable betting after the round starts

    checkPlayerBust.call(this);
}

function canSplit() {
    // Check if the player can split (two cards of the same rank and enough funds in the bank)
    return playerHand.length === 2 &&
           playerHand[0].rank === playerHand[1].rank &&
           bank >= betMain;
}

function split() {
    if (!canSplit() || bank < betMain) {
        messageText.textContent = 'Not enough funds to split!';
        return;
    }

    // Move one card to the split hand
    playerSplitHand.push(playerHand.pop());

    // Deduct the same bet amount from the bank for the split hand
    betSplit = betMain;
    bank -= betSplit;

    updateBankUI();
    updateBetUI();
    renderHands.call(this);

    splitButton.disabled = true;
}

function hit() {
    if (activeHand === 'main') {
        playerHand.push(deck.pop());
        renderHands.call(this);
        doubleButton.disabled = true;

        if (calculateHand(playerHand) === 21) {
            messageText.textContent = 'Main hand hits 21! Automatically standing.';
            stand.call(this); // Automatically stand
            return;
        }

        checkPlayerBust.call(this);
    } else if (activeHand === 'split') {
        playerSplitHand.push(deck.pop());
        renderHands.call(this);
        doubleButton.disabled = true;

        if (calculateHand(playerSplitHand) === 21) {
            messageText.textContent = 'Split hand hits 21! Automatically standing.';
            stand.call(this); // Automatically stand
            return;
        }

        checkPlayerBust.call(this);
    }
}

function checkPlayerBust() {
    const hand = activeHand === 'main' ? playerHand : playerSplitHand;
    if (calculateHand(hand) > 21) {
        messageText.textContent = activeHand === 'main' ? 'Main hand busts!' : 'Split hand busts!';
        if (activeHand === 'main' && playerSplitHand.length > 0) {
            // Switch to split hand if main hand busts
            activeHand = 'split';
            renderHands.call(this);
        } else {
            hitButton.disabled = true;
            standButton.disabled = true;
            dealButton.disabled = false;
            splitButton.disabled = true;
            doubleButton.disabled = true;
        }
    }
}

function stand() {
    if (activeHand === 'main') {
        mainHandStood = true; // Mark the main hand as stood
        if (playerSplitHand.length > 0) {
            // Switch to the split hand if it exists
            activeHand = 'split';
            renderHands.call(this);
            return;
        }
    } else if (activeHand === 'split') {
        splitHandStood = true; // Mark the split hand as stood
    }

    // Dealer's turn
    dealerSecondCardHidden = false;
    renderHands.call(this);

    hitButton.disabled = true;
    standButton.disabled = true;
    splitButton.disabled = true;
    doubleButton.disabled = true;

    const dealerPlay = () => {
        if (calculateHand(dealerHand) < 17) {
            setTimeout(() => {
                dealerHand.push(deck.pop());
                renderHands.call(this);
                dealerPlay();
            }, dealerActionDelay);
        } else {
            renderHands.call(this);
            determineWinner.call(this);
        }
    };

    dealerPlay();
}

function determineWinner() {
    const mainHandScore = calculateHand(playerHand);
    const splitHandScore = playerSplitHand.length > 0 ? calculateHand(playerSplitHand) : null;
    const dealerScore = calculateHand(dealerHand);

    let resultMessage = '';

    // Evaluate the main hand
    if (mainHandScore > 21) {
        resultMessage += 'Main hand busts! Dealer wins!';
    } else if (mainHandScore > dealerScore || dealerScore > 21) {
        resultMessage += 'Main hand wins!';
        payout('main', 2); // payout
    } else if (dealerScore > mainHandScore) {
        resultMessage += 'Dealer wins against main hand!';
    } else {
        resultMessage += 'Main hand pushes!';
        payout('main', 1); // push
    }

    // Evaluate the split hand (if it exists)
    if (splitHandScore !== null) {
        if (splitHandScore > 21) {
            resultMessage += ' Split hand busts! Dealer wins!';
        } else if (splitHandScore > dealerScore || dealerScore > 21) {
            resultMessage += ' Split hand wins!';
            payout('split', 2); // payout
        } else if (dealerScore > splitHandScore) {
            resultMessage += ' Dealer wins against split hand!';
        } else {
            resultMessage += ' Split hand pushes!';
            payout('split', 1); // push
        }
    }

    messageText.textContent = resultMessage;
    nextRoundButton.disabled = false;

    // Disable the "Deal" button until the next round starts
    dealButton.disabled = true;
    bet5Button.disabled = true;
}

function placeBet(amount) {
    if (amount > bank) {
        messageText.textContent = 'Not enough funds to place this bet!';
        return;
    }

    if (activeHand === 'main') {
        betMain += amount;
    } else if (activeHand === 'split') {
        betSplit += amount;
    }

    bank -= amount;
    messageText.textContent = `You bet $${amount}. Remaining bank: $${bank}`;
    updateBankUI();
    updateBetUI();
}

function payout(hand, multiplier) {
    const bet = hand === 'main' ? betMain : betSplit;
    const winnings = bet * multiplier;
    bank += winnings;
    updateBankUI();
}

/*
/ Function to update the bank and betting UI
*/

function updateBankUI() {
    const bankText = document.getElementById('bank-amount');
    bankText.textContent = bank;
}

function updateBetUI() {
    const betText = document.getElementById('current-bet');
    if (betSplit > 0) {
        betText.textContent = `$${betMain} / $${betSplit}`; // Show both bets if splitting
    } else {
        betText.textContent = `$${betMain}`;
    }
}

// Function to reset the game state for the next round
function nextRound() {
    // Reset game state
    playerHand = [];
    playerSplitHand = [];
    dealerHand = [];
    dealerSecondCardHidden = true;
    mainHandStood = false;
    splitHandStood = false;
    activeHand = 'main';

    // Clear the screen of rendered cards
    this.children.removeAll();

    // Reset bets
    betMain = minBet; // Reset main bet to the minimum bet
    betSplit = 0; // Reset split bet
    if (bank >= minBet) {
        bank -= minBet; // Deduct the minimum bet from the bank
    } else {
        messageText.textContent = 'Not enough funds to place the minimum bet!';
    }

    // Enable betting
    bet5Button.disabled = false;
    dealButton.disabled = false;
    nextRoundButton.disabled = true;

    messageText.textContent = 'Place your bets for the next round!';
    updateBetUI();
    updateBankUI();
}

function double() {
    const currentBet = activeHand === 'main' ? betMain : betSplit;

    // Check if the player has enough funds to double
    if (bank < currentBet) {
        messageText.textContent = 'Not enough funds to double!';
        return;
    }

    // Double the bet
    if (activeHand === 'main') {
        betMain *= 2;
    } else if (activeHand === 'split') {
        betSplit *= 2;
    }
    bank -= currentBet;

    updateBankUI();
    updateBetUI();

    if (activeHand === 'main') {
        playerHand.push(deck.pop());
    } else if (activeHand === 'split') {
        playerSplitHand.push(deck.pop());
    }

    renderHands.call(this);

    // Force the player to stand after doubling
    messageText.textContent = activeHand === 'main' ? 'Main hand doubled and forced to stand.' : 'Split hand doubled and forced to stand.';
    stand.call(this);
}