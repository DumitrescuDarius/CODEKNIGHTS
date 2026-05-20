import json

problems = [
  {
    "title": "The Royal Armory",
    "difficulty": "Easy",
    "description": "A blacksmith has forged a collection of N swords, each stamped with a single uppercase character rune representing its metal alloy type (e.g., 'I' for Iron, 'S' for Steel). The King wants to know if there is a dominant alloy—one that appears strictly more than N / 2 times in the collection.

**Examples:**
- `IISII` → `I` ('I' appears 4 times out of 5, which is greater than 2.5)
- `ISSI` → `NONE` ('I' and 'S' both appear 2 times out of 4, which is not strictly greater than 2)",
    "inputFormat": "Line 1: a single integer N — the number of swords.
Line 2: a string of length N containing uppercase character runes.",
    "outputFormat": "Print the character of the dominant alloy, or `NONE` if no such alloy exists.",
    "restrictions": "Time limit: 1s | 1 ≤ N ≤ 10⁵",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "5
IISII", "output": "I" },
      { "input": "4
ISSI", "output": "NONE" }
    ],
    "hiddenTestCases": [
      { "input": "1
X", "output": "X" },
      { "input": "6
AAAAAA", "output": "A" },
      { "input": "6
AAABBB", "output": "NONE" },
      { "input": "7
ABCABAA", "output": "A" }
    ]
  },
  {
    "title": "Dragon Fire Defense",
    "difficulty": "Easy",
    "description": "A line of N soldiers stand with shields of varying durabilities to protect the castle. A dragon breathes a blast of fire with an intensity of K. Every shield with a durability value strictly less than K will shatter under the intense heat. Count how many soldiers will survive the blast with intact shields.

**Examples:**
- Durabilities `[3, 6, 5, 8]` with fire intensity `5` → `3` (shields with values 6, 5, and 8 survive; 3 shatters)",
    "inputFormat": "Line 1: two space-separated integers N (number of soldiers) and K (fire intensity).
Line 2: N space-separated integers representing the durability of each shield.",
    "outputFormat": "Print a single integer representing the number of surviving shields.",
    "restrictions": "Time limit: 1s | 1 ≤ N ≤ 10⁵ | 1 ≤ K, durability ≤ 10⁹",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "4 5
3 6 5 8", "output": "3" },
      { "input": "3 10
2 5 7", "output": "0" }
    ],
    "hiddenTestCases": [
      { "input": "5 1
1 2 3 4 5", "output": "5" },
      { "input": "1 100
100", "output": "1" },
      { "input": "6 50
10 20 30 40 50 60", "output": "2" }
    ]
  },
  {
    "title": "The Whispering Drawbridge",
    "difficulty": "Easy",
    "description": "To lower a magical enchanted drawbridge, a traveler must recite a holy phrase. The drawbridge will only lower if the phrase reads the same forwards and backwards (a palindrome), completely ignoring spaces. Case sensitivity does not matter (e.g., 'A' is equal to 'a').

**Examples:**
- `race car` → `OPEN`
- `royal guard` → `CLOSED`",
    "inputFormat": "Line 1: a single string S containing lowercase letters and spaces.",
    "outputFormat": "Print `OPEN` if the phrase is a valid palindrome when ignoring spaces, otherwise print `CLOSED`.",
    "restrictions": "Time limit: 1s | 1 ≤ length of S ≤ 10⁴",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "race car", "output": "OPEN" },
      { "input": "royal guard", "output": "CLOSED" }
    ],
    "hiddenTestCases": [
      { "input": "a", "output": "OPEN" },
      { "input": "taco cat", "output": "OPEN" },
      { "input": "knight thgink", "output": "OPEN" },
      { "input": "castle", "output": "CLOSED" }
    ]
  },
  {
    "title": "The Grand Banquet",
    "difficulty": "Easy",
    "description": "N lords have gathered at the round table for a royal feast. Each lord has a specific noble rank numerical value. To ensure seating arrangements don't trigger political tension, the court jester needs to quickly find the maximum rank difference between the highest-ranking lord and the lowest-ranking lord present.

**Examples:**
- Ranks `[10, 2, 5, 12]` → `10` (the maximum rank is 12, the minimum is 2, and 12 - 2 = 10)",
    "inputFormat": "Line 1: a single integer N — the number of lords.
Line 2: N space-separated integers representing the ranks of the lords.",
    "outputFormat": "Print a single integer representing the maximum difference between any two ranks.",
    "restrictions": "Time limit: 1s | 2 ≤ N ≤ 10⁵ | 1 ≤ rank ≤ 10⁹",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "4
10 2 5 12", "output": "10" },
      { "input": "3
7 7 7", "output": "0" }
    ],
    "hiddenTestCases": [
      { "input": "2
100 1", "output": "99" },
      { "input": "5
10 20 30 40 50", "output": "40" },
      { "input": "6
5 1 9 3 7 2", "output": "8" }
    ]
  },
  {
    "title": "The King's Archer",
    "difficulty": "Easy",
    "description": "N archers participate in a tournament, shooting arrows sequentially. They are assigned a 0-indexed ID from 0 to N - 1 based on their shooting order. Given an array of their final scores, determine the ID of the winning archer. If there is a tie for the highest score, the archer who shot earlier (the one with the smaller ID) wins.

**Examples:**
- Scores `[50, 90, 90, 30]` → `1` (both archer 1 and archer 2 scored 90, but archer 1 shot first)",
    "inputFormat": "Line 1: a single integer N — the number of archers.
Line 2: N space-separated integers representing the scores of the archers in order of their IDs.",
    "outputFormat": "Print the 0-indexed integer ID of the winning archer.",
    "restrictions": "Time limit: 1s | 1 ≤ N ≤ 10⁵ | 0 ≤ score ≤ 1000",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "4
50 90 90 30", "output": "1" },
      { "input": "3
10 20 30", "output": "2" }
    ],
    "hiddenTestCases": [
      { "input": "1
100", "output": "0" },
      { "input": "5
100 100 100 100 100", "output": "0" },
      { "input": "4
0 0 5 5", "output": "2" }
    ]
  },
  {
    "title": "The Merchant's Purse",
    "difficulty": "Medium",
    "description": "A merchant needs to pay a custom border tariff of exactly W gold pieces. The local kingdom utilizes only three specific coin denominations: 1-gold coins, 5-gold coins, and 10-gold coins. Find the absolute minimum number of total coins the merchant must pull from their purse to settle the exact tariff amount W.

**Examples:**
- Tariff `18` → `5` (one 10-gold coin, one 5-gold coin, and three 1-gold coins: 1 + 1 + 3 = 5)",
    "inputFormat": "Line 1: a single integer W — the total tariff amount.",
    "outputFormat": "Print a single integer representing the minimum number of coins needed.",
    "restrictions": "Time limit: 1s | 0 ≤ W ≤ 10⁶",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "18", "output": "5" },
      { "input": "6", "output": "2" }
    ],
    "hiddenTestCases": [
      { "input": "0", "output": "0" },
      { "input": "10", "output": "1" },
      { "input": "25", "output": "3" },
      { "input": "99", "output": "14" }
    ]
  },
  {
    "title": "Shield Wall Formation",
    "difficulty": "Medium",
    "description": "A vanguard of N soldiers stands in a tight row, each possessing a specific defensive combat power rating. The commander wants to find the length of the shortest contiguous segment of soldiers whose total combined power rating is at least K, ensuring a localized unbreakable shield wall. If no such segment exists, print -1.

**Examples:**
- Powers `[2, 3, 1, 5, 6]` with K = `11` → `2` (the contiguous segment `[5, 6]` sums to 11, which is the shortest possible length)",
    "inputFormat": "Line 1: two space-separated integers N (number of soldiers) and K (target power rating).
Line 2: N space-separated positive integers representing individual power ratings.",
    "outputFormat": "Print the length of the shortest contiguous segment of soldiers whose power sum is greater than or equal to K. If impossible, print -1.",
    "restrictions": "Time limit: 1s | 1 ≤ N ≤ 10⁵ | 1 ≤ K ≤ 10⁹ | 1 ≤ power ≤ 10⁵",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "5 11
2 3 1 5 6", "output": "2" },
      { "input": "3 20
2 4 3", "output": "-1" }
    ],
    "hiddenTestCases": [
      { "input": "6 7
1 2 3 4 5 6", "output": "2" },
      { "input": "1 5
5", "output": "1" },
      { "input": "5 15
1 2 3 4 5", "output": "5" }
    ]
  },
  {
    "title": "The Watchtowers of Yar",
    "difficulty": "Medium",
    "description": "The kingdom of Yar has N watchtowers built sequentially in a straight line from west to east, spaced exactly 1 kilometer apart. Each tower has a designated height. For each watchtower, guards want to calculate how many kilometers east they must look to spot the next tower that is strictly taller than their own. If no taller tower exists to their east, the value for that tower is 0.

**Examples:**
- Heights `[73, 74, 75, 71]` → `1 1 0 0` (The next taller tower after 73 is 74 [1km east], after 74 is 75 [1km east], and 75 has no taller tower to its east).",
    "inputFormat": "Line 1: a single integer N — the number of watchtowers.
Line 2: N space-separated integers representing the heights of the towers from west to east.",
    "outputFormat": "Print N space-separated integers representing the distance to the next taller tower for each respective tower.",
    "restrictions": "Time limit: 1s | 1 ≤ N ≤ 10⁵ | 1 ≤ height ≤ 10⁵",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "4
73 74 75 71", "output": "1 1 0 0" },
      { "input": "5
30 20 10 40 50", "output": "3 2 1 1 0" }
    ],
    "hiddenTestCases": [
      { "input": "1
10", "output": "0" },
      { "input": "4
40 30 20 10", "output": "0 0 0 0" },
      { "input": "4
10 20 30 40", "output": "1 1 1 0" }
    ]
  },
  {
    "title": "Dungeon Escape",
    "difficulty": "Medium",
    "description": "A heroic knight is trapped in a dark castle grid dungeon of size R × C. The dungeon layout consists of walkable paths (`.`), solid stone walls (`#`), the knight's starting location (`S`), and the hidden hatch escape (`E`). The knight can move up, down, left, or right into adjacent path cells. Find the minimum number of steps required to reach the escape hatch. If the path is entirely blocked, print -1.

**Examples:**
- Grid:
  S.#
  ..#
  ..E → 4 steps",
    "inputFormat": "Line 1: two space-separated integers R and C — the grid dimensions.
Next R lines: strings of length C representing the dungeon rows.",
    "outputFormat": "Print a single integer representing the minimum steps to reach the escape hatch, or -1 if unreachable.",
    "restrictions": "Time limit: 1s | 1 ≤ R, C ≤ 500",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "3 3
S.#
..#
..E", "output": "4" },
      { "input": "2 2
S#
#E", "output": "-1" }
    ],
    "hiddenTestCases": [
      { "input": "1 2
SE", "output": "1" },
      { "input": "3 4
S...
###.
...E", "output": "5" },
      { "input": "4 4
S...
....
....
...E", "output": "6" }
    ]
  },
  {
    "title": "The Fragmented Kingdom",
    "difficulty": "Medium",
    "description": "A sprawling medieval kingdom contains V villages (numbered 1 to V) and E bidirectional muddy dirt roads connecting pairs of villages. Due to heavy structural fracturing and bandit raids, the kingdom has split into isolated regional clusters. Villages within the same cluster can reach one another through some sequence of roads, but cannot reach villages in other clusters. Calculate the total number of isolated clusters present in the kingdom.

**Examples:**
- 4 villages, 2 roads: `1-2` and `3-4` → `2` clusters (Cluster 1: {1, 2}, Cluster 2: {3, 4})",
    "inputFormat": "Line 1: two space-separated integers V (villages) and E (roads).
Next E lines: two space-separated integers U and W representing a bidirectional road between village U and village W.",
    "outputFormat": "Print a single integer representing the total number of isolated clusters.",
    "restrictions": "Time limit: 1s | 1 ≤ V ≤ 10⁴ | 0 ≤ E ≤ 2 * 10⁴",
    "idealComplexity": "O(1)",
    "testCases": [
      { "input": "4 2
1 2
3 4", "output": "2" },
      { "input": "3 0", "output": "3" }
    ],
    "hiddenTestCases": [
      { "input": "1 0", "output": "1" },
      { "input": "5 4
1 2
2 3
3 4
4 5", "output": "1" },
      { "input": "4 3
1 2
2 3
1 3", "output": "2" }
    ]
  }
]

with open('problems.json', 'w') as f:
    json.dump(problems, f, indent=2)
