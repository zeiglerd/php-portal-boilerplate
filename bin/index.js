#! /usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const _ = require('lodash')
const argv = require('minimist')(process.argv.slice(2))
const Mustache = require('mustache')

const DEBUG = 0

// Required args
const projectName = argv.projectName
const projectDomain = argv.projectDomain

// Optional args
const projectTheme = argv.projectTheme ?? 'one'
const colorPrimary = argv.colorPrimary ?? 'rgb(105,103,206)'
const colorSecondary = argv.colorSecondary ?? 'rgb(89,89,89)'
const localFtpHost = argv.localFtpHost ?? 'your_local_ftp_host_here'
const localFtpPort = argv.localFtpPort ?? 'your_local_ftp_port_here'
const localFtpUser = argv.localFtpUser ?? 'your_local_ftp_user_here'
const localDbHost = argv.localDbHost ?? 'your_local_db_host_here'
const localDbPort = argv.localDbPort ?? 'your_local_db_port_here'
const localDbPrefix = argv.localDbPrefix
const localDbName = argv.localDbName ?? 'your_local_db_name_here'
const localDbUser = argv.localDbUser ?? 'your_local_db_user_here'
const qaFtpHost = argv.qaFtpHost ?? 'your_qa_ftp_host_here'
const qaFtpPort = argv.qaFtpPort ?? 'your_qa_ftp_port_here'
const qaFtpUser = argv.qaFtpUser ?? 'your_qa_ftp_user_here'
const qaDbHost = argv.qaDbHost ?? 'your_qa_db_host_here'
const qaDbPort = argv.qaDbPort ?? 'your_qa_db_port_here'
const qaDbPrefix = argv.qaDbPrefix
const qaDbName = argv.qaDbName ?? 'your_qa_db_name_here'
const qaDbUser = argv.qaDbUser ?? 'your_qa_db_user_here'
const prodFtpHost = argv.prodFtpHost ?? 'your_prod_ftp_host_here'
const prodFtpPort = argv.prodFtpPort ?? 'your_prod_ftp_port_here'
const prodFtpUser = argv.prodFtpUser ?? 'your_prod_ftp_user_here'
const prodDbHost = argv.prodDbHost ?? 'your_prod_db_host_here'
const prodDbPort = argv.prodDbPort ?? 'your_prod_db_port_here'
const prodDbPrefix = argv.prodDbPrefix
const prodDbName = argv.prodDbName ?? 'your_prod_db_name_here'
const prodDbUser = argv.prodDbUser ?? 'your_prod_db_user_here'

if (argv._.length) {
  console.log('Warning: Omitted keys are no longer allowed for args starting at version alpha-0.0.4 !!')
}

if (!projectName || !projectDomain) {
  console.log('Note: Configurations — including passwords — can be modified later in your .env files.')
  console.log('Required args:')
  console.log(`    - projectName (Type: string)
    - projectDomain (Type: string)`)
  console.log('Optional args:')
  console.log(`    - projectTheme (Type: string; Default: one)
    - colorPrimary (Type: string; Default: rgb(105,103,206))
    - colorSecondary (Type: string; Default: rgb(89,89,89))
    - localFtpHost (Type: string)
    - localFtpPort (Type: number)
    - localFtpUser (Type: string)
    - localDbHost (Type: string)
    - localDbPort (Type: number)
    - localDbPrefix (Type: string)
    - localDbName (Type: string)
    - localDbUser (Type: string)
    - qaFtpHost (Type: string)
    - qaFtpPort (Type: number)
    - qaFtpUser (Type: string)
    - qaDbHost (Type: string)
    - qaDbPort (Type: number)
    - qaDbPrefix (Type: string)
    - qaDbName (Type: string)
    - qaDbUser (Type: string)
    - prodFtpHost (Type: string)
    - prodFtpPort (Type: number)
    - prodFtpUser (Type: string)
    - prodDbHost (Type: string)
    - prodDbPort (Type: number)
    - prodDbPrefix (Type: string)
    - prodDbName (Type: string)
    - prodDbUser (Type: string)`)
  console.log('Example:')
  console.log(`  $ npx php-portal-boilerplate --projectName="ZeiglerD" ^
      --projectDomain="zeiglerd.com" ^
      --projectTheme="zeiglerd-theme" ^
      --colorPrimary="rgb(105,103,206)" ^
      --colorSecondary="rgb(89,89,89)" ^
      --localFtpHost="your_local_ftp_host_here" ^
      --localFtpPort="your_local_ftp_port_here" ^
      --localFtpUser="your_local_ftp_user_here" ^
      --localDbHost="your_local_db_host_here" ^
      --localDbPort="your_local_db_port_here" ^
      --localDbName="your_local_db_name_here" ^
      --localDbUser="your_local_db_user_here"`)
  process.exit(1)
}

const removeFiles = async (dir, files) => {
  files.forEach((file) => fs.rmSync(`${dir}/${file}`, { recursive: true }))
}

const replaceFiledata = async (dir, file, texts) => {
  let data = fs.readFileSync(`${dir}/${file}`, { encoding: 'utf8', flag: 'r' })
  for (const [key, value] of Object.entries(texts)) {
    data = data.replaceAll(key, value)
  }
  fs.writeFileSync(`${dir}/${file}`, data, 'utf-8')
}

