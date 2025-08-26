const API_URL = "https://api.grid.me.uk/api";

const colours = {
    biomass: '#008043',
    ccgt: '#AAA189',
    coal: '#6C4B41',
    intelec: 'rgba(169,122,176,1)',
    intew: 'rgba(169,122,176,1)',
    intfr: 'rgba(169,122,176,1)',
    intgrnl: 'rgba(169,122,176,1)',
    intifa2: 'rgba(169,122,176,1)',
    intirl: 'rgba(169,122,176,1)',
    intned: 'rgba(169,122,176,1)',
    intnem: 'rgba(169,122,176,1)',
    intnsl: 'rgba(169,122,176,1)',
    intvkl: 'rgba(169,122,176,1)',
    imports: 'rgba(169,122,176,1)',
    npshyd: '#1878EA',
    nuclear: '#9D71F7',
    ocgt: '#AAA189',
    oil: '#584745',
    other: '#808080',
    ps: '#2B3CD8',
    wind: '#69D6F8',
    wind_embedded: '#69D6F8',
    solar: '#FFC700'
};

const friendlyNames = {
    biomass: 'Biomass',
    ccgt: 'Gas',
    coal: 'Coal',
    intelec: 'France (Eleclink)',
    intew: 'Ireland (East-West)',
    intfr: 'France (IFA)',
    intgrnl: 'Ireland (Greenlink)',
    intifa2: 'France (IFA2)',
    intirl: 'NI (Moyle)',
    intned: 'Netherlands (BritNed)',
    intnem: 'Belgium (Nemo Link)',
    intnsl: 'Norway (North Sea Link)',
    intvkl: 'Denmark (Viking Link)',
    imports: 'Imports',
    npshyd: 'Hydro',
    nuclear: 'Nuclear',
    ocgt: 'Open Cycle Gas',
    oil: 'Oil',
    other: 'Other',
    ps: 'Pumped Storage',
    wind: 'Wind',
    wind_embedded: 'Wind (Embedded; estimated)',
    solar: 'Solar'
};

const co2Names = {
    co2: 'CO₂ (actual)',
    co2_forecast: 'CO₂ (forecast)'
};

const co2Colours = {
    co2: '#008043',
    co2_forecast: '#69D6F8'
};

const desiredOrder = [
    'nuclear',
    'biomass',
    'npshyd',
    'wind',
    'solar',
    'ccgt',
    'ocgt',
    'coal',
    'intfr',
    'intifa2',
    'intelec',
    'intgrnl',
    'intirl',
    'intew',
    'intned',
    'intnem',
    'intnsl',
    'intvkl',
    'ps',
    'other'
];

/**
 *  Open the tab with the given name and add an "active" class 
 *  to the button that opened the tab, and hide all other tabs (elements with class `tabcontent`).
 *  @param element the button that is clicked (use `this` in the HTML)
 *  @param {string} tabName the tab to be opened's id
*/
function openTab(element, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    element.className += " active";
}

