import os
import re
import json
from pathlib import Path

# Dev-Brain logic as requested by Vertex Labs Lead Architect role constraints
def scan_directory(target_dir):
    """Scans local directories for specific comment tags and extracts them."""
    tags = ["TODO", "NOTE", "FIX"]
    pattern = re.compile(rf"#\s*({'|'.join(tags)}):\s*(.*)")
    
    extracted_notes = []
    
    for root, _, files in os.walk(target_dir):
        for file in files:
            if not file.endswith(".py") and not file.endswith(".ts") and not file.endswith(".tsx"):
                continue
                
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    for line_num, line in enumerate(f, start=1):
                        match = pattern.search(line)
                        if match:
                            tag_type = match.group(1).strip()
                            content = match.group(2).strip()
                            extracted_notes.append({
                                "file": file_path,
                                "line": line_num,
                                "tag": tag_type,
                                "note": content
                            })
            except Exception as e:
                print(f"Skipping {file_path} due to error: {e}")
                
    return extracted_notes

if __name__ == "__main__":
    target = "./src"  # Directory to watch
    print(f"🧠 Dev-Brain: Scanning {target} for tags...")
    notes = scan_directory(target)
    
    output_file = "brain.json"
    with open(output_file, "w") as f:
        json.dump({"brain_dump": notes}, f, indent=2)
    print(f"✅ Extracted {len(notes)} notes and saved to {output_file}")
