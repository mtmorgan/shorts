// Define primitive lookups for standard iNaturalist field schemas
type iNatPrimitives = {
	id: number;
	uuid: string;
	observed_on_string: string;
	name: string;
	preferred_common_name: string;
	url: string;

	// Observer
	observation_count: number;
	login: string;
	created_at: string;
};

/**
 * Infers the strict TypeScript type of an iNaturalist response payload
 * directly from its runtime blueprint configuration layout.
 */
export type InferiNatType<T> = {
	[K in keyof T]: T[K] extends true
		? K extends keyof iNatPrimitives
			? iNatPrimitives[K]
			: any // Fallback if property isn't mapped explicitly in primitives
		: T[K] extends Record<string, any>
			? // Handle arrays explicitly if the target key matches array nodes
				K extends 'observation_photos'
				? Array<InferiNatType<T[K]>>
				: InferiNatType<T[K]>
			: never;
};

/**
 * Recursively flattens complex deferred mapped/conditional types
 * into clear, readable object definitions upon IDE hovering.
 */
export type Prettify<T> = {
	[K in keyof T]: T[K] extends object ? Prettify<T[K]> : T[K];
} & {};
