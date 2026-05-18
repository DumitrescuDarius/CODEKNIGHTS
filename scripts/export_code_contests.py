import json
from datasets import load_dataset

# Load the dataset
print("Loading dataset...")
# Using 'train' split as a default
ds = load_dataset("ByteDance-Seed/Code-Contests-Plus", split="train")

problems = []

# Map dataset fields to our Question model structure
# NOTE: You might need to adjust these field names based on the actual 
# structure of the ByteDance-Seed/Code-Contests-Plus dataset.
print("Mapping problems...")
for i in range(min(len(ds), 20)): # Exporting 20 problems for demo
    entry = ds[i]
    
    # Example mapping (adjust these keys based on inspectable dataset structure):
    problem = {
        "title": entry.get("name", "Unknown Problem"),
        "description": entry.get("description", "No description provided."),
        "difficulty": entry.get("difficulty", "Medium"),
        "restrictions": entry.get("restrictions", ""),
        "testCases": entry.get("public_tests", []), 
        "hiddenTestCases": entry.get("private_tests", [])
    }
    problems.append(problem)

# Save to JSON
with open('problems.json', 'w') as f:
    json.dump(problems, f, indent=2)

print(f"Exported {len(problems)} problems to problems.json")
