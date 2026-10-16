import type { ObserversResult, ObservationResult } from './utilities/queries';

class Controller {
	private _observer = $state<ObserversResult | null>(null);
	private _observations = $state([] as ObservationResult[]);
	private _id = $state<number | null>(null);

	set observer(observer: ObserversResult) {
		this._observer = observer;
	}

	get observer(): ObserversResult | null {
		return this._observer;
	}

	set observations(observations: ObservationResult[]) {
		this._observations = observations;
	}

	get observations() {
		return this._observations;
	}

	set id(id: number | null) {
		this._id = id;
	}

	get id(): number | null {
		return this._id;
	}
}

export const controller = new Controller();
