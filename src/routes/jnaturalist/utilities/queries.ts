import ky, { HTTPError } from 'ky';
import type { QueryResult, iNatPagedResponse } from '../types/api';
import type { InferiNatType, Prettify } from '../types/inat';

import { coerceToRison } from './rison';
import { getLotBounds, lotBoundaries } from '$lib/map/lotBoundaries';

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { tabulateById } from './algorithms';

// Query

const PER_PAGE = 50;

const iNatApiV2 = ky.create({
	prefix: 'https://api.inaturalist.org/v2',
	timeout: 12000,
	headers: {
		Accept: 'application/json'
	}
});

// Geographic boundaries
const lot = getLotBounds();
const lotBounds = {
	nelat: lot.getNorthEast().lat,
	nelng: lot.getNorthEast().lng,
	swlat: lot.getSouthWest().lat,
	swlng: lot.getSouthWest().lng
};

// Helper to handle error messages consistently

function handleQueryError(error: unknown): string {
	console.error('Fetch error encountered:', error);
	if (error instanceof HTTPError) {
		return `API Error (${error.response.status}): ${error.response.statusText}`;
	}
	return 'A network or unexpected client error occurred.';
}

/**
 * Executes a flexible iNaturalist v2 endpoint call and
 * wraps the outcome inside a safely typed QueryResult container.
 */
export async function fetchiNatData<T>(
	endpoint: 'observations' | 'observations/observers',
	searchParams: Record<string, any>
): Promise<QueryResult<T>> {
	try {
		const response = await iNatApiV2
			.get(endpoint, {
				searchParams
			})
			.json<iNatPagedResponse<T>>();

		return {
			total_results: response.total_results,
			results: response.results || [],
			error: null
		};
	} catch (error) {
		return {
			total_results: 0,
			results: [],
			error: handleQueryError(error)
		};
	}
}

// queryObservers
const observersBlueprint = {
	observation_count: true,
	user: {
		id: true,
		login: true,
		name: true
	}
} as const;

// Wrap InferiNatType inside Prettify to reveal the true underlying object schema
export type ObserversResult = Prettify<
	InferiNatType<typeof observersBlueprint> & { our_place_count: number }
>;

export async function queryObservers(observations: ObservationResult[]) {
	const counts = tabulateById(
		observations.map((observation) => observation.user)
	);
	const searchParams = {
		user_id: Array.from(counts.keys()).join(','),
		per_page: counts.size,
		fields: coerceToRison(observersBlueprint)
	};

	const { results } = await fetchiNatData<ObserversResult>(
		'observations/observers',
		searchParams
	);
	return results
		.map((result) => ({
			...result,
			our_place_count: counts.get(result.user.id)!.observation_count
		}))
		.sort((a, b) => b.our_place_count - a.our_place_count);
}

// queryObservations

const observationFieldsBlueprint = {
	id: true,
	uuid: true,
	geojson: true,
	observed_on_string: true,
	taxon: {
		name: true,
		preferred_common_name: true
	},
	observation_photos: {
		photo: {
			url: true
		}
	},
	user: {
		id: true,
		login: true,
		name: true
	}
} as const;

export type ObservationResult = InferiNatType<
	typeof observationFieldsBlueprint
>;

export async function queryObservations(): Promise<ObservationResult[]> {
	let page = 1;
	let observations = [] as ObservationResult[];
	const searchParams = {
		per_page: PER_PAGE,
		...lotBounds,
		fields: coerceToRison(observationFieldsBlueprint)
	};

	while (true) {
		const pageItems = await fetchiNatData<ObservationResult>('observations', {
			...searchParams,
			page: page
		});

		if (pageItems.results.length === 0) break;

		const results = pageItems.results.filter((item) =>
			booleanPointInPolygon(item.geojson, lotBoundaries)
		);
		observations.push(...results);
		page++;
	}

	return observations;
}
