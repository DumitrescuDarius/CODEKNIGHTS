const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = {
  "The Guard's Patrol": {
    description: "The Royal Guard must meticulously document every checkpoint along their patrol route to ensure the castle grounds remain secure. As the Captain of the Guard, you have been tasked with generating a sequence of numeric identifiers representing these checkpoints in perfectly ascending order. The peace of the kingdom relies on this patrol path being generated precisely without failure.",
    inputFormat: "A single integer N, representing the total number of checkpoints on the patrol route (1 <= N <= 1000).",
    outputFormat: "A single line containing the numbers 1 to N separated by a single space.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Siege Tower's Ladder": {
    description: "During a fierce siege, the King's soldiers must ascend the massive siege tower. To ensure the ladder can bear the weight, the quartermaster is recording the number of steps each soldier takes. You must calculate the absolute total number of steps taken by the entire battalion to evaluate the structural integrity of the siege tower.",
    inputFormat: "The first line contains an integer N (the number of soldiers). The next N lines each contain a single integer representing the steps taken by that soldier.",
    outputFormat: "A single integer representing the grand total of all steps.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Archer's Range": {
    description: "The Royal Archers are training for the upcoming tournament. They have placed numerous wooden targets across the field at varying distances. To optimize their practice, the archer commander wishes to sort the targets strictly by their distance from the firing line in ascending order. You must provide the sorted list of target distances.",
    inputFormat: "The first line contains an integer N (number of targets). The second line contains N integers representing the distance of each target.",
    outputFormat: "A single line containing the N distances sorted in ascending order.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The King's Catapult Payload": {
    description: "The siege engineers are loading the mighty catapults with boulders. Each catapult must be loaded with a fresh, specific set of boulders before it fires. The King wants a detailed report of the total payload weight launched by each individual catapult. It is imperative that the payload weights for one catapult do not accidentally mix with another!",
    inputFormat: "The first line contains the number of catapults N. Then N groups of integers follow: the first integer in a group is the number of boulders C, followed by C integers representing the weights of those boulders.",
    outputFormat: "For each catapult, print 'Fired: <total_weight>' on a new line.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Peasant's Toll": {
    description: "A newly constructed bridge requires peasants to pay a toll in copper coins. The Tax Collector wishes to determine the exact average toll collected per peasant on any given day. You are to write a script that calculates this average with absolute precision, formatted to exactly two decimal places.",
    inputFormat: "Two space-separated integers: C (total copper collected) and P (number of peasants).",
    outputFormat: "A single floating-point number representing the average, formatted to 2 decimal places.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Alchemist's Potion Mix": {
    description: "The Grand Alchemist is preparing a legendary brew. He has a vast collection of raw potions, but adding a potion that is too powerful will cause the cauldron to explode. Given a maximum target power, you must select all potions that are safe to use (power <= target) and combine their power to find the final potency of the brew.",
    inputFormat: "The first line contains two integers: N (number of potions) and T (target maximum power). The second line contains N integers representing the power of each potion.",
    outputFormat: "A single integer representing the sum of the powers of all safe potions.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Knight's Tour": {
    description: "A knight is undertaking a grand tour across the realm, visiting various fiefdoms. To prove his valor, the knight must verify that he has visited the correct number of distinct regions. Your task is to process the logs of his journey and calculate the total distance traveled without miscounting any segments.",
    inputFormat: "The first line contains an integer N (number of segments). The next N lines contain the distances.",
    outputFormat: "A single integer representing the total distance.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Cursed Double-Edged Sword": {
    description: "In the arena, knights duel using enchanted swords. When two knights clash, their swords strike simultaneously. You must simulate the outcome of a grand melee where knights pair off and attack each other exactly once, then output their resulting health points.",
    inputFormat: "The first line contains an even integer N (number of knights). The next N lines each contain a string (sword name), an integer (damage), and an integer (health).",
    outputFormat: "For each pair of knights (i and i+1), print their remaining health after one simultaneous strike.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Dragon's Breath": {
    description: "A fearsome dragon is unleashing blasts of fire upon the valley. The Royal Historians only care to record the blasts that are hot enough to melt steel. Given a sequence of fire blasts, you must filter out any blast that falls below the critical temperature threshold, preserving the exact chronological order of the remaining blasts.",
    inputFormat: "The first line contains N (number of blasts) and T (minimum temperature threshold). The second line contains N integers representing the temperature of each blast.",
    outputFormat: "A single line containing the temperatures of all blasts >= T, separated by spaces.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Queen's Crown": {
    description: "The Royal Jeweler is crafting a new crown for the Queen. The crown is meant to hold exactly three legendary gemstones. However, the Queen has decreed that the center gemstone must ALWAYS be a 'Diamond', regardless of what was originally planned. Update the crown's arrangement accordingly.",
    inputFormat: "A single line containing three space-separated strings representing the original planned gemstones.",
    outputFormat: "A single line containing three strings: the first gemstone, 'Diamond', and the third gemstone.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Jester's Riddle": {
    description: "The Court Jester loves to speak in riddles by completely reversing his words. The King is growing impatient and demands a translator. Your task is to take the Jester's encrypted string and reverse it character by character so the King can understand it.",
    inputFormat: "A single string S without spaces (length <= 100).",
    outputFormat: "The reversed string S.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Wizard's Spellbook": {
    description: "A wandering Wizard is organizing his magical knowledge. Whenever he discovers a new spell, he inscribes it into a fresh, completely empty spellbook. You will be given two spells. Inscribe each spell into its own separate spellbook, and then output the sum of the number of spells in both books (which should always be 2).",
    inputFormat: "The first token is the number 2. The next two tokens are strings representing the two spell names.",
    outputFormat: "A single integer representing the total count of spells across both newly created books.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Moat's Depth": {
    description: "The Castle Architect is surveying the defensive moat. He has taken several depth measurements around the perimeter and needs to calculate the precise average depth of the water. The King demands accuracy, so the result must be reported as a decimal value.",
    inputFormat: "The first line contains an integer N. The next N integers represent the depth measurements.",
    outputFormat: "A single floating-point number representing the average depth, formatted to 2 decimal places.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Royal Treasury's Broken Vault": {
    description: "The King's Royal Vault has malfunctioned. The Treasurer needs a script to tally the gold coins deposited throughout the week. Read in the deposits and calculate the grand total without losing a single coin to the ether.",
    inputFormat: "An integer N, followed by N integers representing gold deposits.",
    outputFormat: "A single integer representing the total gold.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Squire's Inventory": {
    description: "A young Squire is tasked with organizing the armory. He must compare the serial numbers stamped onto two newly forged shields to see if they are from the same batch. Since serial numbers can be massive, the matching system must be absolutely flawless.",
    inputFormat: "Two integers A and B, representing the serial numbers.",
    outputFormat: "Print 'Match' if the serial numbers are identical, otherwise print 'Mismatch'.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Merchant's Coin": {
    description: "A wealthy merchant is cataloging his unique exotic items. However, rumor has it that a 'cursed_coin' has found its way into his inventory. To protect his fortune, he must construct a set of his unique items and strictly remove the 'cursed_coin' if it exists, before counting how many unique safe items he possesses.",
    inputFormat: "The first token is N (total items). The next N tokens are strings representing the items.",
    outputFormat: "A single integer representing the number of unique items, excluding 'cursed_coin'.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Messenger's Cipher": {
    description: "A royal messenger carries a ciphered parchment. To decode the message, he must shift every alphabetical character by a specific offset. Help him automate this decoding process so the King can read the urgent news.",
    inputFormat: "A string S and an integer K (the shift offset).",
    outputFormat: "The decoded string.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Castle Wall Defense": {
    description: "The siege engineers are evaluating the strength of the castle walls. The total defensive capability is defined as the sum of the squares of the thickness of each wall segment. Calculate this defensive rating.",
    inputFormat: "An integer N, followed by N integers representing the thickness of each wall segment.",
    outputFormat: "A single integer representing the total defensive rating.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The Blacksmith's Chain": {
    description: "The Master Blacksmith is forging a heavy iron chain. To ensure it won't snap under tension, he needs to find the weakest link. Traverse the list of link strengths and output the minimum strength value found.",
    inputFormat: "An integer N, followed by N integers representing the strength of each link.",
    outputFormat: "A single integer representing the minimum strength.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  },
  "The King's Banquet": {
    description: "The King is hosting a grand banquet. The initial guest list is drawn up, but unfortunately, one of the nobles has been caught in a scandal and must be completely uninvited. You must remove all instances of the disgraced noble's name from the list and report the final number of attendees.",
    inputFormat: "The first token is N (number of guests). The next N tokens are the names on the guest list. The final token is the name of the disgraced noble who canceled.",
    outputFormat: "A single integer representing the final guest count.",
    restrictions: "Time Limit: 1.0s, Memory Limit: 256MB."
  }
};

async function run() {
    for (const [title, data] of Object.entries(updates)) {
        await prisma.question.updateMany({
            where: { title: title },
            data: data
        });
        console.log('Updated metadata for', title);
    }
}
run();
