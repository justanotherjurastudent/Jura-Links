import os
import re

def extract_abbreviations(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    abbreviations = []
    
    if 'lexsoftGesetze.ts' in file_path:
        # Für lexsoft: Extrahiere Gesetzesabkürzungen aus der verschachtelten Struktur
        law_matches = re.findall(r'"([^"]+)":\s*{\s*title:', content)
        abbreviations.extend(law_matches)
    
    elif 'buzerGesetze.ts' in file_path:
        # Für buzer: Extrahiere direkte keys
        matches = re.findall(r'(\w+):\s*{\s*title:', content)
        abbreviations.extend(matches)
    
    elif 'dejureGesetze.ts' in file_path:
        # Für dejure: Extrahiere direkte keys
        matches = re.findall(r'(\w+):\s*{\s*title:', content)
        abbreviations.extend(matches)
    
    elif 'lexmeaGesetze.ts' in file_path:
        # Für lexmea: Extrahiere direkte keys
        matches = re.findall(r'(\w+):\s*{\s*title:', content)
        abbreviations.extend(matches)
    
    elif 'rewisGesetze.ts' in file_path:
        # Für rewis: Extrahiere direkte keys
        matches = re.findall(r'(\w+):\s*{\s*url:', content)
        abbreviations.extend(matches)
    
    return list(set(abbreviations))

def main():
    source_dir = 'src/static'
    output_file = 'src/static/allLawAbbreviations.ts'
    
    all_abbreviations = []
    
    files_to_process = [
        'lexsoftGesetze.ts',
        'buzerGesetze.ts',
        'dejureGesetze.ts',
        'lexmeaGesetze.ts',
        'rewisGesetze.ts'
    ]
    
    for filename in files_to_process:
        file_path = os.path.join(source_dir, filename)
        if os.path.exists(file_path):
            file_abbreviations = extract_abbreviations(file_path)
            print(f"Extracted {len(file_abbreviations)} abbreviations from {filename}")
            all_abbreviations.extend(file_abbreviations)
    
    # Entferne Duplikate und sortiere nach Länge (längste zuerst)
    unique_abbreviations = sorted(list(set(all_abbreviations)), key=len, reverse=True)
    
    # Erstelle TypeScript-Export
    ts_content = "export const allLawAbbreviations = [\n"
    ts_content += "  " + ",\n  ".join(f'"{abbr}"' for abbr in unique_abbreviations)
    ts_content += "\n] as const;"
    
    # Schreibe in die Ausgabedatei
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"\nTotal: Extracted {len(unique_abbreviations)} unique law abbreviations to {output_file}")

if __name__ == "__main__":
    main()