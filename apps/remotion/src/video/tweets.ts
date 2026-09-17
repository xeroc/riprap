/** Quoted posts — the evidence wall for S0 · fear (f0–120).
 * Verbatim from x.com (fetched 2026-09-17 via Twitter’s syndication API);
 * hammering order is the approved list. Provenance: the url on each record.
 * bunjil opens as the center tweet and returns once in the hammer — on purpose. */
export interface Tweet {
  author: string;
  handle: string;
  text: string;
  date: string;
  url: string;
  /** local asset under public/ (e.g. "avatars/bunjil.jpg") — staticFile()'d by the scene */
  avatar?: string;
}

export const CENTER_TWEET: Tweet = {
  author: "bunjil",
  handle: "bunjil",
  text: "at london breakpoint 😃🤙\n\ngetting stabbed 😱🔪\n\nat 1 billion TPS 🤯🚀",
  date: "Dec 12, 2025",
  url: "https://x.com/bunjil/status/1999412271404187937",
  avatar: "avatars/bunjil.jpg",
};

export const HAMMER_TWEETS: Tweet[] = [
  {
    author: "Mkaycrypt",
    handle: "MikayaBala",
    text: "Solana Breakpoint  2026 in London?\n\nCT Right Now.😨😓\n\nTouch don't London no more shit posting or you get bursted.🙄🧐\n\nNo more trolling or get tracked. 🥱\n\nNo more selling yourself out there or you get stabbed. 🗡️ \n\nPersonal safety rather than wallet security.😂\n\n@bad_chain https://t.co/P2ouLeDwGr",
    date: "Dec 20, 2025",
    url: "https://x.com/MikayaBala/status/2002385529174630635",
    avatar: "avatars/MikayaBala.jpg",
  },
  {
    author: "Jeba🍊$ign",
    handle: "khokonbro98",
    text: "“London is too dangerous for Breakpoint, you’ll get stabbed” 😭\nBe real. London has 220k+ millionaires whose wealth didn’t come from JPEGs or shitcoins. You think anyone’s hunting your staked $JUP in Soho?\nThis city hosts Wimbledon, the London Marathon, NFL London, and nonstop https://t.co/89govrWhr5",
    date: "Dec 22, 2025",
    url: "https://x.com/khokonbro98/status/2002975387710787592",
    avatar: "avatars/khokonbro98.jpg",
  },
  {
    author: "franky hossie",
    handle: "FHossie5536",
    text: "Breakpoint London: where builders meet… and get stabbed by last-minute testnet bugs. Nothing says “knife to meet you” like your demo crashing live. @bad_chain https://t.co/8MzBpR6JvT",
    date: "Dec 21, 2025",
    url: "https://x.com/FHossie5536/status/2002565096820908429",
    avatar: "avatars/FHossie5536.jpg",
  },
  {
    author: "bunjil",
    handle: "bunjil",
    text: "at london breakpoint 😃🤙\n\ngetting stabbed 😱🔪\n\nat 1 billion TPS 🤯🚀",
    date: "Dec 12, 2025",
    url: "https://x.com/bunjil/status/1999412271404187937",
  },
  {
    author: "Phav🙂",
    handle: "phav_3d",
    text: "The Solana community is roasting Breakpoint London 2026 fears with knife crime memes 😭\n\nCrypto bros really think they're getting stabbed in Soho while chasing $JUP gains. Meanwhile London hosts 220k+ millionaires and runs global finance.\n@bad_chain https://t.co/rMH9z1aJ8T",
    date: "Dec 19, 2025",
    url: "https://x.com/phav_3d/status/2002092427683979371",
    avatar: "avatars/phav_3d.jpg",
  },
  {
    author: "Rollex🪷",
    handle: "shemol_mojumder",
    text: "“London is too dangerous for Breakpoint, you’ll get stabbed” 😭\n\nBe serious. London has 220k+ millionaires whose wealth isn’t built on JPEGs or shitcoins. You think anyone’s hunting your staked $JUP in Soho?\n\nThis city hosts Wimbledon, the London Marathon, NFL London, and nonstop https://t.co/JRg3KOsIHb",
    date: "Dec 19, 2025",
    url: "https://x.com/shemol_mojumder/status/2001920823519838659",
    avatar: "avatars/shemol_mojumder.jpg",
  },
  {
    author: "KAISER",
    handle: "Kaiserofweb3",
    text: 'Solana Moves Breakpoint to London. Crypto Collectively Loses Its Mind.\nSolana: "Breakpoint is in London."\nCrypto: buys chainmail\n"Why?"\n"KNIVES."\nSir. It\'s a city. With tea.\nwhat actually happened:\nSolana said we\'re going global. time to compete. time to be serious.\nCrypto said https://t.co/BTs5lC5VKl',
    date: "Dec 23, 2025",
    url: "https://x.com/Kaiserofweb3/status/2003482582478987670",
    avatar: "avatars/Kaiserofweb3.jpg",
  },
  {
    author: "Campbell Easton",
    handle: "MrCampbell",
    text: "Breakpoint 2026 will be in London?\n\nI got a great merch idea: branded stab vests. https://t.co/DvXouKG7z0",
    date: "Dec 12, 2025",
    url: "https://x.com/MrCampbell/status/1999421350276894746",
    avatar: "avatars/MrCampbell.jpg",
  },
  {
    author: "peach ♡",
    handle: "foidologist",
    text: "london has annoying street crime but the idea you’re gonna get randomly stabbed while attending breakpoint is preposterous\n\n&gt;random violent attacks on tourists are extremely rare \n&gt;the event will be in central london, a heavily populated and surveilled area\n&gt;yes there are phone",
    date: "Dec 13, 2025",
    url: "https://x.com/foidologist/status/1999915927698080230",
    avatar: "avatars/foidologist.jpg",
  },
  {
    author: "Naruto11.eth",
    handle: "naruto11eth",
    text: "getting stabbed at Breakpoint London do be sounding better than being in Abu Dhabi now lmaoo",
    date: "Feb 28, 2026",
    url: "https://x.com/naruto11eth/status/2027696683497500843",
    avatar: "avatars/naruto11eth.jpg",
  },
  {
    author: "nftimm | thesyndicate.games",
    handle: "nftimm",
    text: "“OMG HOW CAN WE HAVE BREAKPOINT IN A PLACE YOU’RE HIGHLY LIKEY TO GET STABBED.”\n\n🤔🤔🤔\n\nLondon Knife death rate: \n0.4 per 100,000\n\nUS Gun death rate: \n13 per 100,000\n\nTWENTY-SIX TIMES HIGHER.",
    date: "Dec 13, 2025",
    url: "https://x.com/nftimm/status/1999708240217821548",
    avatar: "avatars/nftimm.jpg",
  },
  {
    author: "Noah",
    handle: "redacted_noah",
    text: "My biggest fear for Breakpoint London is that Londoners won’t understand our cultural differences. \n\nAs an American, I’d rather be shot than stabbed.",
    date: "Dec 17, 2025",
    url: "https://x.com/redacted_noah/status/2001090437499724219",
    avatar: "avatars/redacted_noah.jpg",
  },
  {
    author: "0xDistro",
    handle: "0xDistro_",
    text: "“London is too dangerous for Breakpoint, you’ll get stabbed” 😭\n\nMy brother in Christ, London has 220k+ millionaires whose net worth isn’t based on JPEGs and shitcoins.\n\nYou think they’re hunting your staked $JUP in Soho? Be serious.\n\nThis city hosts Wimbledon, the London",
    date: "Dec 15, 2025",
    url: "https://x.com/0xDistro_/status/2000615240984064186",
    avatar: "avatars/0xDistro_.jpg",
  },
  {
    author: "vibhu",
    handle: "vibhu",
    text: "Everyone is wrong about London:\n\n- Cracked Solana devs\n- Unreal food\n- Didn’t get stabbed \n\nWas awesome to spend the day with @SuperteamUK teams:\n\n@HawkFi_\n@Otus_Finance\n@ikadotxyz \n@encrypt_xyz\n@cherrydotfun\n@Solana_SRI\n@SimplicityWeb3\n@lo_tech\n@frontiertechs\n@rivestor_co https://t.co/5Hbwb2eX7A",
    date: "Aug 29, 2026",
    url: "https://x.com/vibhu/status/2093700807359139973",
    avatar: "avatars/vibhu.jpg",
  },
];
