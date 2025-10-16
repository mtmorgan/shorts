export interface FileMap {
	// EXIF data fields
	CreationDate: string;
	FileName: string;
	GPSLatitude: number;
	GPSLongitude: number;
	Who: string;
	// Calculated fields
	x: number;
	y: number;
	distance: number;
}
