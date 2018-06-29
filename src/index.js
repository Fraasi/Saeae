/* eslint-disable */
import { app, Menu, Tray, BrowserWindow } from 'electron'
import path from 'path'
import mergeImg from 'merge-img'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

let mainWindow;
let tray = null;

const createWindow = () => {
	const trayIconPath = path.join(__dirname, './assets/weather-cloudy.png');

	tray = new Tray(trayIconPath);
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Item1', type: 'radio' },
		{ label: 'Item2', type: 'radio' },
		{ label: 'Item3', type: 'radio', checked: true },
		{ label: 'Item4', type: 'radio' },
	]);
	tray.setToolTip('Mansen lämpötila');
	tray.setContextMenu(contextMenu);

	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
	});

	mainWindow.loadURL(`file://${__dirname}/index.html`);
	mainWindow.webContents.openDevTools();

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
	setTimeout(() => {
		console.log('timeout')
		fetchWeather('tampere')
	}, 1000 * 6);
};


app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

function updateTrayIconWithCode(code, tray) {
	
	const numberPaths = code.split('')
		.map(n => {
			if (n === '-') {
				return path.join(__dirname, `assets/numbers/minus.png`)
			}
			return path.join(__dirname, `assets/numbers/${n}.png`)
		})

	mergeImg(numberPaths, {
		margin: '0 5 0 0'
	})
		.then((img) => {
			const numericalIcon = path.join(__dirname, 'assets/numerical-icon.png')
			img.write(numericalIcon, () => {
				tray.setImage(numericalIcon)
			})
		})
}

function fetchWeather(city) {
	const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_APIKEY}&units=metric`
	fetch(url)
		.then((response) => {
			if (!response.ok) throw response
			return response.json()
		})
		.then((json) => {
			console.log('Weather fetched:')
			updateTrayIconWithCode(Math.round(json.main.temp).toString(), tray)
			const contextMenu = Menu.buildFromTemplate([
				{ label: 'Item1', type: 'radio' },
				{ label: 'Item2', type: 'radio' },
				{ label: 'Item3', type: 'radio', checked: true },
				{ label: 'Item4', type: 'radio' },
				, {
					label: 'Quit app',
					click() {
						trayIcon.destroy()
						app.quit()
					}
				}
			]);
			tray.setContextMenu(contextMenu);

		})
		.catch((err) => {
			console.error('Error: ', err)
		})
}
