const {success, notFound} = require('../../services/response');
const SessionModel = require('./model').sessionModel;
const SensorModel = require('./model').sensorModel;
const WeatherModel = require('./model').weatherModel;
const moment = require('moment');

const getSensorInformation = (req, res, next) => {
  SensorModel.find({})
      .then(notFound(res))
      .then(success(res))
      .catch(next)
};

const getLastCrossingSession = ({query}, res, next) => {
    const numberOfMeasurements = query.number ? parseInt(query.number) : 1;
    const vmName = query.vm_name ? {vm_name: query.vm_name} : {};

    SessionModel.find(vmName).sort('-start_date').limit(numberOfMeasurements)
        .then(notFound(res))
        .then(success(res))
        .catch(next);
};

const getLastWeatherConditions = ({query}, res, next) => {
    const numberOfMeasurements = query.number ? parseInt(query.number) : 10;
    const vmName = query.vm_name ? {vm_name: query.vm_name} : {};

    WeatherModel.find(vmName).sort('-date').limit(numberOfMeasurements)
        .then(notFound(res))
        .then(success(res))
        .catch(next);
};

const getAverageTemperatureFromDay = ({query}, res, next) => {
    let today = moment().startOf('day').toDate();
    const vmName = query.vm_name ? {vm_name: query.vm_name} : {};

    WeatherModel.aggregate([
        {
            $match: {
                "date": {
                    "$gte": new Date(today.setHours(0, 0, 0)),
                    "$lt": new Date(today.setHours(23, 59, 59))
                },
                vmName
            }
        },
        {
            $group: {
                _id: "weather",
                count: {$sum: 1},
                avg_temperature: {$avg: "$temperature"}
            }
        }
    ])
        .then(notFound(res))
        .then(success(res))
        .catch(next);
};

const getHistogramDataFromCrossingSessions = ({query}, res, next) => {
    const today = moment().startOf('day').toDate();
    const vmName = query.vm_name ? query.vm_name : '';

    const match = {
        "start_date": {
            "$gte": new Date(today.setHours(0, 0, 0)),
            "$lt": new Date(today.setHours(23, 59, 59))
        },
        vm_name: vmName
    };

    SessionModel.aggregate([
        {
            $match: match
        },
        {
            $group: {
                _id: {$hour: "$start_date"},
                red: {$push: "$red"},
                green: {$push: "$green"},
                times: {$push: { $subtract:  ["$end_date", "$start_date"]}},
            }
        },
        {
            $project: {
                times: {$avg: "$times"},
                red: {
                    $reduce: {
                        input: "$red",
                        initialValue: [],
                        in: { $concatArrays : ["$$value", "$$this"] }
                    }
                },
                green: {
                    $reduce: {
                        input: "$green",
                        initialValue: [],
                        in: { $concatArrays : ["$$value", "$$this"] }
                    }
                },
            }
        },
        {
            $project: {
                times: 1,
                red: {$size: "$red"},
                green: {$size: "$green"}
            }
        },
        {
            $sort: {"_id": 1}
        }])
        .then((sensorData) => sensorData.map(data => {
            const label = data._id.toString() + "-" + (data._id + 1).toString();
            data = {label, ...data};
            return data;
        }))
        .then(success(res))
        .catch(next)
};



module.exports = {
    getSensorInformation,
    getLastCrossingSession,
    getLastWeatherConditions,
    getAverageTemperatureFromDay,
    getHistogramDataFromCrossingSessions
};
