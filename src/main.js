import './styles/global.css';
import App from './App.svelte';

console.log('main.js: Starting...');

let app;
try {
	app = new App({
		target: document.getElementById('app')
	});
	console.log('main.js: App created successfully');
} catch (error) {
	console.error('main.js: Error creating app:', error);
}

export default app;