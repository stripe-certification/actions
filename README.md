# actions

Collection of private Actions for operating Stripe's Training &amp; Cert program.

## Building

To build an Action, you need to change directory into the action's folder and run:

```shell
ncc build index.js -o dist
```

This will create a folder which is what the action points to when it runs (not the ./index.js):

```json
main: 'dist/index.js'
```
