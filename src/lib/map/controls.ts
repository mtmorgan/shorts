import maplibregl from 'maplibre-gl';

export const addLayerControl = (map: maplibregl.Map) => {
	const container = document.createElement('div');
	container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

	const btn = document.createElement('button');
	btn.type = 'button';
	btn.innerHTML = '☰';
	btn.style.fontSize = '20px';
	btn.style.width = '30px';
	btn.style.height = '30px';
	btn.style.cursor = 'pointer';
	btn.style.display = 'flex';
	btn.style.alignItems = 'center';
	btn.style.justifyContent = 'center';
	container.appendChild(btn);

	// Menu will be appended to the map container so it can be positioned under the cursor
	const menu = document.createElement('div');
	menu.style.display = 'none';
	menu.style.position = 'absolute';
	menu.style.backgroundColor = 'white';
	menu.style.padding = '5px';
	menu.style.borderRadius = '4px';
	menu.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
	menu.style.whiteSpace = 'nowrap';
	menu.style.zIndex = '1000';

	const mapContainer = map.getContainer() as HTMLElement;

	// Helper to create an option with a check mark for the selected state
	const optionWrappers: HTMLDivElement[] = [];
	const createOption = (
		id: string,
		labelText: string,
		value: boolean,
		selected: boolean
	) => {
		const wrapper = document.createElement('div');
		wrapper.style.display = 'flex';
		wrapper.style.alignItems = 'center';
		wrapper.style.cursor = 'pointer';
		wrapper.style.padding = '4px 8px';
		wrapper.style.borderRadius = '3px';
		wrapper.onmouseenter = () =>
			(wrapper.style.background = 'rgba(0,0,0,0.04)');
		wrapper.onmouseleave = () => (wrapper.style.background = '');
		wrapper.setAttribute('role', 'menuitemradio');
		wrapper.tabIndex = 0;

		const check = document.createElement('span');
		check.style.display = 'inline-block';
		check.style.width = '18px';
		check.style.textAlign = 'center';
		check.style.marginRight = '8px';
		check.textContent = selected ? '✓' : '';

		const label = document.createElement('span');
		label.textContent = labelText;

		wrapper.appendChild(check);
		wrapper.appendChild(label);

		const select = () => {
			// update all wrappers' checkmarks and aria-checked
			for (const w of optionWrappers) {
				const ch = w.querySelector('span');
				if (!ch) continue;
				if (w === wrapper) {
					ch.textContent = '✓';
					w.setAttribute('aria-checked', 'true');
				} else {
					ch.textContent = '';
					w.setAttribute('aria-checked', 'false');
				}
			}

			// apply layer change
			try {
				map.setPaintProperty(
					'satellite-layer',
					'raster-opacity',
					value ? 1 : 0
				);
			} catch (err) {
				// ignore if layer not present
			}

			menu.style.display = 'none';
		};

		wrapper.addEventListener('click', (e) => {
			e.stopPropagation();
			select();
		});
		wrapper.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				select();
			}
		});

		optionWrappers.push(wrapper);
		menu.appendChild(wrapper);
	};

	createOption('layer-topo', 'Topography', false, true);
	createOption('layer-sat', 'Satellite', true, false);

	// Clicking the button toggles the menu and positions it under the mouse cursor
	const onButtonClick = (e: MouseEvent) => {
		e.stopPropagation();

		// Append menu to map container (once)
		if (!menu.parentElement) mapContainer.appendChild(menu);

		const rect = mapContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Toggle visibility
		const willShow = menu.style.display === 'none';
		menu.style.display = willShow ? 'block' : 'none';

		if (willShow) {
			// place near cursor, a few pixels below
			let left = x;
			let top = y + 6;
			// apply tentative position
			menu.style.left = `${left}px`;
			menu.style.top = `${top}px`;

			// measure and keep inside map bounds
			const mRect = menu.getBoundingClientRect();
			if (mRect.right > rect.right) {
				left = left - (mRect.right - rect.right) - 10;
				menu.style.left = `${Math.max(6, left)}px`;
			}
			if (mRect.bottom > rect.bottom) {
				top = top - (mRect.bottom - rect.bottom) - 10;
				menu.style.top = `${Math.max(6, top)}px`;
			}
		}
	};

	btn.addEventListener('click', onButtonClick);

	// Close menu when clicking/touching outside
	const onDocClick = (ev: Event) => {
		const target = (ev.target as Node) || null;
		if (!target) return;
		if (
			menu.style.display === 'block' &&
			!menu.contains(target) &&
			target !== btn
		) {
			menu.style.display = 'none';
		}
	};

	document.addEventListener('click', onDocClick);
	document.addEventListener('touchstart', onDocClick as EventListener);

	map.addControl(
		{
			onAdd: () => container,
			onRemove: () => {
				// cleanup
				btn.removeEventListener('click', onButtonClick);
				document.removeEventListener('click', onDocClick);
				document.removeEventListener('touchstart', onDocClick);
				if (menu.parentElement === mapContainer) mapContainer.removeChild(menu);
				if (container.parentNode) container.parentNode.removeChild(container);
			}
		},
		'top-right'
	);
};
