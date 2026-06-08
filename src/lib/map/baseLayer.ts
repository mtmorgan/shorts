import { applyLotBoundaryLayer } from './lotBoundaries';

export const ARCGIS_BASE_URL =
	'https://tiles.arcgis.com/tiles/TJH5KDher0W13Kgo/arcgis/rest/services/Ontario_Vector_Topographic_Data_Cache_Service/VectorTileServer/resources/styles';

const makeArcGISPathsAbsolute = (style: any, baseUrl: string) => {
	const resourcesUrl = baseUrl.replace(/\/styles\/?$/, '');
	const absoluteBase = baseUrl.replace(/\/resources\/styles\/?$/, '');

	const fixPath = (url: string) => {
		if (url.startsWith('../..')) {
			return url.replace('../..', absoluteBase);
		}
		if (url.startsWith('..')) {
			// This would point to /resources/ - usually incorrect for ArcGIS sources
			return url.replace('..', resourcesUrl);
		}
		return url;
	};

	if (style.sprite) style.sprite = fixPath(style.sprite);
	if (style.glyphs) style.glyphs = fixPath(style.glyphs);
	if (style.sources) {
		for (const source in style.sources) {
			if (style.sources[source].url) {
				style.sources[source].url = fixPath(style.sources[source].url);
			}
		}
	}

	return style;
};

const getArcGISStyle = async (baseUrl: string) => {
	const styleUrl = `${baseUrl}/root.json?f=pjson`;
	const response = await fetch(styleUrl);
	if (!response.ok) {
		throw new Error(`HTTP error. Status: ${response.status}`);
	}
	const rawStyle = await response.json();
	return makeArcGISPathsAbsolute(rawStyle, baseUrl);
};

const applyEsriSource = (style: any) => {
	if (!style.sources.esri) style.sources.esri = {};
	style.sources.esri['tiles'] = [
		'https://tiles.arcgis.com/tiles/TJH5KDher0W13Kgo/arcgis/rest/services/Ontario_Vector_Topographic_Data_Cache_Service/VectorTileServer/tile/{z}/{y}/{x}.pbf'
	];

	style.sources.esri['attribution'] =
		'<a href="https://geohub.lio.gov.on.ca/maps/mnrf::ontario-vector-topographic-data-cache/about">Ontario Vector Topographic Data Cache</a>';
	return style;
};

export const getStyledMap = async () => {
	let style = await getArcGISStyle(ARCGIS_BASE_URL);
	style = applyEsriSource(style);
	style = applyLotBoundaryLayer(style);
	return style;
};
