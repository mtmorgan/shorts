export interface SplashConfig {
	lerpFactor: number;
	distortionSpike: number;
	waveFrequency: number;
	expansionSpeed: number;
	maxRadius: number;
}

export interface SliderMetadata {
	key: keyof SplashConfig;
	label: string;
	min: number;
	max: number;
	step: number;
	className?: string;
}
