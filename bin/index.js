#! /usr/bin/env node

const package = require('../package')
const { execSync } = require('child_process')
const Mustache = require('mustache')
const fs = require('fs')

const argv = require('minimist')(process.argv.slice(2))

const projectName = argv.projectName ?? argv._.shift()
const projectDomain = argv.projectDomain ?? argv._.shift()
const projectTheme = argv.projectTheme ?? argv._.shift()
const colorPrimary = argv.colorPrimary ?? argv._.shift()
const colorSecondary = argv.colorSecondary ?? argv._.shift()

if (!projectName || !projectDomain || !projectTheme || !colorPrimary || !colorSecondary) {
  console.log('Must provide: projectName, projectDomain, projectTheme, colorPrimary, colorSecondary')
  console.log('Note: Priority matters for omitted key(s).')
  console.log('For example:')
  console.log(`    $ npx php-portal-boilerplate --projectName="ZeiglerD" ^
                                 --projectDomain="zeiglerd.com" ^
                                 --projectTheme="zeiglerd-theme" ^
                                 --colorPrimary="rgb(105,103,206)" ^
                                 --colorSecondary="rgb(89,89,89)"`)
  process.exit(1)
}

const projectPath = `${process.cwd()}/${projectDomain}`

const gitRepo = package.repository.url.substring(4, package.repository.url.length - 4)

try {
  fs.mkdirSync(projectPath)
} catch (err) {
  if (err.code === 'EEXIST') {
    console.log(`The ${projectName} directory already exists here.`)
    process.exit(1)
  }
  console.log(error)
  process.exit(1)
}

(async () => {

  try {
    console.log('Generating Portal...')

    execSync(`git clone --depth 1 ${gitRepo} ${projectPath}`)

    process.chdir(projectPath)
    execSync('npm i')


    console.log('Cleaning Up...')

    const removeBuildFiles = (files) => {
      files.forEach((file) => {
        fs.rmSync(`${projectPath}/${file}`, { recursive: true })
      })
    }
    removeBuildFiles(['.git', 'bin', 'node_modules', 'package.json', 'package-lock.json'])

    const removeBuildLinesFromFileData = (file, lines) => {
      let data = fs.readFileSync(`${projectPath}/${file}`, {
        encoding: 'utf8',
        flag: 'r'
      })
      lines.forEach((line) => {
        data = data.replaceAll(line, '')
      })
      fs.writeFileSync(`${projectPath}/${file}`, data,'utf-8')
    }
    removeBuildLinesFromFileData('.gitignore', ['node_modules/\r\n'])


    console.log('Injecting Configuration...')

    const injectVariablesIntoFilenames = (dir, map) => {
      const files = fs.readdirSync(dir)
      files.forEach((file) => {
        const originalPath = `${dir}/${file}`
        let newPath
        if (originalPath.includes('{{') && originalPath.includes('}}')) {
          newPath = Mustache.render(originalPath, map)
          fs.renameSync(originalPath, newPath)
        }
        if (fs.statSync(newPath ?? originalPath).isDirectory()) {
          return injectVariablesIntoFilenames(newPath ?? originalPath, map)
        }
      })
    }
    injectVariablesIntoFilenames(projectPath, {
      projectTheme
    })

    const injectVariablesIntoFileData = (dir, map, ignore) => {
      ignore.map((each) => {
        map[each] = `{{${each}}}`
      })
      const files = fs.readdirSync(dir)
      files.forEach((file) => {
        const filepath = `${dir}/${file}`
        if (fs.statSync(filepath).isDirectory()) {
          return injectVariablesIntoFileData(filepath, map, ignore)
        }
        const data = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' })
        fs.writeFileSync(filepath, Mustache.render(data, map),'utf-8')
      })
    }
    // https://stackoverflow.com/a/38530325
    const ucwords = (words) => words.replace(/(^|\s)\S/g, (match) => (match).toUpperCase())
    const dbName = projectDomain.replaceAll(/[^a-zA-Z0-9]/g, '_')
    injectVariablesIntoFileData(projectPath, {
      projectName,
      projectDomain,
      projectTheme,
      colorPrimary,
      colorSecondary,
      localDbName: `local_${dbName}`,
      prodDbName: `vriipxfb_${dbName}`,
      prodDbUser: `vriipxfb_${dbName}`,
      qaDbName: `vriipxfb_qa_${dbName}`,
      qaDbUser: `vriipxfb_qa_${dbName}`,
      projectNamePascalCase: ucwords(projectName).replace(/[^a-zA-Z0-9]/g, ''),
    }, ['ENGINE_THEME'])


    console.log('Installing Dependencies...')
    execSync('composer update', { stdio: 'inherit' })


    console.log('Creating Git Repository...')
    execSync('git init -b main')
    execSync('git add .')
    execSync('git commit -m "Initial commit"')


    console.log('Finished!')
    console.log('')
    console.log('To begin development, bootup your webstack, create relevant .env files, and run:')
    console.log('    $ composer dev:local')

  } catch (error) {
    console.log(error)
  }
})()
