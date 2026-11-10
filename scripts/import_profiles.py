#!/usr/bin/env python3
"""Convert organizer CSV to public website JSON; excludes non-consenting rows and private fields.

Usage: python3 scripts/import_profiles.py path/to/responses.csv
       python3 scripts/import_profiles.py path/to/responses.csv --no-demo
"""
import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src' / 'data' / 'profiles.json'

def make_profile(row, index):
    def get(field): return (row.get(field) or '').strip()
    if not get('Full Name *') or not get('Website Profile Consent *').lower().startswith('yes'):
        return None
    def split_list(value):
        # Spreadsheet form uses comma-separated text; semicolons also accepted.
        return [part.strip() for part in value.replace(';', ',').split(',') if part.strip()]
    linkedin = get('LinkedIn Profile (optional)') if get('LinkedIn Display Consent *').lower().startswith('yes') else ''
    if linkedin and not (linkedin.startswith('https://www.linkedin.com/') or linkedin.startswith('https://linkedin.com/')):
        linkedin = ''
    return {
        'id': f'guest-{index}', 'name': get('Display Name') or get('Full Name *'),
        'fullName': get('Full Name *'), 'status': get('Current Status *'),
        'title': get('Current Title / Role'), 'organization': get('Current Organization'),
        'faculty': get('UBC Faculty *'), 'major': get('Major / Program *'),
        'graduationYear': get('Graduation Year'),
        'companies': split_list(get('Co-op / Internship Companies *')),
        'roles': split_list(get('Co-op / Internship Roles')),
        'industry': get('Primary Industry *'), 'otherInterests': get('Other Industries / Interests'),
        'topics': split_list(get('Topics I Can Discuss')),
        'advice': get('One line advice for First-Year Students'),
        'linkedin': linkedin, 'isPlaceholder': False
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_path', type=Path)
    parser.add_argument('--no-demo', action='store_true', help='Discard all fictional demo profiles')
    args = parser.parse_args()
    with args.csv_path.open(encoding='utf-8-sig', newline='') as file:
        rows = list(csv.DictReader(file))
    public = [p for i, r in enumerate(rows, 1) if (p := make_profile(r, i))]
    existing = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else []
    demo = [] if args.no_demo else [p for p in existing if p.get('isPlaceholder')]
    OUT.write_text(json.dumps(public + demo, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Published {len(public)} consenting real profile(s) + {len(demo)} demo profile(s).')
    print('Private organizer notes and consent fields are never exported.')

if __name__ == '__main__':
    main()
