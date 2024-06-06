# zeiglerd/{{projectDomain}}


## zeiglerd/php-engine library
More information about this project can be found in `./vendor/zeiglerd/php-engine/README.md`.


## Setup dotenv
- `./dist/.env` is created by Grunt and will be overwritten at build time.
- Be sure to clone and rename `./.env.*.example` for each environment to emulate; options:
  - `./.env.local`
  - `./.env.prod`
  - `./.env.qa`


## Commands

### Install
- `composer install`

### Update
- `composer update`

### Grunt
- `composer grunt`

### Build
- `composer build:local`
- `composer build:prod`
- `composer build:qa`
- **Options**
  - `-- --env={local,qa,prod}`
  - `-- --verbose`

### Local Development
- `composer dev:local`
- `composer dev:prod`
- `composer dev:qa`
- **Options**
  - `-- --env={local,qa,prod}`
  - `-- --verbose`

### Deploy
- `composer deploy:prod`
- `composer deploy:qa`
- **Options**
  - `-- --env={qa,prod}`
  - `-- --verbose`


## Dependencies
- See **Dependencies** in `./vendor/zeiglerd/php-engine/README.md`.
