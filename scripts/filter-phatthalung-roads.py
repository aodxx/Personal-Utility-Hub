import json
from pathlib import Path
import ijson

SOURCE = Path('/tmp/hotosm_tha_roads_lines_geojson.zip')
ARCHIVE = Path('/tmp/hotosm_tha_roads_lines_geojson.geojson')
OUTPUT = Path('public/data/phatthalung-roads.geojson')
# Province-wide practical bounding box with a small margin.
MIN_LON, MIN_LAT, MAX_LON, MAX_LAT = 99.70, 7.05, 100.35, 7.85

def coordinates(geometry):
    if not geometry:
        return []
    def walk(value):
        if isinstance(value, (list, tuple)) and value and isinstance(value[0], (int, float)):
            yield value
        elif isinstance(value, (list, tuple)):
            for item in value:
                yield from walk(item)
    return walk(geometry.get('coordinates'))

import zipfile
with zipfile.ZipFile(SOURCE) as archive:
    name = next(name for name in archive.namelist() if name.endswith('.geojson'))
    with archive.open(name) as source:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        count = 0
        with OUTPUT.open('w', encoding='utf-8') as out:
            out.write('{"type":"FeatureCollection","features":[')
            first = True
            for feature in ijson.items(source, 'features.item', use_float=True):
                coords = list(coordinates(feature.get('geometry')))
                if not coords:
                    continue
                if any(MIN_LON <= point[0] <= MAX_LON and MIN_LAT <= point[1] <= MAX_LAT for point in coords):
                    if not first:
                        out.write(',')
                    json.dump(feature, out, ensure_ascii=False, separators=(',', ':'))
                    first = False
                    count += 1
            out.write(']}')
print(f'Filtered {count} road features to {OUTPUT} ({OUTPUT.stat().st_size} bytes)')
