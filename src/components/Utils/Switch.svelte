<script>
	export let id = '';
	export let text = '';
	export let checked = false;
	export let disabled = false;
</script>

<label for="{id}" class="inline-flex items-center">
	<span class="flex-grow cursor-pointer text-lg">{text}</span>

	<span class="switch">
		<input {id} name="{id}" type="checkbox" class="sr-only" {disabled} bind:checked />
		<span class="track"></span>
		<span class="thumb"></span>
	</span>
</label>

<style>
	.switch {
		display: inline-block;
		position: relative;
		align-items: middle;
		cursor: pointer;
		user-select: none;
		background-color: transparent;
	}

	.track {
		display: block;
		width: 3rem; /* w-12 */
		height: 1.5rem; /* h-6 */
		background-color: #718096; /* bg-gray-600 */
		border-radius: 9999px; /* rounded-full */
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); /* shadow-inner */
	}

	.thumb {
		display: block;
		transition-property: all;
		transition-duration: 300ms;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		position: absolute;
		top: 0;
		left: 0;
		width: 1.5rem; /* w-6 */
		height: 1.5rem; /* h-6 */
		background-color: #fff; /* bg-white */
		border-width: 2px; /* border-2 */
		border-color: #718096; /* border-gray-600 */
		border-radius: 9999px; /* rounded-full */
	}

	input[type='checkbox']:checked ~ .thumb {
		transform: translateX(100%);
		border-color: #3182ce; /* border-primary */
	}

	input[type='checkbox']:checked ~ .track {
		transform: transform;
		transition-property: colors;
		background-color: #3182ce; /* bg-primary */
	}

	input[type='checkbox']:disabled ~ .track {
		background-color: #a0aec0; /* bg-gray-500 */
	}

	input[type='checkbox']:disabled ~ .thumb {
		background-color: #f7fafc; /* bg-gray-100 */
		border-color: #a0aec0; /* border-gray-500 */
	}

	input[type='checkbox']:focus + .track,
	input[type='checkbox']:active + .track {
		outline: none;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); /* shadow-outline */
	}
</style>