# phue-gateway
Philips Hue Bridge gateway service over websockets.  
&nbsp;  
Intended to allow users to connect to a Philips hue bridge within an isolated network from the internet. Also prevents the link error from occurring when multiple (20-40) members are trying to access the bridge at the same time.  
&nbsp;  
This is accomplished by directing all HTTP traffic over a websocket from an AWS server to a laptop connected to the internet and the hue bridge's network, from which it acts as the original requester by forwarding the request to the hue bridge; when the bridge responds and sends a request back, the laptop forwards it back to the original sender via the websocket and then the AWS web server, which completes the original senders phue-generated HTTP request. The laptop is connected to both the local network and the school's utexas network, acting as a controlled software connector between the local network and the internet.  
&nbsp;  
We used this for the Software Engineering Sprint #1, such that remote members on Zoom could simply change the Philips hue bulb's local address `192.168.0.100` to `phue.anuv.me` (the endpoint where the phue-gateway external server runs).  

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
  - edit `main.py` to select a test routine/case, and edit the target variable at the top to select what to test (IP address of a real hue bridge on the current network, or the URL of this gateway)