/**
 *  Fetch data from the endpoint and return it as a JSON object.
 *  @param {string} endpoint - The endpoint to fetch data from.
 *  @returns {Promise<object>} - A promise that resolves to the JSON object.
*/
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`);
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('loadingIndicator').innerHTML = `Failed to load /api/${endpoint}`;
        return null;
    }
}

/**
 * Cleans the data object by replacing undefined values with null and 
 * adding missing keys so JS doesn't start NaN-ing everything
 * @param {object} data
 * @returns {object} cleaned data
 */
function cleanData(data) {
    for (const key in data) {
        if (data[key] == undefined) {
            data[key] = null;
        }
    }
    return {
        "biomass": data["biomass"] || null,
        "ccgt": data["ccgt"] || null,
        "coal": data["coal"] || null,
        "intelec": data["intelec"] || null,
        "intew": data["intew"] || null,
        "intfr": data["intfr"] || null,
        "intgrnl": data["intgrnl"] || null,
        "intifa2": data["intifa2"] || null,
        "intirl": data["intirl"] || null,
        "intned": data["intned"] || null,
        "intnem": data["intnem"] || null,
        "intnsl": data["intnsl"] || null,
        "intvkl": data["intvkl"] || null,
        "npshyd": data["npshyd"] || null,
        "nuclear": data["nuclear"] || null,
        "ocgt": data["ocgt"] || null,
        "oil": data["oil"] || null,
        "other": data["other"] || null,
        "ps": data["ps"] || null,
        "wind": data["wind"] || null,
        "solar": data["solar"] || null,
        "co2": data["co2"] || null,
        "co2_index": data["co2_index"] || null,
        "co2_forecast": data["co2_forecast"] || null,
        "wind_embedded": data["wind_embedded"] || null
    }
}

/**
 * cleans the historical data object by running each timestamp through `cleanData()`
 * @param {object} data
 * @returns {object} cleaned data
 */
function cleanHistorical(data) {
    for (const timestamp in data) {
        console.log(data[timestamp]["data"]);
        let ts = data[timestamp];
        ts["data"] = cleanData(data[timestamp]["data"]);
        data[timestamp] = ts;
    }
    return data;
}

/**
 *  Separate the positive and negative values from the data object
 *  @param {object} data 
 *  @returns {object} {positives, negatives}
 */
function separateNegativeValues(data) {
    var negatives = {};
    var positives = {};

    // yeah this seems really inaccurate, i mean im keeping it in the api anyway but still
    delete data.solar_embedded;

    /* idk whether wind embedded should be combined with the main wind or not, 
    i'll do it here but i'll leave the maps in the JS just in case */
    data.wind = data.wind + data.wind_embedded;
    delete data.wind_embedded;

    for (const key in data) {
        if (!["co2", "co2_index", "co2_forecast"].includes(key)) {
            if (data[key] < 0) {
                negatives[key] = data[key];
            } else {
                positives[key] = data[key];
            }
        }
    }

    Object.freeze(negatives);
    Object.freeze(positives);

    return { positives, negatives };
}

/**
 *  Function to calculate luminance and return black or white
 *  @param hexColor 
 *  @returns {string} black or white
 */
function getContrastColor(hexColor) {
    const rgb = hexColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance > 0.5 ? '#000' : '#fff'; // Black for light colors, white for dark colors
}

/**
 *  Remove all the int* keys and add imports (an aggregate of them all)
 *  @param {object} positives 
 *  @param {object} categories 
 *  @returns {object} data for the doughnut chart
 */
function calcDoughnutData(positives, categories) {
    delete positives.intfr;
    delete positives.intgrnl;
    delete positives.intifa2;
    delete positives.intirl;
    delete positives.intned;
    delete positives.intnem;
    delete positives.intnsl;
    delete positives.intvkl;
    positives.imports = categories.imports;

    return positives;
}

/**
 *  Calculate generation categories
 *  @param {object} data
 *  @returns {object} {renewables, lowCarbon, fossilFuels, imports}
 */
function calculateCategories(data) {
    const renewables = data.wind + data.solar + data.wind_embedded || data.wind + data.solar;
    const lowCarbon = data.biomass + data.nuclear;
    const fossilFuels = data.ccgt + data.coal + data.oil + data.ocgt;
    const imports =
        (data.intelec ?? 0) +
        (data.intew ?? 0) +
        (data.intfr ?? 0) +
        (data.intgrnl ?? 0) +
        (data.intifa2 ?? 0) +
        (data.intirl ?? 0) +
        (data.intned ?? 0) +
        (data.intnem ?? 0) +
        (data.intnsl ?? 0) +
        (data.intvkl ?? 0);

    return { renewables, lowCarbon, fossilFuels, imports };
}

/**
 *  Separate the import data from the data object
 *  @param {object} data 
 *  @returns {object} imports
 */
function separateImports(data) {
    const imports = {};

    for (const key in data) {
        if (key.includes("int")) {
            imports[key] = data[key];
        }
    }
    return imports;
}

/**
 *  Process the historical generation data and return the timestamps and datasets ready for use in chart.js
 *  @param {object} rawData 
 *  @param {boolean} averagedDays 
 *  @param {boolean} includeEmbedded
 *  @returns {object} {timestamps, datasets}
 */
function processHistoricalData(rawData, averagedDays = false, includeEmbedded = true) {
    if (averagedDays) {
        var timestamps = rawData.map(entry => new Date(entry.timestamp).toISOString().split('T')[0]);
    } else {
        var timestamps = rawData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        );
    }

    var energySources = Object.keys(rawData[0].data).filter(source =>
        source !== 'solar_embedded' && source !== 'co2' && source !== 'co2_index' && source !== 'co2_forecast'
    );

    if (energySources.includes('wind') && energySources.includes('wind_embedded')) {
        // Remove wind_embedded from the sources array, as it will be combined with wind
        energySources = energySources.filter(source => source !== 'wind_embedded');
    }

    // Sort energy sources based on the predefined order
    energySources = energySources.sort((a, b) => {
        return desiredOrder.indexOf(a) - desiredOrder.indexOf(b);
    });

    const datasets = energySources.map(source => {
        // Combine wind and wind_embedded if both are present
        if (includeEmbedded) {
            var data = rawData.map(entry => {
                if (source === 'wind') {
                    // Combine wind and wind_embedded data
                    return (entry.data['wind'] || 0) + (entry.data['wind_embedded'] || 0);
                }
                return entry.data[source] || 0;
            });
        } else {
            var data = rawData.map(entry => {
                return entry.data[source] || 0;
            });
        }

        return {
            label: friendlyNames[source] || source,
            data: data,
            backgroundColor: colours[source] || 'rgba(128, 128, 128, 0.5)',
            borderColor: colours[source] || 'rgba(128, 128, 128, 1)',
            fill: true,
            pointRadius: 0,
        };
    });

    return { timestamps, datasets };
}

/**
 *  Process the historical co2 data and return the timestamps and datasets ready for use in chart.js
 *  @param {object} rawData 
 *  @param {boolean} averagedDays 
 *  @returns {object} {co2Timestamps, co2Datasets}
 */
function processHistoricalCO2(rawData, averagedDays = false) {
    if (averagedDays) {
        var co2Timestamps = rawData.map(entry => new Date(entry.timestamp).toISOString().split('T')[0]);
    } else {
        var co2Timestamps = rawData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        );
    }

    var energySources = Object.keys(rawData[0].data).filter(source =>
        source == 'co2' || source == 'co2_forecast'
    );

    const co2Datasets = energySources.map(source => {
        let data = rawData.map(entry => {
            return entry.data[source] || 0;
        });

        return {
            label: co2Names[source] || source,
            data: data,
            backgroundColor: co2Colours[source] || 'rgba(128, 128, 128, 0.5)',
            borderColor: co2Colours[source] || 'rgba(128, 128, 128, 1)',
            fill: false,
            pointRadius: 0,
        };
    });

    return { co2Timestamps, co2Datasets };
}

/**
 *  Takes the CO2 data and averages it out for the whole year
 *  @param {object} {co2Timestamps, co2Datasets}
 *  @returns {number} averagedCO2
 */
function averageCO2(co2Timestamps, co2Datasets) {
    let averagedCO2 = 0;
    for (let i = 0; i < co2Timestamps.length; i++) {
        averagedCO2 += co2Datasets[0].data[i];
    }
    averagedCO2 /= co2Timestamps.length;
    return averagedCO2;
}

/**
 *  Render a doughnut chart using chart.js
 *  @param {object} data 
 *  @param {string} elementId 
 *  @param {string} label 
 */
function renderDoughnutChart(data, elementId, label) {
    const labels = Object.keys(data).map(key => friendlyNames[key] || key);
    const values = Object.values(data);
    const backgroundColors = Object.keys(data).map(key => colours[key]);

    const ctx = document.getElementById(elementId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    backgroundColor: backgroundColors,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${Math.abs(context.raw)} MW`,
                    },
                },
                datalabels: {
                    formatter: (value, context) => {
                        const dataArr = context.chart.data.datasets[0].data;
                        const sum = dataArr.reduce((acc, curr) => acc + curr, 0);
                        const percentage = (value / sum) * 100;

                        // Only display percentages >= 5%
                        if (percentage >= 5) {
                            return `${percentage.toFixed(2)}%`;
                        }
                        return '';
                    },
                    color: (context) => {
                        const bgColor = context.dataset.backgroundColor[context.dataIndex];
                        return getContrastColor(bgColor); // Determine text color
                    },
                    font: {
                        weight: 'bold',
                    },
                },
            },
        },
    });
}

