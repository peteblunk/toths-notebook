🏺 Operation: Empty Jars
Detailed Phased Campaign for Zero-Knowledge Architecture
Status: Initiation Phase

Architect: Scribe Peter

Guardian: Djehuty

Objective: Transition the "Thoth Terminal" from clear-text storage to a Client-Side Encrypted (CSE) "Zero-Knowledge" system, ensuring that even the server (Firestore) cannot read the sacred "Daily Rituals."

Guiding Development Principles: Rule of Ptah

🏛️ Phase 1: The Hidden Forge (Cryptographic Foundation)
Focus: Establishing the mathematical laws of the Inner Sanctum.

[X] 1.1 The Web Crypto Engine: Create src/lib/crypto.ts to house the "Magic Ink."

Implement generateMasterKey(): A 256-bit AES-GCM "Golden Key."

Implement deriveWrappingKey(password, salt): Using PBKDF2 to turn user passwords into a protective shield for the Golden Key.

[-] 1.2 The 12-Word Mnemonic: Implement the BIP-39 standard to generate a human-readable recovery phrase. MOVED TO PHASE II

[X] 1.3 Local Storage Strategy: Use IndexedDB (via idb or localforage) to store the "Wrapped" Master Key locally so the user doesn't have to re-enter their password every single time they breathe.

[X] 1.4 Prototype Test: A "Trial Jar" page to verify that text can be encrypted and decrypted locally without errors.

🏮 Phase 2: The Istanbul Protocol (The Security Interface)
Focus: Building the Obelisk and the user ritual.

[-] 2.0  The 12-Word Mnemonic: Implement the BIP-39 standard to generate a human-readable recovery phrase. MOVED to PHASE III

[X] 2.1 The Istanbul Dial: Create the CyberObelisk component in the Scribe's Dossier.

Implement the 3x4 Glyph Grid inspired by the Theodosius Obelisk.

Map the 12 specific SVG glyphs (The Sun, The Ankh, The Falcon, etc.).

[X] 2.2 The Pattern Lock: Logic to capture and hash a 4-glyph sequence.

[-] 2.3 The "Stash" Vault: Create the UI for the "Oblique Hint" system.MOVED TO PHASE III

A way for users to save clues (e.g., "The screenshot date") rather than the words themselves.

[-] 2.4 Visual Feedback: Implement "Organo-Cyber" animations—haptic "thuds" on press and luminous circuit-glow upon successful sequence entry. MOVED TO PHASE III

[X]

🏗️ Phase 3: The Great Migration (The Transition of Streaks)
Focus: Moving existing "Living History" into the Jars without breaking the streaks.
[] 3.0  The 12-Word Mnemonic: Implement the BIP-39 standard to generate a human-readable recovery phrase. MOVED HERE FROM PHASE II

[ ] 3.0.1 The "Stash" Vault: Create the UI for the "Oblique Hint" system. MOVED HERE FROM PHASE II

[ ]  3.0.2sual Feedback: Implement "Organo-Cyber" animations—haptic "thuds" on press and luminous circuit-glow upon successful sequence entry. MOVED FROM PHASE II

[ ] 3.1 Schema Evolution: Prepare Firestore to handle "Encrypted Blobs" instead of "String Fields."

[ ] 3.2 The Migration Ritual: Build a "One-Time" bridge logic.

If user has old data: Prompt for encryption setup -> Encrypt old data -> Write to new "Sealed Jars" -> Mark user as isEncrypted: true.

[ ] 3.3 The Safety Net: Keep the old clear-text data in a deprecated_rituals collection for 30 days as a "Tomb Guard" against data loss.

[ ] 3.4 Streak Preservation: Ensure the completionDate and streakCount metadata remain unencrypted (or deterministic) so the app can still celebrate the user's consistency without needing to "read" the task content.

📜 The Sacred Constraints (The Ma'at of Code)
Zero Visibility: The server MUST NEVER see the Password, the 12-words, or the Master Key in plain text.

Persistence: The Master Key should survive a page refresh (via local storage) but be "Wiped" upon Logout.

Simplicity: The transition must feel like a "Level Up," not a "Hard Reset."

"The stone does not hold the secret; it holds the path to the secret. When the Jars are empty to the world, they are full to the Scribe."