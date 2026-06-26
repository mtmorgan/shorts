import * as d3 from 'd3';
import type { Birds, BarCount, PunchPoint } from './types';
import {
	TIME_FORMAT,
	RADIUS_RANGE,
	COLOR_NORMAL,
	COLOR_HIGHLIGHT,
	MARGIN
} from './constants';

// Module-level map to store the zoom transform of each chart element across redraws
const zoomStateMap = new Map<HTMLElement, any>();

export const countBirdsPerDay = (birds: Birds): BarCount[] => {
	const counts: BarCount[] = [];
	const timeParse = d3.timeParse(TIME_FORMAT);
	for (const [dateString, speciesArray] of Object.entries(birds)) {
		const date = timeParse(dateString);
		if (!date) continue;
		counts.push({ date, count: speciesArray.length });
	}
	return counts;
};

export const punchBirdsToday = (birds: Birds, today: string): PunchPoint[] => {
	const birdsToday = new Set<string>(birds[today] || []);
	const timeParse = d3.timeParse(TIME_FORMAT);
	const points: PunchPoint[] = [];

	for (const [dateString, speciesArray] of Object.entries(birds)) {
		const date = timeParse(dateString);
		if (!date) continue;
		for (const species of speciesArray) {
			if (birdsToday.has(species)) {
				points.push({ date, species });
			}
		}
	}
	return points;
};

// Place today's bird last, so it overplots other birds
const punchBirdsReorder = (
	points: PunchPoint[],
	bird: string | undefined
): PunchPoint[] => {
	const matches: PunchPoint[] = [];
	const nonMatches: PunchPoint[] = [];

	for (const point of points) {
		if (point.species === bird) {
			matches.push(point);
		} else {
			nonMatches.push(point);
		}
	}
	return [...nonMatches, ...matches];
};

export const daysInRange = (dates: Date[]): number => {
	const [earliest, latest] = d3.extent(dates);
	return earliest && latest ? d3.timeDay.count(earliest, latest) : 0;
};

