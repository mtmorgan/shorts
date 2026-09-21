export function tabulateById<T extends { id: number | string }>(
	arr: T[]
): Map<string | number, { observation_count: number; user: T }> {
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
}
