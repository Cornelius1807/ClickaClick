"""
discover_ids.py
---------------
Fetches the Google Form HTML and extracts the entry field IDs.
Run this FIRST to verify the mapping before submitting responses.

Usage:
    python discover_ids.py
"""

import re
import json
import requests

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScPvXZprN0gq6-6CPxEC0HxNYo5pUC8Is77LAvH8Clc1xNpOg/viewform"

def discover_entry_ids():
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    print(f"Fetching form: {FORM_URL}")
    resp = requests.get(FORM_URL, headers=headers, timeout=20)
    resp.raise_for_status()

    html = resp.text

    # Google Forms embeds all question data in a JS variable called FB_PUBLIC_LOAD_DATA_
    match = re.search(r"FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);\s*</script>", html, re.DOTALL)
    if not match:
        print("Could not find FB_PUBLIC_LOAD_DATA_. Trying alternative extraction...")
        # Fallback: look for entry IDs directly
        entries = re.findall(r'entry\.(\d+)', html)
        unique_entries = list(dict.fromkeys(entries))
        print(f"Found {len(unique_entries)} unique entry IDs:")
        for e in unique_entries:
            print(f"  entry.{e}")
        return unique_entries

    raw = match.group(1)

    # Extract all entry IDs and their associated question titles
    # Pattern: entry IDs appear as numbers near question text in the data structure
    question_blocks = re.findall(r'\[\[(\d{9,10}),', raw)
    question_titles  = re.findall(r'"([^"]{5,80})(?:\\n|")', raw)

    print(f"\nFound {len(question_blocks)} entry IDs:\n")
    for i, qid in enumerate(question_blocks):
        title = question_titles[i] if i < len(question_titles) else f"Question {i+1}"
        print(f"  Q{i+1}: entry.{qid}  →  {title[:60]}")

    # Save to JSON for use by fill_survey.py
    id_map = {f"q{i+1}": f"entry.{qid}" for i, qid in enumerate(question_blocks)}
    with open("discovered_ids.json", "w") as f:
        json.dump(id_map, f, indent=2)
    print(f"\nSaved to discovered_ids.json")
    return question_blocks


if __name__ == "__main__":
    discover_entry_ids()
