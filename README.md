# actions

Collection of private Actions for operating Stripe's Training &amp; Cert program.

## Building an Action

To build an Action, you need to change directory into the action's folder and run:

```shell
ncc build index.js -o dist
```

Instead of running ./index.js it will run ./dist/index.js which has the packages pre-installed.