/**
 *  Render a bar chart using chart.js
 *  @param {object} categories  
 */
function renderBarChart(categories) {
    const ctx = document.getElementById('categoryBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Renewables', 'Low-Carbon', 'Fossil Fuels', 'Imports'],
            datasets: [
                {
                    label: 'Category Breakdown (MW)',
                    data: [
                        categories.renewables,
                        categories.lowCarbon,
                        categories.fossilFuels,
                        categories.imports,
                    ],
                    backgroundColor: ['#36A2EB', '#4BC0C0', '#FF6384', '#9966FF'],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw} MW`,
                    },
                },
                datalabels: {
                    formatter: (value, context) => {
                        const dataArr = context.chart.data.datasets[0].data;
                        const sum = dataArr.reduce((acc, curr) => acc + curr, 0);
                        const percentage = ((value / sum) * 100).toFixed(2) + "%";
                        return percentage;
                    },
                    color: (context) => {
                        const bgColor = context.dataset.backgroundColor[context.dataIndex];
                        return getContrastColor(bgColor); // Determine text color
                    },
                    font: {
                        weight: 'bold',
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Power (MW)',
                        color: '#00ffff', // Aqua text for axis title
                    },
                },
                x: {
                    ticks: {
                        color: '#00ffff', // Aqua text for x-axis
                    },
                },
            },
        },
    });
}

/**
 *  Render a stacked area chart using chart.js
 *  @param {array} timestamps 
 *  @param {array} datasets 
 *  @param {string} chartId 
 */
function renderStackedAreaChart(timestamps, datasets, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    const config = {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: datasets,
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                datalabels: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                    },
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'MW',
                    },
                },
            },
        },
    };
    return new Chart(ctx, config);
}

/**
 *  Render a line chart using chart.js
 *  @param {array} timestamps 
 *  @param {array} datasets 
 *  @param {string} chartId 
 */
function renderLineChart(timestamps, datasets, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    const config = {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: datasets,
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                datalabels: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                    },
                },
                y: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'MW',
                    },
                },
            },
        },
    };
    return new Chart(ctx, config);
}

/**
 *  Update the co2 intensity information in the dashboard
 *  @param {object} data 
 */
function updateCO2Info(data) {
    const co2Index = document.getElementById('co2-index');
    if (data.co2 == null || data.co2 == "null" || data.co2 == "" || data.co2 == undefined) {
        co2Index.textContent = `CO₂ Intensity: ${data.co2_forecast} gCO2/kWh (forecasted)`;
    } else {
        co2Index.textContent = `CO₂ Intensity: ${data.co2} gCO2/kWh (${data.co2_index.toUpperCase()})`;
    }
}

/**
 *  Display the progress information (towards the 2030 target 
 *  of 50gCO2/kWh in the dashboard
 *  @param {number} averagedCO2
 */
function displayProgress(averagedCO2) {
    const progress = document.getElementById('progress');
    progress.textContent = `CO₂ is ${Math.round(averagedCO2)/50}x of 2030 goal`; 
}

/**
 *  Display the demand information in the dashboard
 *  @param {object} data 
 *  @param {object} positives 
 *  @param {object} negatives 
 */
function displayDemand(data, positives, negatives) {
    const demand = Object.keys(data)
        .filter(key => colours[key] && !["co2", "co2_index", "co2_forecast"].includes(key))
        .reduce((sum, key) => sum + data[key], 0);

    for (const key in data) {
    const positiveTotal = Object.values(positives).reduce((sum, val) => sum + val, 0);
    const negativeTotal = Math.abs(Object.values(negatives).reduce((sum, val) => sum + val, 0));

    document.getElementById('power-equation').innerHTML = `${demand}MW (total) = ${positiveTotal}MW (generation) - ${negativeTotal}MW (demands)`;
}

/**
 *  Initialise the dashboard
 */
async function initialiseDashboard() {
    const startTimestamp = new Date();

    try {
        // Fetch all data in parallel
        const [
            currentDataRaw,
            past48HrsData,
            pastWeekData,
            pastYearData
        ] = await Promise.all([
            fetchData('current'),
            fetchData('past-48-hrs'),
            fetchData('past-week'),
            fetchData('past-year/week-avg')
        ]);

        const data = cleanData(currentDataRaw);

        if (!data) {
            document.getElementById('dashboard').innerHTML = '<h1>Failed to load data.</h1>';
            return;
        }

        // Process all the data
        const { positives, negatives } = separateNegativeValues(data);
        const categories = calculateCategories(positives);
        const doughnutData = calcDoughnutData(positives, categories);
        const imports = separateImports(positives);

        const [
            { timestamps, datasets },
            { co2Timestamps, co2Datasets },
            { timestamps: weekTimestamps, datasets: weekDatasets },
            { co2Timestamps: weekCO2Timestamps, co2Datasets: weekCO2Datasets },
            { timestamps: yearTimestamps, datasets: yearDatasets },
            { co2Timestamps: yearCO2Timestamps, co2Datasets: yearCO2Datasets }
        ] = await Promise.all([
            processHistoricalData(past48HrsData),
            processHistoricalCO2(past48HrsData),
            processHistoricalData(pastWeekData),
            processHistoricalCO2(pastWeekData),
            processHistoricalData(pastYearData, true),
            processHistoricalCO2(pastYearData, true)
        ]);

        const averagedCO2 = averageCO2(yearCO2Timestamps, yearCO2Datasets);

        console.warn("I'm an idiot");

        // Render current data charts
        renderDoughnutChart(doughnutData, 'generationDoughnutChart', 'Generation Sources');
        renderDoughnutChart(imports, 'importsDoughnutChart', 'Imports');
        renderBarChart(categories);
        updateCO2Info(data);
        displayDemand(data, positives, negatives);
        displayProgress(averagedCO2);

        renderStackedAreaChart(timestamps, datasets, 'past48Hours');
        renderLineChart(co2Timestamps, co2Datasets, 'past48HoursCO2');

        renderStackedAreaChart(weekTimestamps, weekDatasets, 'pastWeek');
        renderLineChart(weekCO2Timestamps, weekCO2Datasets, 'pastWeekCO2');

        renderStackedAreaChart(yearTimestamps, yearDatasets, 'pastYear');
        renderLineChart(yearCO2Timestamps, yearCO2Datasets, 'pastYearCO2');

        console.log(`%cComplete in ${new Date() - startTimestamp}ms`, 'font-weight: bold; font-size: 30px; color: aqua; text-shadow: 2px 2px 0 rgb(217,31,38)');

        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('defaultButton').click();

    } catch (error) {
        console.error('Error initialising dashboard:', error);
        document.getElementById('dashboard').innerHTML = '<h1>Failed to load data.</h1>';
    }
}


/**
 * Initialise historical data (/historical/)
 */
async function initialiseHistorical() {
    const startTimestamp = new Date();
    const data = cleanHistorical(await fetchData('all/month-avg'));
    if (data) {
        const { timestamps, datasets } = processHistoricalData(data, true, false);
        renderStackedAreaChart(timestamps, datasets, 'pastForever');

        console.log(`%cComplete in ${new Date() - startTimestamp}ms`, 'font-weight: bold; font-size: 30px; color: aqua; text-shadow: 2px 2px 0 rgb(217,31,38)');

        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('defaultButton').click();
    } else {
        document.getElementById('dashboard').innerHTML = '<h1>Failed to load data.</h1>';
    }
}

Chart.register(ChartDataLabels);

// initialiseDashboard() or initialiseHistorical() is called from the html