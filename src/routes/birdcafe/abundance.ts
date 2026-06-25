import * as d3 from 'd3';
import type { Birds } from './types';
import { COLOR_HIGHLIGHT, COLOR_NORMAL, RADIUS_RANGE } from './constants';

export interface Abundance {
	species: number;
	occurrence: number;
}

interface RegressionResult {
	slope: number;
	intercept: number;
	predict: (x: number) => number; // Returns raw Y for raw X
}

const tallyAbundance = (birds: Birds): Abundance[] => {
	const counts: Record<string, number> = {};
	for (const observations of Object.values(birds)) {
		for (const bird of observations) {
			counts[bird] = (counts[bird] || 0) + 1;
		}
	}

	const tally: Record<number, number> = {};
	for (const count of Object.values(counts)) {
		tally[count] = (tally[count] || 0) + 1;
	}

	const abundance: Abundance[] = Object.entries(tally)
		.map(([occurrence, count]) => ({
			occurrence: Number(occurrence),
			species: count
		}))
		.sort((a, b) => a.occurrence - b.occurrence);

	return abundance;
};

// Linear regression on log-log scales, according to Google gemini
const calculateLogLogRegression = (data: Abundance[]): RegressionResult => {
	let sumX = 0,
		sumY = 0,
		sumXY = 0,
		sumXX = 0;
	const n = data.length;

	data.forEach((d) => {
		const logX = Math.log10(d.occurrence);
		const logY = Math.log10(d.species);
		sumX += logX;
		sumY += logY;
		sumXY += logX * logY;
		sumXX += logX * logX;
	});

	const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
	const intercept = (sumY - slope * sumX) / n;

	// Closure function to calculate actual values back in linear space
	const predict = (x: number) => {
		const logY = slope * Math.log10(x) + intercept;
		return Math.pow(10, logY);
	};

	return { slope, intercept, predict };
};

export const drawAbundance = (
	chartContainer: HTMLElement,
	chartWidth: number,
	birds: Birds
): void => {
	// Calculate abundances
	const abundance = tallyAbundance(birds);

	// Plot
	const margin = { top: 40, right: 40, bottom: 60, left: 60 };
	const containerSize = Math.min(chartWidth, 400);
	const width = containerSize - margin.left - margin.right;
	const height = containerSize - margin.top - margin.bottom;

	d3.select(chartContainer).selectAll('*').remove();

	const svg = d3
		.select(chartContainer)
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);

	const xMax = d3.max(abundance, (d) => d.occurrence) || 10;
	const yMax = d3.max(abundance, (d) => d.species) || 10;
	const max = Math.max(xMax, yMax);

	const xScale = d3.scaleLog().domain([1, max]).range([0, width]);
	const xAxis = d3.axisBottom(xScale).ticks(5, ',.0f');

	const yScale = d3.scaleLog().domain([1, max]).range([height, 0]);
	const yAxis = d3.axisLeft(yScale).ticks(5, ',.0f');

	// Render X Axis
	svg
		.append('g')
		.attr('transform', `translate(0,${height})`)
		.call(xAxis)
		.append('text')
		.attr('x', width / 2)
		.attr('y', 40)
		.attr('fill', 'currentColor')
		.style('text-anchor', 'middle')
		.text('Abundance (Number of Observations) (Log)');

	// Render Y Axis
	svg
		.append('g')
		.call(yAxis)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('x', -height / 2)
		.attr('y', -40)
		.attr('fill', 'currentColor')
		.style('text-anchor', 'middle')
		.text('Number of Species (Log)');

	// Plot the regression line
	const regression = calculateLogLogRegression(abundance);
	const xAtYEqualsOne = Math.pow(10, -regression.intercept / regression.slope);
	const maxX = Math.min(max, xAtYEqualsOne);
	const regressionPoints = [1, maxX].map((x) => ({
		x: x,
		y: regression.predict(x)
	}));
	const regressionLineGenerator = d3
		.line<{ x: number; y: number }>()
		.x((d) => xScale(d.x))
		.y((d) => yScale(d.y));
	svg
		.append('path')
		.datum(regressionPoints)
		.attr('fill', 'none')
		.attr('stroke', COLOR_NORMAL)
		.attr('stroke-width', 2)
		.attr('stroke-dasharray', '4 4')
		.attr('d', regressionLineGenerator);

	svg
		.selectAll('.dot')
		.data(abundance)
		.enter()
		.append('circle')
		.attr('cx', (d) => xScale(d.occurrence))
		.attr('cy', (d) => yScale(d.species))
		.attr('r', RADIUS_RANGE.MAX)
		.attr('fill', COLOR_HIGHLIGHT);
};
