export interface FileMap {
	// EXIF data fields
	CreationDate: string;
	FileName: string;
	GPSLatitude: number;
	GPSLongitude: number;
	Who: 'Alison' | 'Martin' | 'Joan' | 'Katy';
	// Calculated fields
	x: number;
	y: number;
	distance: number;
}
