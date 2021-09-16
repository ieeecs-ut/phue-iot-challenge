# phue-gateway
Philips Hue Bridge gateway service over websockets.  
Intended to allow users to connect to a Philips hue bridge within an isolated network from the internet.
This is accomplished by directing all HTTP traffic over a websocket from an AWS server to a laptop connected to the internet and the hue bridge's network.

## how to use
- external
  - meant to run on AWS or some public server
  - go to `external` folder, run `npm i`, then `npm test` for dev env or `npm start` for prod env
- internal
  - meant to run on a laptop which is connected to both the internet and the isolated local network
  - go to `internal` folder, run `npm i`, then `npm test` for dev env or `npm start` for prod env
- tests
  - tests end-to-end
  - go to tests folder, activate venv with `source ./venv/bin/activate`, run `python3 main.py`
  - edit `main.py` to select a test routine/case, and edit the target variable at the top to select what to test (IP address of a real hue bridge on the current neetwork, or the URL of this gateway)
