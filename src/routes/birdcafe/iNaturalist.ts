// 1. Define the interfaces for type safety
interface TaxonResult {
	results: {
		id: number;
		name: string;
		preferred_common_name: string;
	}[];
}

export interface TaxonPhoto {
	id: number;
	attribution: string;
	medium_url: string;
}

interface TaxaIdResult {
	results: {
		default_photo: TaxonPhoto;
	}[];
}

// Fetch Taxon ID by Common Name
export const getTaxonId = async (commonName: string): Promise<number> => {
	const url = `https://api.inaturalist.org/v2/taxa?q=${encodeURIComponent(commonName)}&rank=species&only_id=true`;
	const response = await fetch(url);

	if (!response.ok) throw new Error('Failed to fetch taxon data');

	const data: TaxonResult = await response.json();
	if (data.results.length === 0) {
		throw new Error(`Taxon not found for common name: ${commonName}`);
	}

	// Assume first result is desired
	return data.results[0].id;
};

// Fetch taxa/id/ default photo
export const getBirdPhotos = async (
	commonName: string
): Promise<TaxonPhoto> => {
	try {
		const taxonId = await getTaxonId(commonName);

		// Note: Use 'photos=true' to filter only for observations with images
		const query = 'default_photo.attribution,default_photo.medium_url';
		const url = `https://api.inaturalist.org/v2/taxa/${taxonId}?fields=${encodeURIComponent(query)}`;
		console.log('photo url', url);
		const response = await fetch(url);

		if (!response.ok) throw new Error('Failed to fetch observations');

		const data: TaxaIdResult = await response.json();

		// Extract photo URLs from the observations
		// Replace 'square' with 'medium', 'large', or 'original' depending on the size you need
		// return data.results.flatMap((obs) =>
		// 	obs.photos.map((photo) => photo.url.replace('square', 'medium'))
		// );
		console.log(data);
		return data.results[0].default_photo;
	} catch (error) {
		console.error('Error querying iNaturalist API:', error);
		return {} as TaxonPhoto;
	}
};
