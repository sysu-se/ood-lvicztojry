<script>
	import { onMount } from 'svelte';
	import Board from './components/Board/index.svelte';
	import Controls from './components/Controls/index.svelte';
	import Header from './components/Header/index.svelte';
	import Modal from './components/Modal/index.svelte';

	onMount(async () => {
		try {
			const gameModule = await import('@sudoku/game');
			const { modal } = await import('@sudoku/stores/modal');
			const { gameWon } = await import('@sudoku/stores/game');
			const { validateSencode } = await import('@sudoku/sencode');
			
			const game = gameModule.default;
			
			let hash = location.hash;
			if (hash.startsWith('#')) {
				hash = hash.slice(1);
			}
			let sencode;
			if (validateSencode(hash)) {
				sencode = hash;
			}
			
			modal.show('welcome', { onHide: game.resume, sencode });
			
			gameWon.subscribe(won => {
				if (won) {
					try {
						game.pause();
						modal.show('gameover');
					} catch (error) {
						console.error('Error handling game won:', error);
					}
				}
			});
		} catch (error) {
			console.error('Error loading game module:', error);
		}
	});
</script>

<header>
	<Header />
</header>

<section>
	<Board />
</section>

<footer>
	<Controls />
</footer>

<Modal />
