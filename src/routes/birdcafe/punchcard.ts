import * as d3 from 'd3';
import type { Birds } from './types';

const COLOR_NORMAL = '#b0bec5';
const COLOR_HIGHLIGHT = '#0d47a1';

interface PunchPoint {
	date: Date;
	species: string;
}

export const filterBirdsToday = (birds: Birds, today: string) => {
	const birdsToday = new Set<string>(birds[today]);

	let filteredBirds: Birds = {};
	for (const date of Object.keys(birds)) {
		let filteredBirdsToday: string[] = [];
		for (const bird of birds[date]) {
			if (birdsToday.has(bird)) {
				filteredBirdsToday.push(bird);
			}
		}
		if (filteredBirdsToday.length) {
			filteredBirds[date] = filteredBirdsToday;
		}
	}
	return filteredBirds;
};

export const drawPunchCard = (
	element: HTMLElement,
	birds: Birds,
	today: string,
	bird: string | undefined
): void => {
	const parseTime = d3.timeParse('%Y-%m-%d');
	const points: PunchPoint[] = [];
	const speciesSet = new Set();

	const todayTime = parseTime(today)?.getTime();

	Object.entries(birds).forEach(([dStr, sList]) => {
		const cleanD = parseTime(dStr);
		if (!cleanD) return;
		sList.forEach((sName) => {
			points.push({ date: cleanD, species: sName });
			speciesSet.add(sName);
		});
	});

	const allDates = points
		.map((p) => p.date)
		.sort((a, b) => a.getTime() - b.getTime());

	const m = { top: 40, right: 50, bottom: 60, left: 140 };
	const chartW = 640;
	const chartH = 300;

	d3.select(element).html('');

	let svgElement = d3
		.select(element)
		.append('svg')
		.attr('width', chartW + m.left + m.right)
		.attr('height', chartH + m.top + m.bottom)
		.append('g')
		.attr('transform', 'translate(' + m.left + ',' + m.top + ')');

	const x = d3
		.scaleTime()
		.domain(d3.extent(allDates) as [Date, Date])
		.range([0, chartW])
		.nice();

	const speciesDomain = Array.from(speciesSet).sort() as string[];
	const y = d3
		.scalePoint<string>()
		.domain(speciesDomain)
		.range([0, chartH])
		.padding(0.5);

	const xAxis = d3
		.axisBottom(x)
		.ticks(d3.timeWeek.every(1))
		.tickFormat(d3.timeFormat('%b %d') as any);
	const yAxis = d3.axisLeft(y);

	svgElement
		.append('g')
		.attr('transform', 'translate(0,' + chartH + ')')
		.call(xAxis)
		.selectAll('text')
		.attr('transform', 'rotate(-45)')
		.style('text-anchor', 'end')
		.attr('dx', '-0.8em')
		.attr('dy', '0.15em');

	svgElement.append('g').call(yAxis);

	svgElement
		.selectAll('.dot')
		.data(points)
		.enter()
		.append('circle')
		.attr('class', 'dot')
		.attr('cx', (d) => x(d.date))
		.attr('cy', (d) => y(d.species) ?? 0)
		.attr('r', 6)
		.attr('fill', (d) => {
			const test = todayTime === d.date.getTime() || bird === d.species;
			return test ? COLOR_HIGHLIGHT : COLOR_NORMAL;
		})
		.attr('opacity', 0.8)
		.append('title')
		.text((d) => d.species + ' on ' + d3.timeFormat('%Y-%m-%d')(d.date));
};
