class CurrentDayWeather {
	uvColors = [
		{ color: 'green', range: { min: 0, max: 2 } },
		{ color: 'yellow', range: { min: 3, max: 5 } },
		{ color: 'orange', range: { min: 6, max: 7 } },
		{ color: 'red', range: { min: 8, max: 10 } },
		{ color: 'violet', range: { min: 11, max: 20 } },
	]

	constructor(weatherData, city) {
		if (!weatherData) {
			return
		}
		const todayDate = new Date()
		this.date = moment(todayDate).format('MM/DD/YYYY')

		this.latitude =
			weatherData.coord && weatherData.coord.lat
				? weatherData.coord.lat
				: ''
		this.longitude =
			weatherData.coord && weatherData.coord.lon
				? weatherData.coord.lon
				: ''
		this.temperature =
			weatherData.main && weatherData.main.temp
				? weatherData.main.temp
				: ''
		this.humidity =
			weatherData.main && weatherData.main.humidity
				? weatherData.main.humidity
				: ''
		this.windspeed =
			weatherData.wind && weatherData.wind.speed
				? weatherData.wind.speed
				: ''
		this.icon =
			weatherData.weather &&
			weatherData.weather[0] &&
			weatherData.weather[0].icon
				? weatherData.weather[0].icon
				: ''
		this.iconAttribute =
			weatherData.weather &&
			weatherData.weather[0] &&
			weatherData.weather[0].description
				? weatherData.weather[0].description
				: ''
		this.city = weatherData.name ? weatherData.name : city
		this.setWeatherIcon()
	}

	setWeatherIcon() {
		this.weatherIcon = getWeatherImage(this.icon, this.iconAttribute)
	}

	populateUvIndex(uvIndex) {
		this.uvIndex = uvIndex
		this.setUvIndexColor()
	}

	setUvIndexColor() {
		if (!this.uvIndex) {
			return
		}
		const uvIntVal = parseInt(this.uvIndex)
		if (uvIntVal < 0 || uvIntVal > 20) {
			return
		}
		const foundColor = this.uvColors.find((x) => {
			const range = x.range
			return this.inRange(uvIntVal, range.min, range.max)
		})

		this.uvColor = foundColor ? foundColor.color : ''
	}

	inRange = (x, min, max) => {
		return x >= min && x <= max
	}
}

class ForecastDayWeather {
	constructor(weatherData) {
		if (!weatherData) {
			return
		}
		this.date = weatherData.dt
			? moment.unix(weatherData.dt).format('MM/DD/YYYY')
			: ''
		this.temperature =
			weatherData.temp && weatherData.temp.day
				? weatherData.temp.day
				: ''
		this.humidity = weatherData.humidity ? weatherData.humidity : ''
		this.icon =
			weatherData.weather &&
			weatherData.weather[0] &&
			weatherData.weather[0].icon
				? weatherData.weather[0].icon
				: ''
		this.iconAttribute =
			weatherData.weather &&
			weatherData.weather[0] &&
			weatherData.weather[0].description
				? weatherData.weather[0].description
				: ''
		this.setWeatherIcon()
	}

	setWeatherIcon() {
		if (!this.icon) {
			return
		}
		this.weatherIcon = getWeatherImage(this.icon, this.iconAttribute)
	}
}