const removeFiledata = async (dir, file, texts) =>
  await replaceFiledata(dir, file, ...texts.map((text) => ({ [text]: '' })))

const stepCloneBoilerplate = async (projectPath) => {
  console.log('Cloning Boilerplate...')

  if (DEBUG && fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true })
  }

  fs.mkdirSync(projectPath)

  process.chdir(projectPath)

  execSync(`git clone --depth 1 https://github.com/zeiglerd/php-portal-boilerplate ${projectPath}`, { stdio: 'inherit' })
}

const stepCleanUp = async (projectPath) => {
  console.log('Cleaning Up...')

  await removeFiles(projectPath, ['.git', 'bin/index.js'])

  await removeFiledata(projectPath, 'package.json', [
    '    "php-portal-boilerplate": "bin/index.js",\r\n'
  ])

  await replaceFiledata(projectPath, 'package.json', {
    'php-portal-boilerplate': '{{projectDomain}}',
    [require(`${process.cwd()}/package`).version]: require(`${process.cwd()}/composer`).version
  })
}

const stepPrepareBoilerplate = async (projectPath) => {
  console.log('Preparing Boilerplate...')

  execSync('npm i', { stdio: 'inherit' })
}

const stepInjectConfiguration = async (projectPath) => {
  console.log('Injecting Configuration...')

  const injectConfigurationIntoFilenames = async (dir, map) => {
    await fs.readdirSync(dir).forEach(async (file) => {
      const originalPath = `${dir}/${file}`
      let newPath
      if (originalPath.includes('{{') && originalPath.includes('}}')) {
        newPath = Mustache.render(originalPath, map)
        fs.renameSync(originalPath, newPath)
      }
      if (fs.statSync(newPath ?? originalPath).isDirectory()) {
        return await injectConfigurationIntoFilenames(newPath ?? originalPath, map)
      }
    })
  }

  const injectConfigurationIntoFiledata = async (dir, map, ignore) => {
    await fs.readdirSync(dir).forEach(async (file) => {
      if (ignore.includes(file)) {
        return
      }
      const filepath = `${dir}/${file}`
      if (fs.statSync(filepath).isDirectory()) {
        return await injectConfigurationIntoFiledata(filepath, map, ignore)
      }
      const data = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' })
      fs.writeFileSync(filepath, Mustache.render(data, map), 'utf-8')
    })
  }

  const prependPrefix = (prefix, value) => prefix ? `${prefix}${value.replace(`/^(${prefix})+/`)}` : value

  await injectConfigurationIntoFilenames(projectPath, { projectTheme })
  await injectConfigurationIntoFiledata(projectPath, {
    projectName,
    projectNamePascalCase: _.upperFirst(_.camelCase(projectName)),
    projectDomain,

    projectTheme,
    colorPrimary,
    colorSecondary,

    localFtpHost,
    localFtpPort,
    localFtpUser,
    localFtpPass: 'your_local_ftp_pass_here',
    localDbHost,
    localDbPort,
    localDbName: prependPrefix(localDbPrefix, localDbName),
    localDbUser: prependPrefix(localDbPrefix, localDbUser),
    localDbPass: 'your_local_db_pass_here',

    qaFtpHost,
    qaFtpPort,
    qaFtpUser,
    qaFtpPass: 'your_qa_ftp_pass_here',
    qaDbHost,
    qaDbPort,
    qaDbName: prependPrefix(qaDbPrefix, qaDbName),
    qaDbUser: prependPrefix(qaDbPrefix, qaDbUser),
    qaDbPass: 'your_qa_db_pass_here',

    prodFtpHost,
    prodFtpPort,
    prodFtpUser,
    prodFtpPass: 'your_prod_ftp_pass_here',
    prodDbHost,
    prodDbPort,
    prodDbName: prependPrefix(prodDbPrefix, prodDbName),
    prodDbUser: prependPrefix(prodDbPrefix, prodDbUser),
    prodDbPass: 'your_prod_db_pass_here',
  }, ['node_modules'])
}

const stepInstallDependencies = async () => {
  console.log('Installing Dependencies...')

  execSync('composer update', { stdio: 'inherit' })
}

const stepCreateGitRepository = async () => {
  console.log('Creating Git Repository...')

  execSync('git init -b main', { stdio: 'inherit' })
  execSync('git add .', { stdio: 'inherit' })
  execSync('git commit -m "Initial commit"', { stdio: 'inherit' })

  // git remote add upstream https://github.com/zeiglerd/php-portal-boilerplate.git
  // git remote set-url --push upstream no-pushing
}

(async () => {
  try {
    const projectPath = `${process.cwd()}/${projectDomain}`

    await stepCloneBoilerplate(projectPath)
    await stepCleanUp(projectPath)
    await stepPrepareBoilerplate(projectPath)
    await stepInjectConfiguration(projectPath)
    await stepInstallDependencies()
    await stepCreateGitRepository()

    console.log('Finished!')
    console.log('')
    console.log('Begin development by starting your webstack, modifying relevant .env files, and then running:')
    console.log('  $ composer dev:local')
    console.log('')
    console.log('Be sure to look at the README.md for more commands and information about the project!')
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.log(`The ${projectDomain} directory already exists here.`)
      process.exit(1)
    }
    console.log(error)
    process.exit(1)
  }
})()
