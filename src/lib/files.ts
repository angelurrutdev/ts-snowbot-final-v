import { glob } from "glob"

export async function loadFiles(dir: string, recursive: boolean = true): Promise<string[]> {
    const isDev = __filename.endsWith('.ts')
    const fullPath = `${process.cwd().replaceAll('\\', '/')}/${isDev ? 'src' : 'dist'}`
    const ext = isDev ? 'ts' : 'js'
    const pattern = recursive ? `${fullPath}/${dir}/**/*.${ext}` : `${fullPath}/${dir}/*.${ext}`
    const files = await glob(pattern)
    files.forEach(file => delete require.cache[require.resolve(file)])
    return files
}
