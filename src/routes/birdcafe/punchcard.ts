import * as d3 from 'd3';
import type { Birds } from './types';

const TIME_FORMAT = '%Y-%m-%d';

export interface PunchPoint {
	date: Date;
	species: string;
}

// Module-level map to store the zoom transform of each chart element across redraws
const zoomStateMap = new Map<HTMLElement, any>();

export const punchPointsToday = (birds: Birds, today: string): PunchPoint[] => {
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

const daysInRange = (dates: Date[]) => {
	const [earliest, latest] = d3.extent(dates);
	return earliest && latest ? d3.timeDay.count(earliest, latest) : 0;
};

export const drawPunchCard = (
	element: HTMLElement,
	width: number,
	points: PunchPoint[],
	today: string,
	todayBirds: string[],
	bird: string | undefined
): void => {
	// Dots constants
	const RADIUS_RANGE = { MIN: 3, MAX: 8 };
	const COLOR_NORMAL = '#b0bec5';
	const COLOR_HIGHLIGHT = '#0d47a1';

	const todayTime = d3.timeParse(TIME_FORMAT)(today)?.getTime();
	const dates = points.map((p) => p.date);
	const days = daysInRange(dates);

	const m = { top: 20, right: 0, bottom: 50, left: 120 };
	const chartW = Math.min(
		width - (m.left + m.right),
		2 * RADIUS_RANGE.MAX * days
	);
	const chartH = 300;
	const radius = Math.max(RADIUS_RANGE.MIN, chartW / days / 2);
	const xRangeMax = 2 * radius * days;

	// Clear previous chart content
	d3.select(element).html('');

	// Create root SVG
	const svg = d3
		.select(element)
		.append('svg')
		.attr('width', chartW + m.left + m.right)
		.attr('height', chartH + m.top + m.bottom);

	// Create inner chart group translated by margins
	const svgElement = svg
		.append('g')
		.attr('transform', 'translate(' + m.left + ',' + m.top + ')');

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

	const yScale = d3
		.scalePoint<string>()
		.domain(todayBirds.slice().sort())
		.range([0, chartH])
		.padding(0.5);
	const yAxis = d3.axisLeft(yScale);

	// Define clipping path for dots so they stay within chart boundaries during pan
	svgElement
		.append('defs')
		.append('clipPath')
		.attr('id', 'chart-clip')
		.append('rect')
		.attr('width', chartW)
		.attr('height', chartH);

	// Transparent background rectangle to capture zoom and drag events in empty space
	svgElement
		.append('rect')
		.attr('width', chartW)
		.attr('height', chartH)
		.attr('fill', 'none')
		.attr('pointer-events', 'all');

	// Group to hold the dots, clipped to the chart bounds
	const dotsGroup = svgElement
		.append('g')
		.attr('clip-path', 'url(#chart-clip)');

	// Draw dots inside the clipped group
	const dots = dotsGroup
		.selectAll('.dot')
		.data(points)
		.enter()
		.append('circle')
		.attr('class', 'dot')
		.attr('cx', (d) => xScale(d.date))
		.attr('cy', (d) => yScale(d.species) ?? 0)
		.attr('r', radius)
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
	const gX = svgElement
		.append('g')
		.attr('class', 'x-axis')
		.attr('transform', 'translate(0,' + chartH + ')')
		.call(xAxis);

	// Style rotated text labels on the X axis
	gX.selectAll('text')
		.attr('transform', 'rotate(-45)')
		.style('text-anchor', 'end')
		.attr('dx', '-0.8em')
		.attr('dy', '0.15em');

	// Draw Y axis container (fixed)
	svgElement.append('g').call(yAxis);

	// Retrieve any saved zoom/pan transform for this element
	const currentTransform = zoomStateMap.get(element) || d3.zoomIdentity;

	// Set up zoom and pan behavior
	const zoom = d3
		.zoom<SVGSVGElement, unknown>()
		.scaleExtent([1, 1]) // No zooming
		.extent([
			[0, 0],
			[chartW - (m.left + m.right), chartH]
		])
		.translateExtent([
			// Pan between 0 and maximum x axis range (pixels)
			[0, -Infinity],
			[xRangeMax - (m.left + m.right), Infinity]
		])
		.on('zoom', (event) => {
			const transform = event.transform;
			zoomStateMap.set(element, transform);

			const newXScale = transform.rescaleX(xScale);

			// Update x-axis with the new scale
			gX.call(xAxis.scale(newXScale))
				.selectAll('text')
				.attr('transform', 'rotate(-45)')
				.style('text-anchor', 'end')
				.attr('dx', '-0.8em')
				.attr('dy', '0.15em');

			// Update dots positions
			dots.attr('cx', (d) => newXScale(d.date));
		});

	// Attach zoom behavior to the SVG
	svgElement.call(zoom as any);

	if (currentTransform !== d3.zoomIdentity) {
		svgElement.call(zoom.transform as any, currentTransform);
	}
};
