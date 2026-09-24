/**
 * Coerces a nested object blueprint into a minified iNaturalist API v2 Rison fields query.
 * @param blueprint - A nested object mapping of fields to fetch.
 */
export function coerceToRison(blueprint: Record<string, any>): string {
	const processNode = (node: Record<string, any>): string => {
		const parts: string[] = [];

		for (const [key, value] of Object.entries(node)) {
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				// Nested sub-object format -> key:(child_properties)
				parts.push(`${key}:${processNode(value)}`);
			} else if (value === true || value === 1) {
				// iNaturalist Rison minified truthy assignment format -> key:!t
				parts.push(`${key}:!t`);
			}
		}

		return `(${parts.join(',')})`;
	};

	return processNode(blueprint);
}
