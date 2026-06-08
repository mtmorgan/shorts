export interface TaxonPhoto {
	id: number;
	attribution: string;
	medium_url: string;
}

export interface Birds {
	[key: string]: string[];
}

export interface BirdDisplayProps {
	birds: Birds;
}
