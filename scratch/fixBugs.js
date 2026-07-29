const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = {
  "The Guard's Patrol": {
    lang: "c",
    code: `#include <stdio.h>
#include <stdlib.h>

int* create_patrol(int n) {
    int* arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        arr[i] = i; 
    }
    return arr;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int* patrol = create_patrol(n);
    for (int i = 0; i < n; i++) {
        printf("%d ", patrol[i]);
    }
    printf("\\n");
    return 0;
}`
  },
  "The Siege Tower's Ladder": {
    lang: "cpp",
    code: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    long long total_steps = 1; 
    for (int i = 0; i < n; i++) {
        int steps;
        cin >> steps;
        total_steps += steps;
    }
    cout << total_steps << "\\n";
    return 0;
}`
  },
  "The Jester's Riddle": {
    lang: "c",
    code: `#include <stdio.h>
#include <string.h>

void reverse(char* str) {
    int len = strlen(str);
    char temp[100];
    for (int i = 0; i < len; i++) {
        temp[i] = str[len - i]; 
    }
    temp[len] = '\\0';
    strcpy(str, temp);
}

int main() {
    char str[100];
    if (scanf("%99s", str) != 1) return 0;
    reverse(str);
    printf("%s\\n", str);
    return 0;
}`
  },
  "The Cursed Double-Edged Sword": {
    lang: "cpp",
    code: `#include <iostream>
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
    
    Sword(const Sword& other) {
        name = new char[strlen(other.name) + 1];
        strcpy(name, other.name);
        damage = other.damage;
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
            
    ~Knight() {
        delete weapon;
    }
    
    void attack(Knight& other) {
        other.health -= weapon->damage;
    }
};

void battle(Knight& k1, Knight& k2) { 
    k1.attack(k2);
    k2.attack(k2); 
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
}`
  },
  "The Dragon's Breath": {
    lang: "cpp",
    code: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n, min_temp;
    if (!(cin >> n >> min_temp)) return 0;
    vector<int> blasts(n);
    for (int i = 0; i < n; i++) cin >> blasts[i];
    
    for (auto it = blasts.begin(); it != blasts.end(); ) {
        if (*it < min_temp) {
            it = blasts.erase(it);
        } else {
            it++;
            it++; 
        }
    }
    
    for (int b : blasts) cout << b << " ";
    cout << "\\n";
    return 0;
}`
  }
};

async function run() {
    for (const [title, data] of Object.entries(updates)) {
        const q = await prisma.question.findFirst({ where: { title: title } });
        if (q) {
            let broken = JSON.parse(q.brokenCode);
            broken[data.lang] = data.code;
            await prisma.question.update({
                where: { id: q.id },
                data: { brokenCode: JSON.stringify(broken) }
            });
            console.log('Fixed bugs for', title);
        }
    }
}
run();
