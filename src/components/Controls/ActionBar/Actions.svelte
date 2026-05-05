<script>
	import { userGrid, canUndo, canRedo, isExploring, isConflicted, isInExploration, applyHint, enterExploration, exitExploration, submitExploration, undo, redo } from '@sudoku/stores/grid';
	import { cursor } from '@sudoku/stores/cursor';
	import { hints } from '@sudoku/stores/hints';
	import { notes } from '@sudoku/stores/notes';
	import { settings } from '@sudoku/stores/settings';
	import { keyboardDisabled } from '@sudoku/stores/keyboard';
	import { gamePaused } from '@sudoku/stores/game';

	$: hintsAvailable = $hints > 0;

	function handleHint() {
		if (hintsAvailable) {
			applyHint($cursor);
		}
	}

	function handleUndo() {
		undo();
	}

	function handleRedo() {
		redo();
	}

	function toggleExploration() {
		if ($isExploring) {
			exitExploration();
		} else {
			enterExploration();
		}
	}

	function submitExplorationChanges() {
		submitExploration();
	}
</script>

<div class="action-buttons space-x-3">

	<button class="btn btn-round" disabled={$gamePaused || !$canUndo} on:click={handleUndo} title="Undo">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	</button>

	<button class="btn btn-round" disabled={$gamePaused || !$canRedo} on:click={handleRedo} title="Redo">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
		</svg>
	</button>

	<button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable || $userGrid[$cursor.y][$cursor.x] !== 0} on:click={handleHint} title="Hints ({$hints})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>

		{#if $settings.hintsLimited}
			<span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
		{/if}
	</button>

	<button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>

		<span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
	</button>

	<!-- 探索模式按钮 -->
	{#if $isInExploration}
		<button class="btn btn-round btn-danger" on:click={exitExploration} title="Exit Exploration (Cancel Changes)">
			<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<button class="btn btn-round btn-success" on:click={submitExplorationChanges} title="Submit Exploration">
			<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</button>
	{:else}
		<button class="btn btn-round" disabled={isConflicted()} on:click={toggleExploration} title="Enter Exploration Mode">
			<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
		</button>
	{/if}

</div>


<style>
	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-evenly;
		align-self: flex-end;
	}

	.btn-badge {
		position: relative;
	}

	.badge {
		min-height: 20px;
		min-width:  20px;
		padding: 0.25rem; /* p-1 */
		border-radius: 9999px; /* rounded-full */
		line-height: 1; /* leading-none */
		text-align: center;
		font-size: 0.75rem; /* text-xs */
		color: white; /* text-white */
		background-color: #718096; /* bg-gray-600 */
		display: inline-block;
		position: absolute;
		top: 0;
		left: 0;
	}

	.badge-primary {
		background-color: #3182ce; /* bg-primary */
	}
</style>