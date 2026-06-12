export interface AnimationControllerStatus {
	dateIndex: number;
	birdIndex: number;
	inIntroduction: boolean;
	isRunning: boolean;
}

export interface AnimationStatusMessages {
	date: string;
	observations: string;
	progress: string;
	name: string;
}

export class AnimationController {
	birds: Record<string, string[]>;
	allDates: string[];
	dailyDurationMs: number;
	pauseDurationMs: number;

	status = $state<AnimationControllerStatus>({
		dateIndex: 0,
		birdIndex: 0,
		inIntroduction: true,
		isRunning: false
	});

	statusMessages = $state<AnimationStatusMessages>({
		date: '',
		observations: '',
		progress: '',
		name: ''
	});

	errorMessage = $state('');

	// A reactive state representing the current bird display event
	currentBird = $state<{ name: string; index: number; runId: number } | null>(
		null
	);

	private cancelDelay: (() => void) | null = null;
	private currentRunId = 0;

	constructor(
		birds: Record<string, string[]>,
		dailyDurationMs = 30000,
		pauseDurationMs = 5000
	) {
		this.birds = birds;
		this.allDates = Object.keys(birds);
		this.dailyDurationMs = dailyDurationMs;
		this.pauseDurationMs = pauseDurationMs;
	}

	getActiveRunId(): number {
		return this.currentRunId;
	}

	resetBirdsToday(dateIndex: number) {
		this.cancelDelay?.();
		this.cancelDelay = null;
		this.currentBird = null;
		this.status = {
			dateIndex,
			birdIndex: 0,
			inIntroduction: true,
			isRunning: false
		};
		this.statusMessages = {
			date: '',
			observations: '',
			progress: '',
			name: ''
		};
	}

	jumpTo(dateIndex: number) {
		this.resetBirdsToday(dateIndex);
		this.runDates();
	}

	navigate(direction: 'prev' | 'next') {
		const delta = direction === 'next' ? 1 : -1;
		const dateIndex = Math.max(
			0,
			Math.min(this.status.dateIndex + delta, this.allDates.length - 1)
		);
		this.resetBirdsToday(dateIndex);
		this.runDates();
	}

	togglePlay() {
		if (this.status.isRunning) {
			this.status.isRunning = false;
			this.cancelDelay?.();
			this.cancelDelay = null;
		} else {
			this.runDates();
		}
	}

	// Delay helper
	private delay(ms: number, runId: number) {
		return new Promise<void>((resolve, reject) => {
			if (!this.status.isRunning || runId !== this.currentRunId) {
				reject(new DOMException('Aborted', 'AbortError'));
				return;
			}
			const timeout = setTimeout(() => {
				this.cancelDelay = null;
				resolve();
			}, ms);
			this.cancelDelay = () => {
				this.status.isRunning = false;
				clearTimeout(timeout);
				reject(new DOMException('Aborted', 'AbortError'));
			};
		});
	}

	private formatBirdName(name: string): string {
		if (!name.includes(',')) return name;
		const [species, type] = name.split(',').map((s) => s.trim());
		return `${type} ${species}`;
	}

	private async doIntroduction(
		today: string,
		birdsToday: string[],
		runId: number
	) {
		this.statusMessages.date = today;
		this.statusMessages.observations = `${birdsToday.length} observations`;
		await this.delay(this.pauseDurationMs, runId);
	}

	private async doBird(birdsToday: string[], runId: number) {
		const birdName = birdsToday[this.status.birdIndex];
		const interval = this.dailyDurationMs / birdsToday.length;

		this.statusMessages.name = this.formatBirdName(birdName);
		this.statusMessages.progress = `${this.status.birdIndex + 1} / ${birdsToday.length}`;

		// Trigger the current bird reactive state change
		this.currentBird = {
			name: birdName,
			index: this.status.birdIndex,
			runId
		};

		await this.delay(interval, runId);
	}

	private async runBirdsToday(today: string, runId: number) {
		const birdsToday = this.birds[today];
		if (!birdsToday) return;

		try {
			if (this.status.inIntroduction) {
				await this.doIntroduction(today, birdsToday, runId);
				if (runId !== this.currentRunId) return;
				this.status.inIntroduction = false;
			}

			while (
				this.status.birdIndex < birdsToday.length &&
				this.status.isRunning &&
				runId === this.currentRunId
			) {
				await this.doBird(birdsToday, runId);
				if (this.status.isRunning && runId === this.currentRunId) {
					this.status.birdIndex += 1;
				}
			}
		} catch (e) {
			return; // Exit immediately if aborted
		}

		if (this.status.isRunning && runId === this.currentRunId) {
			this.status.inIntroduction = true;
			this.status.birdIndex = 0;
		}
	}

	async runDates() {
		if (typeof window !== 'undefined' && !navigator.onLine) {
			this.errorMessage =
				'No internet connection detected. Please check your network and try again.';
			return;
		}
		if (this.status.isRunning) return;
		this.status.isRunning = true;
		const runId = ++this.currentRunId;

		while (
			this.status.dateIndex < this.allDates.length &&
			this.status.isRunning &&
			runId === this.currentRunId
		) {
			await this.runBirdsToday(this.allDates[this.status.dateIndex], runId);
			if (runId !== this.currentRunId) break;
			if (
				this.status.isRunning &&
				this.status.dateIndex < this.allDates.length - 1
			) {
				this.status.dateIndex += 1;
			} else {
				break;
			}
		}

		if (this.status.isRunning && runId === this.currentRunId) {
			this.status.dateIndex = 0;
			this.status.isRunning = false;
		}
	}
}
