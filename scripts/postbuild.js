const fs = require('fs');
const inlineCriticalCss = require('inline-critical');
const reaver = require('reaver');

function throwIfError(err) {
	if (err) throw err;
}

function replaceInBuffer(buf, a, b) {
	if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
	const idx = buf.indexOf(a);
	if (idx === -1) return buf;
	if (!Buffer.isBuffer(b)) b = Buffer.from(b);

	const before = buf.slice(0, idx);
	const after = replaceInBuffer(buf.slice(idx + a.length), a, b);
	const len = idx + b.length + after.length;
	return Buffer.concat([before, b, after], len);
}

fs.readFile('./src/template.html', (err, templateHtml) => {
	throwIfError(err);

	// Process Tailwind CSS to generate proper CSS for inlining
	const { execSync } = require('child_process');
	try {
		execSync('npx tailwindcss -i ./src/styles/global.css -o ./dist/bundle_for_inline.css --minify', { stdio: 'pipe' });
	} catch (error) {
		console.error('Error processing Tailwind CSS:', error);
		return;
	}

	fs.readFile('./dist/bundle_for_inline.css', (err, bundleCss) => {
		// If processed bundle.css exists, inline it. Otherwise, proceed without inlining
		if (err) {
			// If bundle.css doesn't exist, just process JS without CSS inlining
			processJSWithoutInlining(templateHtml);
		} else {
			// Inline the CSS into the template HTML and return resulting HTML (does some file system operations)
			const inlinedHtml = inlineCriticalCss(templateHtml, bundleCss, {
				basePath: 'dist',
				extract:  true,
				noscript: 'head',
			});

			// Remove temporary processed css
			fs.unlink('./dist/bundle_for_inline.css', throwIfError);

			// Continue processing JS
			continueWithJSProcessing(inlinedHtml);
		}
	});
});

function processJSWithoutInlining(templateHtml) {
	// Read bundle.js
	fs.readFile('./dist/bundle.js', (err, bundleJs) => {
		throwIfError(err);

		// Calculate file hash and get filename for bundle.js
		const hashedBundleName = reaver.rev('bundle.js', bundleJs);

		// Replace bundle.js filename in HTML (but keep CSS reference)
		let outputHtml = templateHtml.toString().replace(/\/bundle\.css/, '/bundle.css');
		outputHtml = replaceInBuffer(outputHtml, 'bundle.js', hashedBundleName);

		// Write final HTML into index.html
		fs.writeFile('./dist/index.html', outputHtml, throwIfError);

		// Rename bundle.js
		fs.rename('./dist/bundle.js', './dist/' + hashedBundleName, throwIfError);
	});
}

function continueWithJSProcessing(inlinedHtml) {
	// Read bundle.js
	fs.readFile('./dist/bundle.js', (err, bundleJs) => {
		throwIfError(err);

		// Calculate file hash and get filename for bundle.js
		const hashedBundleName = reaver.rev('bundle.js', bundleJs);

		// Replace bundle.js filename in HTML
		const outputHtml = replaceInBuffer(inlinedHtml, 'bundle.js', hashedBundleName);

		// Write final HTML into index.html
		fs.writeFile('./dist/index.html', outputHtml, throwIfError);

		// Rename bundle.js
		fs.rename('./dist/bundle.js', './dist/' + hashedBundleName, throwIfError);
	});
}