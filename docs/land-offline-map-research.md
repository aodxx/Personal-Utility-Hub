# Land Measurement Offline Basemap Research

Natural Earth publishes public-domain vector and raster map data suitable for embedded basemap use. OpenStreetMap tiles require visible attribution and are governed by the tile usage policy, so an application should not treat the public OSM tile endpoint as a guaranteed offline source. PMTiles/MapLibre is a viable future path for self-hosted or bundled vector tiles, but a complete street-level package requires a large data asset, style, fonts/sprites, and explicit licensing/attribution review. For the immediate mobile issue, the pragmatic approach is a bundled Natural Earth-style country-boundary basemap rendered locally, with online OSM/Esri layers remaining optional and clearly labeled. This gives genuine geographic context without pretending to provide parcel/street-level survey detail.

References:
- https://www.naturalearthdata.com/about/terms-of-use/
- https://operations.osmfoundation.org/policies/tiles/
- https://www.maplibre.org/maplibre-gl-js/docs/examples/pmtiles-source-and-protocol/
