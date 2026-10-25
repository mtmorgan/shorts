// ./types/api.ts

/**
 * A generic container that wraps any iNaturalist v2 API response,
 * capturing pagination metadata and localized error tracking states.
 */
export interface QueryResult<T> {
	total_results: number;
	results: T[];
	error: string | null;
}

export interface iNatPagedResponse<T> {
	total_results: number;
	page: number;
	per_page: number;
	results: T[];
}
