//Constants
//Templates
const templateBase = 'template-' //the base name for the templates
const cityTemplate = 'city' //the city template for the menu
const weatherTodayTemplate = 'weather-today' //the weather for today template
const weatherCellTemplate = 'weather-single-day' //single day template

//For openWeathermap api
const weatherImageUrl = 'https://openweathermap.org/img/wn/' // weather img url
const APIKEY = 'f21e9108f416c65e88bbdb8bec1927b9' //the api key
const baseAPIUrl = 'https://api.openweathermap.org/data/2.5/'
const currentWeatherAppend = 'weather?' //current weather get path
const forecastAppend = 'onecall?' //forecast weather get path
const defaultUnits = 'imperial' //the default units for the information

//non-constant variables
let storedCities = [] // the list of cities
let currentWeatherObject = null //current weather information
let fiveDayForecast = [] //the forecast for the next 5 days
let searchFromInput = false

$(document).ready(function () {
	initApp() //initialize our app
	//add our event listeners
	$('body').on('click', '.change-city', (e) => changeCity(e)) //clicking on existing city in list
	$('body').on('click', '#do-search', () => getCityWeather()) //clicking on magnifying glass/search button
	$('body').on('click', '.delete-city', (e) => removeCity(e)) //clicking on delete a saved city
	$('body').on('click', '#clear-text', () => clearText()) //clicking on clear text button
	$('body').on('click', '#clear-history', () => clearHistory()) //clicking clear history button
})

const initApp = () => {
	reset() //reset everything
	getCitiesFromStorage() //get cities from storage
	updateDomWithCityInfo()

	const lastSearch = loadLastSearch() //get the last searched city
	if (lastSearch) {
		//if there is a last searched city
		$('#city-search').val(lastSearch) //set the value of our input to the last searched city
		getWeather(lastSearch) //search for this city
	}
}

const clearText = () => {
	//clear the text box
	$('#city-search').val('')
}

const clearHistory = () => {
	//clear the last searched city
	$('#city-search').val('')
	clearLastSearch()
}

const getCityWeather = (targetElement) => {
	searchFromInput = true // set searchFromInput to true
	//get the city name
	const city = $('#city-search').val() //get the city value

	if (!city) {
		//missing city info
		displayError('Please type in a city') //tell the user
		return
	}

	getWeather(city) //get the city information
}

const changeCity = (targetElement) => {
	//the user clicked a city in our list
	if (!targetElement.currentTarget) {
		//problem...just exit
		return
	}

	const span = targetElement.currentTarget
	$(span).addClass('active') //set the city to active
	const city = $(span).data('city')
	getWeather(city) //get the weather for the city
}

const getWeather = async (city) => {
	reset() //reset everything
	$('#loading').show()
	//added minor delay
	await delay(2000)

	//create the parameters for our get request
	let weatherParams = { q: city, appid: APIKEY, units: defaultUnits }

	//build our get url
	const currentWeatherUrl = `${baseAPIUrl}${currentWeatherAppend}${$.param(
		weatherParams
	)}`

	//make our ajax call
	$.ajax({
		url: currentWeatherUrl,
		type: 'GET',
		dataType: 'json',
		success: (data) => {
			handleCurrentWeatherSuccess(data, city) //pass the information to our success handler
		},
		error: (data) => {
			handleCurrentWeatherError(data) //pass the information to our error handler
		},
		complete: () => {
			//when done get the other data
			getOtherData()
		},
	})
}

//process our success response
const handleCurrentWeatherSuccess = (data, city) => {
	//no data? display an error
	if (!data) {
		displayError('Something went wrong, please try again...')
		return
	}

	//create our weather object with the data
	currentWeatherObject = new CurrentDayWeather(data, city)
}

//process the error response
const handleCurrentWeatherError = (data) => {
	currentWeatherObject = null //set the currentWeatherObject to null so it will stop processing
	displayError('Unable find that city, please try again')
}

