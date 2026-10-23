const fs = require('fs');
const path = require('path');

const ICON = /\.(png|svg)$/;

for (const dir of ['nodes', 'credentials']) {
	if (!fs.existsSync(dir)) continue;

	fs.cpSync(dir, path.join('dist', dir), {
		recursive: true,
		filter: (src) => fs.statSync(src).isDirectory() || ICON.test(src),
	});
}
