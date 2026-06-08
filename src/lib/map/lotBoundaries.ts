import type { Feature, Polygon } from 'geojson';
import maplibregl, { type LngLatLike } from 'maplibre-gl';

export const lotBoundaries: Feature<Polygon> = {
	type: 'Feature',
	properties: {
		name: 'Our Place'
	},
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[-79.88035, 43.89948],
				[-79.88149, 43.89841],
				[-79.87843, 43.89613],
				[-79.87626, 43.89452],
				[-79.87114, 43.89904],
				[-79.87342, 43.90079],
				[-79.87692, 43.89754],
				[-79.88035, 43.89948]
			]
		]
	}
};

export const getLotBounds = () => {
	const coordinates = lotBoundaries.geometry.coordinates[0] as LngLatLike[]; // Get the outer ring
	return coordinates.reduce(
		(bounds, coord) => bounds.extend(coord),
		new maplibregl.LngLatBounds()
	);
};

export const applyLotBoundaryLayer = (style: any) => {
	style.sources['lotBoundaries'] = {
		type: 'geojson',
		data: lotBoundaries
	};

	style.layers.push({
		id: 'lot-boundary-layer',
		type: 'line',
		source: 'lotBoundaries',
		paint: {
			'line-color': '#fc8d62',
			'line-opacity': 1
		}
	});
	return style;
};
