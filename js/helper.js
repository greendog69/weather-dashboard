const getWeatherImage = (weatherType, attribute, size) => {
	if (!weatherType) {
		return
	}

	const imageSize = size ? size : 2
	return `<img src="${weatherImageUrl}${weatherType}@${imageSize}x.png" width="50px" height="50px" title="${attribute}" alt="${attribute}">`
}

const getTemplate = (template) => {
	return $(template).html()
}

const templateReplace = (template, data) => {
	const pattern = /{\s*(\w+?)\s*}/g // {property}
	return template.replace(pattern, (_, token) => data[token] || '')
}
