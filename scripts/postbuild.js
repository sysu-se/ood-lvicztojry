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

// Process Tailwind CSS first before inlining
const { exec } = require('child_process');

// First process Tailwind CSS to generate proper CSS
exec('npx tailwindcss -i ./src/styles/global.css -o ./dist/bundle_processed.css --minify', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    
    // Now proceed with the original flow using the processed CSS
    fs.readFile('./src/template.html', (err, templateHtml) => {
        throwIfError(err);

        fs.readFile('./dist/bundle_processed.css', (err, bundleCss) => {
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
                fs.unlink('./dist/bundle_processed.css', throwIfError);

                // Continue processing JS
                continueWithJSProcessing(inlinedHtml);
            }
        });
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