const getOtherData = () => {
	//if we don't have weather object, don't get the other data
	if (!currentWeatherObject) {
		return
	}

	//our other request params
	const otherParams = {
		exclude: 'minutely, hourly',
		units: defaultUnits,
		lat: currentWeatherObject.latitude,
		lon: currentWeatherObject.longitude,
		appid: APIKEY,
	}

	//build our other request URL
	const otherWeatherUrl = `${baseAPIUrl}${forecastAppend}${$.param(
		otherParams
	)}`

	//make our ajax call
	$.ajax({
		url: otherWeatherUrl,
		type: 'GET',
		dataType: 'json',
		success: (data) => {
			if (data && data.current) {
				// there is data AND there is data object called current
				//we just need the uv index from the current data
				currentWeatherObject.populateUvIndex(data.current.uvi)
			}

			if (data && data.daily) {
				//there is data AND there is a data object called daily
				let forecastData = data.daily
				forecastData.splice(0, 1) //remove current weather data
				forecastData.splice(-2, 2) //remove last 2 days
				createForecastData(forecastData)
			}

			weeklySuccess()
		},
		error: (data) => {
			handleForecastWeatherError(data)
		},
		complete: () => {
			populateCurrentWeather()
			populateForecast()
			displaySuccess()

			//save the city to our localStorage
			saveCity()
			updateDomWithCityInfo()

			if (searchFromInput) {
				saveLastSearch()
				searchFromInput = false
			}
		},
	})
}

const handleForecastWeatherError = (data) => {
	fiveDayForecast = []
	weeklyError('Unable find weekly forecast, please try again')
}

const createForecastData = (data) => {
	if (!data) {
		return
	}
	fiveDayForecast = data.map((x) => new ForecastDayWeather(x))
}

const populateCurrentWeather = () => {
	if (!currentWeatherObject) {
		return
	}
	//get our template
	const template = getTemplate(`#${templateBase}${weatherTodayTemplate}`)
	const weatherElement = templateReplace(template, currentWeatherObject)
	$('#weather-today').html(weatherElement)
}

const populateForecast = () => {
	if (fiveDayForecast.length == 0) {
		return
	}
	const template = getTemplate(`#${templateBase}${weatherCellTemplate}`)
	const forecastElement = fiveDayForecast.map((x) => {
		return templateReplace(template, x)
	})
	$('#weekly-weather').html(forecastElement)
}

const getCitiesFromStorage = () => {
	storedCities = JSON.parse(localStorage.getItem('stored-cities') || '[]')
}

//Local Storage functions
const saveLastSearch = () => {
	if (!currentWeatherObject || !currentWeatherObject.city) {
		return
	}
	localStorage.setItem('last-search', currentWeatherObject.city)
}

const loadLastSearch = () => {
	return localStorage.getItem('last-search') || ''
}

const clearLastSearch = () => {
	localStorage.removeItem('last-search')
}

const saveCity = () => {
	if (!currentWeatherObject || !currentWeatherObject.city) {
		return
	}

	//make sure the city doesn't already exist
	const existingCity = storedCities.find(
		(x) => x.city == currentWeatherObject.city
	)
	if (existingCity) {
		return
	}

	const cityObj = {
		id: Date.now(),
		city: currentWeatherObject.city,
	}
	storedCities.push(cityObj)
	localStorage.setItem('stored-cities', JSON.stringify(storedCities))
}

const removeCity = (targetElement) => {
	if (!targetElement.currentTarget) {
		return
	}

	const span = targetElement.currentTarget
	const cityId = $(span).data('id')

	storedCities.splice(
		storedCities.findIndex((x) => {
			return x.id == cityId
		}),
		1
	)
	localStorage.setItem('stored-cities', JSON.stringify(storedCities))
	updateDomWithCityInfo()
}

const updateDomWithCityInfo = () => {
	const template = getTemplate(`#${templateBase}${cityTemplate}`)
	const cityElements = storedCities.map((x) => {
		return templateReplace(template, x)
	})
	$('#cities').html(cityElements)

	//find the active and set it
	$('.active').removeClass('active')
	if (
		currentWeatherObject &&
		currentWeatherObject.city &&
		storedCities.length
	) {
		const activeCity = storedCities.find(
			(x) => x.city == currentWeatherObject.city
		)
		$(`#${activeCity.id}`).addClass('active')
	}
}

//Generic functions to reset, show and hide pieces
const reset = () => {
	$('#loading').hide()
	$('#failure').hide()
	$('#failure-wrapper').hide()
	$('#weekly-weather').hide()
	$('#content-weather').hide()
}

const displaySuccess = () => {
	$('#failure-text').html('')
	$('#loading').hide()
	$('#failure').hide()
	$('#content-weather').show()
}

const displayError = (error) => {
	$('#failure-text').html(error)
	$('#loading').hide()
	$('#content-weather').hide()
	$('#failure').show()
}

const weeklySuccess = () => {
	$('#failure-text').html('')
	$('#weekly-failure-text').hide()
	$('#failure-wrapper').hide()
	$('#weekly-weather').show()
}

const weeklyError = (error) => {
	$('#weekly-failure-text').html(error)
	$('#failure-wrapper').show()
	$('#weekly-weather').hide()
}

const delay = (millis) =>
	new Promise((resolve, reject) => {
		setTimeout((_) => resolve(), millis)
	})
