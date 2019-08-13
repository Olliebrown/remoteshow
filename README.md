RemoteShow
========================
A simple program to control powerpoint remotely through an http server.

## Install / Setup
Make sure you have node.js & npm installed then:
- Download the latest source files and expand them into a directory (or clone repo).
- In a terminal in that directory, run `npm install` to aquire all needed dependencies.
- Copy the slideshows you want to control into the same directory as the `package.json` file.

## Starting the remote control
- In a terminal in that directory, run `npm run serv` to start the remote control server.
- Pay attention to the output to see what port it is listening on (default is 8675).
- Look up the local ip address of the server.
- From the remote device, point a web browser at http://ip-address:port.

## Troubleshooting
- You may need to open up the proper port in your server device's firewall.
- It is recommended that both devices be connected to the same network.
- Avoid any NAT routers in the system to avoid needing to setup port forwarding.
- You will need to work with the person in charge of the network to get the two devices communicating.

## Status
- Only the MacOS / PowerPoint for Office 365 setup has been thoroughly tested.
- Powerpoint on Windows and Keynote will need work to be fully supported.
- To update, consider forking [showyslides](https://github.com/Olliebrown/showy) (which is heavily based on [slideshow](https://github.com/rse/slideshow)) and modifying.
