const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Deleting old Bughunter questions...");
    const deleted = await prisma.question.deleteMany({
        where: { brokenCode: { not: null } }
    });
    console.log(`Deleted ${deleted.count} old Bughunter questions.`);

    const maxProblem = await prisma.question.aggregate({
        _max: { problemId: true }
    });
    
    let nextId = (maxProblem._max.problemId || 1000) + 1;

    console.log("Inserting new highly technical medieval Bughunter questions for each language...");

    const cppBroken = `#include <iostream>
#include <vector>
#include <string>
#include <cstring>

using namespace std;

class Sword {
public:
    char* name;
    int damage;
    
    Sword(const char* n, int d) {
        name = new char[strlen(n) + 1];
        strcpy(name, n);
        damage = d;
    }
    
    ~Sword() {
        delete[] name;
    }
};

class Knight {
public:
    Sword* weapon;
    int health;
    
    Knight(const char* swordName, int dmg, int h) {
        weapon = new Sword(swordName, dmg);
        health = h;
    }
    
    // BUG 1: Missing Copy Constructor
    // BUG 2: Missing Copy Assignment Operator
    
    ~Knight() {
        delete weapon;
    }
    
    void attack(Knight& other) {
        other.health -= weapon->damage;
    }
};

void battle(Knight k1, Knight k2) { 
    // BUG 3: Passing by value causes double free on exit!
    k1.attack(k2);
    k2.attack(k1);
    cout << k1.health << " " << k2.health << "\\n";
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    
    vector<Knight> knights;
    for (int i = 0; i < n; i++) {
        string name;
        int d, h;
        cin >> name >> d >> h;
        knights.push_back(Knight(name.c_str(), d, h));
    }
    
    for (int i = 0; i < n - 1; i += 2) {
        battle(knights[i], knights[i+1]);
    }
    return 0;
}`;

    const cppRef = `#include <iostream>
#include <vector>
#include <string>
#include <cstring>

using namespace std;

class Sword {
public:
    char* name;
    int damage;
    
    Sword(const char* n, int d) {
        name = new char[strlen(n) + 1];
        strcpy(name, n);
        damage = d;
    }
    
    ~Sword() {
        delete[] name;
    }
    
    // Deep copy for Sword
    Sword(const Sword& other) {
        name = new char[strlen(other.name) + 1];
        strcpy(name, other.name);
        damage = other.damage;
    }
    
    Sword& operator=(const Sword& other) {
        if (this != &other) {
            delete[] name;
            name = new char[strlen(other.name) + 1];
            strcpy(name, other.name);
            damage = other.damage;
        }
        return *this;
    }
};

class Knight {
public:
    Sword* weapon;
    int health;
    
    Knight(const char* swordName, int dmg, int h) {
        weapon = new Sword(swordName, dmg);
        health = h;
    }
    
    Knight(const Knight& other) {
        weapon = new Sword(*other.weapon);
        health = other.health;
    }
    
    Knight& operator=(const Knight& other) {
        if (this != &other) {
            delete weapon;
            weapon = new Sword(*other.weapon);
            health = other.health;
        }
        return *this;
    }
    
    ~Knight() {
        delete weapon;
    }
    
    void attack(Knight& other) {
        other.health -= weapon->damage;
    }
};

// Fixed pass by reference
void battle(Knight& k1, Knight& k2) { 
    k1.attack(k2);
    k2.attack(k1);
    cout << k1.health << " " << k2.health << "\\n";
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    
    vector<Knight> knights;
    for (int i = 0; i < n; i++) {
        string name;
        int d, h;
        cin >> name >> d >> h;
        knights.push_back(Knight(name.c_str(), d, h));
    }
    
    for (int i = 0; i < n - 1; i += 2) {
        battle(knights[i], knights[i+1]);
    }
    return 0;
}`;

    const javaBroken = `import java.util.*;

class Fiefdom {
    String name;
    int regionCode;

    public Fiefdom(String name, int regionCode) {
        this.name = name;
        this.regionCode = regionCode;
    }

    // BUG: Missing hashCode!
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Fiefdom fiefdom = (Fiefdom) obj;
        return regionCode == fiefdom.regionCode && Objects.equals(name, fiefdom.name);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        
        int n = scanner.nextInt();
        Map<Fiefdom, Integer> treasury = new HashMap<>();
        
        for (int i = 0; i < n; i++) {
            String name = scanner.next();
            int code = scanner.nextInt();
            int gold = scanner.nextInt();
            
            Fiefdom f = new Fiefdom(name, code);
            treasury.put(f, treasury.getOrDefault(f, 0) + gold);
        }
        
        // BUG: ConcurrentModificationException
        for (Fiefdom f : treasury.keySet()) {
            if (treasury.get(f) <= 0) {
                treasury.remove(f);
            }
        }
        
        List<Fiefdom> active = new ArrayList<>(treasury.keySet());
        active.sort(Comparator.comparing(f -> f.name));
        
        for (Fiefdom f : active) {
            System.out.println(f.name + " " + treasury.get(f));
        }
    }
}`;

    const javaRef = `import java.util.*;

class Fiefdom {
    String name;
    int regionCode;

    public Fiefdom(String name, int regionCode) {
        this.name = name;
        this.regionCode = regionCode;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Fiefdom fiefdom = (Fiefdom) obj;
        return regionCode == fiefdom.regionCode && Objects.equals(name, fiefdom.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, regionCode);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        
        int n = scanner.nextInt();
        Map<Fiefdom, Integer> treasury = new HashMap<>();
        
        for (int i = 0; i < n; i++) {
            String name = scanner.next();
            int code = scanner.nextInt();
            int gold = scanner.nextInt();
            
            Fiefdom f = new Fiefdom(name, code);
            treasury.put(f, treasury.getOrDefault(f, 0) + gold);
        }
        
        treasury.entrySet().removeIf(entry -> entry.getValue() <= 0);
        
        List<Fiefdom> active = new ArrayList<>(treasury.keySet());
        active.sort(Comparator.comparing(f -> f.name));
        
        for (Fiefdom f : active) {
            System.out.println(f.name + " " + treasury.get(f));
        }
    }
}`;

    const cBroken = `#include <stdio.h>
#include <stdlib.h>

struct Link {
    int durability;
    struct Link* next;
};

void add_link(struct Link** head, int d) {
    struct Link* new_link = (struct Link*)malloc(sizeof(struct Link));
    new_link->durability = d;
    new_link->next = *head;
    *head = new_link;
}

void reverse_chain(struct Link** head) {
    struct Link *prev = NULL, *current = *head, *next_node = NULL;
    
    while (current != NULL) {
        // BUG: Overwriting next before saving
        current->next = prev;
        prev = current;
        current = current->next;
    }
    
    *head = prev;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    
    struct Link* head = NULL;
    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        add_link(&head, val);
    }
    
    reverse_chain(&head);
    
    struct Link* temp = head;
    while (temp != NULL) {
        printf("%d ", temp->durability);
        temp = temp->next;
    }
    printf("\\n");
    
    return 0;
}`;

    const cRef = `#include <stdio.h>
#include <stdlib.h>

struct Link {
    int durability;
    struct Link* next;
};

void add_link(struct Link** head, int d) {
    struct Link* new_link = (struct Link*)malloc(sizeof(struct Link));
    new_link->durability = d;
    new_link->next = *head;
    *head = new_link;
}

void reverse_chain(struct Link** head) {
    struct Link *prev = NULL, *current = *head, *next_node = NULL;
    
    while (current != NULL) {
        next_node = current->next; // Save real next
        current->next = prev;
        prev = current;
        current = next_node;
    }
    
    *head = prev;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    
    struct Link* head = NULL;
    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        add_link(&head, val);
    }
    
    reverse_chain(&head);
    
    struct Link* temp = head;
    while (temp != NULL) {
        printf("%d ", temp->durability);
        temp = temp->next;
    }
    printf("\\n");
    
    return 0;
}`;

    const pythonBroken = `import sys

# BUG: Mutable default arguments accumulate values!
def load_catapult(boulder_weight, payload=[]):
    payload.append(boulder_weight)
    return payload

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    
    idx = 1
    for _ in range(n):
        boulders = int(input_data[idx])
        idx += 1
        
        # We want to load a fresh catapult each time
        for _ in range(boulders):
            w = int(input_data[idx])
            idx += 1
            catapult = load_catapult(w)
            
        print("Fired:", sum(catapult))

if __name__ == '__main__':
    main()`;

    const pythonRef = `import sys

def load_catapult(boulder_weight, payload=None):
    if payload is None:
        payload = []
    payload.append(boulder_weight)
    return payload

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    
    idx = 1
    for _ in range(n):
        boulders = int(input_data[idx])
        idx += 1
        
        catapult = []
        for _ in range(boulders):
            w = int(input_data[idx])
            idx += 1
            catapult = load_catapult(w, catapult)
            
        print("Fired:", sum(catapult))

if __name__ == '__main__':
    main()`;

    const bughunterQuestions = [
        {
            problemId: nextId++,
            title: "The Cursed Double-Edged Sword",
            description: "The Knights of the Realm are preparing for a grand tournament. The provided C++ code defines a `Knight` and a `Sword` class using raw dynamic memory allocation.\n\nHowever, this code is plagued by the curse of the Shallow Copy! It violently crashes with `free(): double free detected` due to a severe violation of the C++ Rule of Three/Five.\n\nYour quest: Debug and fix the memory management. Implement proper copy constructors and assignment operators, or modernize the code. Ensure the battle simulation completes and outputs the remaining health correctly.",
            difficulty: "CPP",
            timeLimit: 5000,
            memoryLimit: 256,
            brokenCode: JSON.stringify({ cpp: cppBroken }),
            referenceCode: JSON.stringify({ cpp: cppRef }),
            testCases: JSON.stringify([
                { input: "4\nExcalibur 50 100\nBroadsword 30 120\nDagger 15 80\nLongsword 40 110", output: "70 70\n40 95\n" },
                { input: "2\nIron 10 50\nSteel 20 50", output: "30 40\n" }
            ]),
            hiddenTestCases: JSON.stringify([
                { input: "6\nA 10 100\nB 10 100\nC 50 200\nD 100 200\nE 1 10\nF 2 10", output: "90 90\n100 150\n8 9\n" },
                { input: "2\nGlass 100 100\nGlass 100 100", output: "0 0\n" },
                { input: "4\nS1 0 10\nS2 0 10\nS3 5 5\nS4 5 5", output: "10 10\n0 0\n" },
                { input: "2\nWoodenSword 1 100\nStoneSword 2 100", output: "98 99\n" },
                { input: "8\nW1 10 50\nW2 10 50\nW3 20 50\nW4 20 50\nW5 30 50\nW6 30 50\nW7 40 50\nW8 40 50", output: "40 40\n30 30\n20 20\n10 10\n" },
                { input: "2\nA 0 100\nB 100 100", output: "0 100\n" },
                { input: "4\nX 100 100\nY 100 100\nZ 10 10\nW 10 10", output: "0 0\n0 0\n" },
                { input: "2\nMax 1000 1000\nMin 1 1", output: "999 -900\n" }
            ])
        },
        {
            problemId: nextId++,
            title: "The Royal Treasury's Broken Vault",
            description: "The King's Chancellor is trying to track the Royal Treasury's gold deposits from various fiefdoms using a Java `HashMap`.\n\nThere are two highly technical Java bugs here:\n1. The `Fiefdom` class overrides `equals()` but completely forgot to override `hashCode()`. This breaks the `HashMap` contract, scattering the gold!\n2. A `ConcurrentModificationException` occurs when the Chancellor tries to iterate over the map's key set and remove bankrupt fiefdoms using a standard for-each loop.\n\nFix the hashing contract and safely remove the bankrupt fiefdoms.",
            difficulty: "JAVA",
            timeLimit: 5000,
            memoryLimit: 256,
            brokenCode: JSON.stringify({ java: javaBroken }),
            referenceCode: JSON.stringify({ java: javaRef }),
            testCases: JSON.stringify([
                { input: "5\nYork 101 50\nLancaster 102 100\nYork 101 20\nWessex 103 0\nLancaster 102 -10", output: "Lancaster 90\nYork 70\n" },
                { input: "3\nCamelot 1 100\nCamelot 1 -100\nAvalon 2 50", output: "Avalon 50\n" }
            ]),
            hiddenTestCases: JSON.stringify([
                { input: "6\nA 1 10\nA 1 10\nB 2 -5\nB 2 10\nC 3 0\nD 4 100", output: "A 20\nB 5\nD 100\n" },
                { input: "1\nX 99 -1", output: "" },
                { input: "2\nX 99 10\nX 99 10", output: "X 20\n" },
                { input: "0", output: "" },
                { input: "4\nSame 1 10\nSame 2 10\nSame 1 -10\nSame 2 5", output: "Same 5\n" },
                { input: "3\nRich 1 9999\nRich 1 1\nPoor 2 0", output: "Rich 10000\n" },
                { input: "2\nKing 0 1000\nKing 0 -500", output: "King 500\n" },
                { input: "5\nA 1 1\nB 2 2\nC 3 3\nD 4 4\nE 5 5", output: "A 1\nB 2\nC 3\nD 4\nE 5\n" }
            ])
        },
        {
            problemId: nextId++,
            title: "The Blacksmith's Chain",
            description: "The Royal Blacksmith is forging an enchanted steel chain. The chain is represented as a custom C Linked List where each link holds a specific durability rating.\n\nThe Blacksmith wants to reverse the chain's order to temper it properly. However, the `reverse_chain` function has a severe pointer logic bug that sends the program into an endless infinite loop (Time Limit Exceeded).\n\nFind the bug in the pointer manipulation inside the `while` loop that causes `current` to bounce back and forth instead of traversing the list. Fix it so the chain is safely reversed and printed.",
            difficulty: "C",
            timeLimit: 5000,
            memoryLimit: 256,
            brokenCode: JSON.stringify({ c: cBroken }),
            referenceCode: JSON.stringify({ c: cRef }),
            testCases: JSON.stringify([
                { input: "5\n10 20 30 40 50", output: "10 20 30 40 50 \n" },
                { input: "3\n1 2 3", output: "1 2 3 \n" }
            ]),
            hiddenTestCases: JSON.stringify([
                { input: "1\n99", output: "99 \n" },
                { input: "10\n1 2 3 4 5 6 7 8 9 10", output: "1 2 3 4 5 6 7 8 9 10 \n" },
                { input: "4\n42 42 42 42", output: "42 42 42 42 \n" },
                { input: "2\n-5 5", output: "-5 5 \n" },
                { input: "8\n100 200 300 400 500 600 700 800", output: "100 200 300 400 500 600 700 800 \n" },
                { input: "6\n-1 -2 -3 -4 -5 -6", output: "-1 -2 -3 -4 -5 -6 \n" },
                { input: "3\n0 0 0", output: "0 0 0 \n" },
                { input: "5\n9999 9999 9999 9999 9999", output: "9999 9999 9999 9999 9999 \n" }
            ])
        },
        {
            problemId: nextId++,
            title: "The King's Catapult Payload",
            description: "The siege engineers use a Python script to calculate the total payload loaded into their catapults for consecutive volleys.\n\nHowever, a dark curse plagues the `load_catapult` function: the use of a mutable default argument `payload=[]` causes boulders from previous volleys to accumulate in the current volley!\n\nRemove the curse of the mutable default argument so that each catapult receives exactly its intended payload without inheriting the ghosts of past volleys.",
            difficulty: "PYTHON",
            timeLimit: 5000,
            memoryLimit: 256,
            brokenCode: JSON.stringify({ python: pythonBroken }),
            referenceCode: JSON.stringify({ python: pythonRef }),
            testCases: JSON.stringify([
                { input: "2\n2 50 50\n1 100", output: "Fired: 100\nFired: 100\n" },
                { input: "3\n1 10\n2 20 30\n1 40", output: "Fired: 10\nFired: 50\nFired: 40\n" }
            ]),
            hiddenTestCases: JSON.stringify([
                { input: "1\n5 1 2 3 4 5", output: "Fired: 15\n" },
                { input: "4\n1 0\n1 0\n1 0\n1 0", output: "Fired: 0\nFired: 0\nFired: 0\nFired: 0\n" },
                { input: "2\n3 10 10 10\n2 5 5", output: "Fired: 30\nFired: 10\n" },
                { input: "5\n1 1\n1 1\n1 1\n1 1\n1 1", output: "Fired: 1\nFired: 1\nFired: 1\nFired: 1\nFired: 1\n" },
                { input: "2\n1 999\n1 1", output: "Fired: 999\nFired: 1\n" },
                { input: "3\n2 -5 10\n1 20\n3 0 0 0", output: "Fired: 5\nFired: 20\nFired: 0\n" },
                { input: "1\n2 10 20", output: "Fired: 30\n" },
                { input: "2\n1 100\n2 50 50", output: "Fired: 100\nFired: 100\n" }
            ])
        }
    ];

    for (let q of bughunterQuestions) {
        await prisma.question.create({
            data: q
        });
    }

    console.log(`Successfully added ${bughunterQuestions.length} new medieval BugHunter problems!`);
    await prisma.$disconnect();
}

run().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
