## Saeae (Sää)  
Electron app to show weather temperature in the notification area/system tray.  

[![https://github.com/Fraasi/Saeae/releases/latest](https://img.shields.io/github/release/fraasi/saeae.svg)](https://github.com/Fraasi/Saeae/releases/latest)  
Windows release only at this time (sorry).

### How to?  
Download installer from above link. Running the installer should put a shortcut to your desktop and launch the app. To have it run on startup, you can put the shortcut here (win10) `C:\Users\<USER_NAME>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`.  
**Note:** This app does not detect your location. After install you must manually change the default city to your own.

Left click tray icon to show/hide weather info window.  
Double click to show/hide sun and moon info window.  
Right click icon for menu to change city or quit app.  

For the city input, you can use just a city name, a city name with country code separated by comma or city id number from openweathermap.org.  
For example  
`dresden`  
`dresden, de`  &nbsp;&nbsp;&nbsp;&nbsp;// more precise  
`2935022`  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// never wrong city  
are all valid inputs for the city of Dresden in Germany.  
No umlauts: ä -> ae, ö -> oe, ü -> ue.

Updates data on launch or when the city is changed and then automatically every twenty minutes.  
There's no minus or plus sign in the tray to keep the font size as big and clear as possible, so red color for over 0&deg;C & blue for under.  
**Note:** The sun and moon information are calculated using [sunCalc](https://github.com/mourner/suncalc) & [lune.js](https://github.com/ryanseys/lune) and might not be entirely accurate. 


### Pics

Weather info window   
![Tray pic](pics/2018-12-18_2114.png)

Astral info window  
![right click](pics/2018-12-18_2120.png)  

Right click menu  
![right click](pics/2018-12-18_2122.png)  


## Todo
- [ ] test
- [ ] if fullmoon over, show next month?
- [ ] update readme & pics



<!-- icons from https://www.s-ings.com/typicons/ & material.io/tools/icons-->
