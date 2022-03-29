# actions

Collection of private Actions for operating Stripe's Training &amp; Cert program.

## Building an Action

This project requires a special build too used to package GitHub Actions with pre-installed packages. This global dependency is called [ncc](https://github.com/vercel/ncc) to install it:

```shell
npm i -g @vercel/ncc
```

Open a new terminal window and enter 'ncc' to verify it's now an available command.

To build an Action, you need to change directory into the action's folder and run:

```shell
ncc build index.js -o dist
```

Instead of running ./index.js it will run ./dist/index.js which has the packages pre-installed.

## Editing the Slack Payload

You have to disable Prettier to edit the payload JSON because double quotes are required around the keys.