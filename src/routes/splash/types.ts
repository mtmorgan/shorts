import * as THREE from 'three';
import type { IUniform } from 'three';

export interface SplashConfig {
	easing: number;
	frequency: number;
	speed: number;
	radius: number;
	hole: number;
	intensity: number;
	strength: number;
}

export interface SliderMetadata {
	key: keyof SplashConfig;
	label: string;
	min: number;
	max: number;
	step: number;
	className?: string;
}

export interface Uniforms {
	[key: string]: IUniform<any>;
	uTime: { value: number };
	uClickTime: { value: number };
	uSplashCenter: { value: THREE.Vector2 };
	uStrength: { value: number };
	uFrequency: { value: number };
	uSpeed: { value: number };
	uRadius: { value: number };
	uHole: { value: number };
	uTexture: { value: THREE.Texture | null }; // Texture slot configuration
	uAspect: { value: number };
	uRainCenters: { value: THREE.Vector2[] };
	uRainTimes: { value: number[] };
	uRainStrengths: { value: number[] };
}
