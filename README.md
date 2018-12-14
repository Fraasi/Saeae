### Sää

Electron app to show weather temperature in the notification area/system tray.  
Right click icon for more weather info and to change city or quit app.  
Double click icon for a pop-up for even more info on sun and moon.  
Red color for over 0&deg;C & blue for under.

As for the city input, you can use just a city name, a city name with country code separated by comma or city id number from openweathermap.org.  
For example  
`dresden`  
`dresden, de`  
`2935022`  
are all valid inputs for the city of Dresden in Germany

**Note:** The sun and moon information are calculated using [sunCalc](https://github.com/mourner/suncalc) and might not be entirely accurate.

[Latest release](https://github.com/Fraasi/Saeae/releases/latest)


In tray  
![Tray pic](pics/2018-10-26_1541.png)

On right click  
![right click](pics/2018-10-26_1538.png)  

On double click  
![right click](pics/2018-08-01_1941.png)  


#### Todo before next release
* [x] new browserwindow for left click, put weather info there, same style as doubleclick, 'data from & forecast at openweathermap'
* [x] right click menu only github/fraasi, change city & quit app
* [x] input should also take city code, inform about country code if city not found or wrong (notification use?)
* [ ] better font & some styles & logo (lets see if J comes up with anything)
* [x] all error codes to left click
* [x] electron-positioner to position both windows to right corner
* [ ] different icons for diff wins?
* [x] update deps
* [ ] temp background
* [ ] click firing when double cicking, file an issue
* [ ] readme:
  * [x] inform suncalc not always accurate
* [ ] fullmoon month -1

