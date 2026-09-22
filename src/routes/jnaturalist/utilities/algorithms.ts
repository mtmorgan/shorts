/**
 * Pluralizes a word based on a count.
 */
export const pluralize = (
	count: number,
	singular: string,
	plural = `${singular}s`
) => (count === 1 ? singular : plural);

export const tabulateById = <T extends { id: number | string }>(
	arr: T[]
): Map<string | number, { observation_count: number; user: T }> => {
	const map = new Map<
		number | string,
		{ observation_count: number; user: T }
	>();

	arr.forEach((user) => {
		const existing = map.get(user.id);
		if (existing) {
			existing.observation_count++;
		} else {
			map.set(user.id, { observation_count: 1, user: user });
		}
	});

	return map;
};
