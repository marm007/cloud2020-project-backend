const {Router} = require('express');
const {
    getSensorInformation,
    getLastCrossingSession,
    getLastWeatherConditions,
    getAverageTemperatureFromDay,
    getHistogramDataFromCrossingSessions
} = require('./controller');

const router = new Router();

router.get('/',
    getSensorInformation)

router.get('/crossing/last',
    getLastCrossingSession);

router.get('/crossing/histogram-data',
    getHistogramDataFromCrossingSessions);

router.get('/weather/last',
    getLastWeatherConditions);

router.get('/weather/average',
    getAverageTemperatureFromDay);

module.exports = router;
