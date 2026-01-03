export const PTAH_CONFIG = {
  version: "1.3.3", // Incremented for the Khepri & Library Restoration
  title: "THE SCRIBE'S DOSSIER AND CHRONO-MERKHET INITIATION",
  date: "January 02, 2026 A.D. - Year 5526 of the Old Kingdom",
  type: "ACCOUNTING_TEMPORAL",

  intro: "The temple architecture has evolved. Your digital identity is now anchored in the Scribe Dossier. Tap your avatar in the sidebar footer to enter your personal sanctuary. Installation of the Thoth Chip is initiated through the dossier. Additional data on your journey will be collected as the Temple expands its reach.",

  // The "What's New" Section
  changes: [
    {
      icon: "T-Chip", 
      title: "Thoth Chip Installation",
      description: "Adding the Thoth Chip to your homescreen can now be initiated directly from the Scribe Dossier. Visit your Dossier to permanently seal this interface to your device for full-screen, focused access.",
    },
    {
      icon: "Scroll", 
      title: "The Chrono-Merkhet",
      description: "It has long been the intention to expand the Invoke Khonsu time to chronometer function - for when the quantity of time is of unknown duration. Access this feature by tapping on the head of Khonsu four times.",
    },
    
  ],

  // The "How to Use" Section
  instructions: [
    "1. ACCESS THE DOSSEIR: Tap your Scribe identity in the sidebar footer to enter the Inner Sanctum and view your current Rank and Temple Connection status.",
    "2. ADD THOTH CHIP TO YOUR DEVICE: Within the Dossier, locate the Thoth Chip Altar. If your connection is 'Weak', tap 'Invoke Installation' to anchor the sanctuary to your home screen.",
    "3. INITIATE CHRONO-MERKHET: To access the hidden Chrono-Merkhet (Stopwatch), perform the Four-Tap Ritual on the lunar head of Khonsu in the primary sanctuary.",
    "4. CONTACT THE TEMPLE: As always -  prayers, inquiries, reports of peculiarities to: rites@unclepetelaboratories.net"
  ],

 devNote: "Refactored the installation heka into the use-PWA hook, decoupling the Thoth Chip from the viewport-sentinel to allow manual invocation within the Scribe Dossier. The Merkhet digits have been justified at scaleY(1.6) to ensure the weight of time is felt. By centralizing the Registry of Souls, we have prepared the ground for the Grand Library's final integration. Order is absolute."
};