"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFiles = loadFiles;
const glob_1 = require("glob");
async function loadFiles(dir, recursive = true) {
    const isDev = __filename.endsWith('.ts');
    const fullPath = `${process.cwd().replaceAll('\\', '/')}/${isDev ? 'src' : 'dist'}`;
    const ext = isDev ? 'ts' : 'js';
    const pattern = recursive ? `${fullPath}/${dir}/**/*.${ext}` : `${fullPath}/${dir}/*.${ext}`;
    const files = await (0, glob_1.glob)(pattern);
    files.forEach(file => delete require.cache[require.resolve(file)]);
    return files;
}