export const drawPunchCard = (
	chartContainer: HTMLElement,
	chartWidth: number,
	counts: BarCount[],
	points: PunchPoint[],
	today: string,
	birds: Birds,
	bird: string | undefined
): void => {
	const todayBirds = birds[today];
	const todayTime = d3.timeParse(TIME_FORMAT)(today)?.getTime();
	const dates = points.map((p) => p.date);
	const days = daysInRange(dates);

	const width = Math.min(
		chartWidth - (MARGIN.left + MARGIN.right),
		2 * RADIUS_RANGE.MAX * days
	);
	const barsHeight = 50;
	const gapHeight = 10;
	const dotsHeight = 300;
	const height = barsHeight + gapHeight + dotsHeight;

	const barWidth = 4;
	const dotRadius = Math.max(RADIUS_RANGE.MIN, chartWidth / days) / 2;
	const xRangeMax = 2 * dotRadius * days;

	// Clear previous chart content
	d3.select(chartContainer).html('');

	// Axes
	const xScale = d3
		.scaleTime()
		.domain(d3.extent(dates) as [Date, Date])
		.range([0, xRangeMax])
		.nice();
	const xAxis = d3
		.axisBottom(xScale)
		.ticks(d3.timeWeek.every(1))
		.tickFormat(d3.timeFormat('%b %d') as any);

	const yScaleDots = d3
		.scalePoint<string>()
		.domain(todayBirds.slice().sort())
		.range([barsHeight + gapHeight, height])
		.padding(0.5);
	const yAxisDots = d3.axisLeft(yScaleDots);

	const yScaleBars = d3
		.scaleLinear()
		.domain([0, Math.max(d3.max(counts, (d) => d.count) ?? 0, 30)])
		.range([barsHeight, 0])
		.nice();
	const yAxisBars = d3.axisLeft(yScaleBars).ticks(3);

	// Create root SVG
	const svg = d3
		.select(chartContainer)
		.append('svg')
		.attr('width', width + MARGIN.left + MARGIN.right)
		.attr('height', height + MARGIN.top + MARGIN.bottom);

	// Create inner chart group translated by margins
	const svgElement = svg
		.append('g')
		.attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

	// Define clipping path for dots and bars so they stay within chart boundaries during pan
	svgElement
		.append('defs')
		.append('clipPath')
		.attr('id', 'chart-clip')
		.append('rect')
		.attr('width', width)
		.attr('height', height);

	// Transparent background rectangle to capture zoom and drag events in empty space
	svgElement
		.append('rect')
		.attr('width', width)
		.attr('height', height)
		.attr('fill', 'none')
		.attr('pointer-events', 'all');

	// Group to hold the dots and bars, clipped to the chart bounds
	const chartContentGroup = svgElement
		.append('g')
		.attr('clip-path', 'url(#chart-clip)');

	// Draw bars inside the clipped group
	const bars = chartContentGroup
		.selectAll('.bar')
		.data(counts)
		.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', (d) => xScale(d.date) - barWidth / 2)
		.attr('y', (d) => yScaleBars(d.count))
		.attr('width', barWidth)
		.attr('height', (d) => barsHeight - yScaleBars(d.count))
		.attr('fill', (d) => {
			const test = todayTime === d.date.getTime();
			return test ? COLOR_HIGHLIGHT : COLOR_NORMAL;
		})
		.attr('opacity', 0.8);

	// Draw dots inside the clipped group
	const dots = chartContentGroup
		.selectAll('.dot')
		.data(punchBirdsReorder(points, bird))
		.enter()
		.append('circle')
		.attr('class', 'dot')
		.attr('cx', (d) => xScale(d.date))
		.attr('cy', (d) => yScaleDots(d.species) ?? 0)
		.attr('r', dotRadius)
		.attr('fill', (d) => {
			const test = todayTime === d.date.getTime() || bird === d.species;
			return test ? COLOR_HIGHLIGHT : COLOR_NORMAL;
		})
		.attr('opacity', 0.8);

	// Append titles to individual dots for tooltip information
	dots
		.append('title')
		.text((d) => d.species + ' on ' + d3.timeFormat(TIME_FORMAT)(d.date));

	// Draw X axis container
	const svgXAxisElement = svgElement
		.append('g')
		.attr('class', 'x-axis')
		.attr('transform', 'translate(0,' + height + ')')
		.call(xAxis);

	// Style rotated text labels on the X axis
	svgXAxisElement
		.selectAll('text')
		.attr('transform', 'rotate(-45)')
		.style('text-anchor', 'end')
		.attr('dx', '-0.8em')
		.attr('dy', '0.15em');

	// Draw Y axis containers
	svgElement
		.append('g')
		.call(yAxisBars)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', -MARGIN.left + 90)
		.attr('x', -barsHeight / 2)
		.attr('text-anchor', 'middle')
		.attr('fill', 'currentColor')
		.text('Species');

	const yAxisGroup = svgElement.append('g').call(yAxisDots);
	yAxisGroup
		.selectAll('.tick')
		.append('title')
		.text((d) => `${d}`);

	// Retrieve any saved zoom/pan transform for this element
	const currentTransform = zoomStateMap.get(chartContainer) || d3.zoomIdentity;

	// Set up zoom and pan behavior
	const zoom = d3
		.zoom<SVGSVGElement, unknown>()
		.scaleExtent([1, 1]) // No zooming
		.extent([
			[0, 0],
			[width - (MARGIN.left + MARGIN.right), height]
		])
		.translateExtent([
			// Pan between 0 and maximum x axis range (pixels)
			[0, -Infinity],
			[xRangeMax - (MARGIN.left + MARGIN.right), Infinity]
		])
		.on('zoom', (event) => {
			const transform = event.transform;
			zoomStateMap.set(chartContainer, transform);

			const newXScale = transform.rescaleX(xScale);

			// Update x-axis with the new scale
			svgXAxisElement
				.call(xAxis.scale(newXScale))
				.selectAll('text')
				.attr('transform', 'rotate(-45)')
				.style('text-anchor', 'end')
				.attr('dx', '-0.8em')
				.attr('dy', '0.15em');

			// Update dots and bars positions
			dots.attr('cx', (d) => newXScale(d.date));
			bars.attr('x', (d) => newXScale(d.date) - barWidth / 2);
		});

	// Attach zoom behavior to the SVG
	svgElement.call(zoom as any);

	if (currentTransform !== d3.zoomIdentity) {
		svgElement.call(zoom.transform as any, currentTransform);
	}
};
