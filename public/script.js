const API_URL = "https://gcore.c48.uk/api"; // testing, will cache for 1 min, 
// make a api.grid.me.uk in future, keep cached with gcore
// backend is sathonyia.srv.c48.uk, maybe try to improve perf and move to melina.srv.c48.uk??

const colours = {
    BIOMASS: '#008043',
    CCGT: '#AAA189',
    COAL: '#6C4B41',
    INTELEC: 'rgba(169,122,176,1)',
    INTEW: 'rgba(169,122,176,1)',
    INTFR: 'rgba(169,122,176,1)',
    INTGRNL: 'rgba(169,122,176,1)',
    INTIFA2: 'rgba(169,122,176,1)',
    INTIRL: 'rgba(169,122,176,1)',
    INTNED: 'rgba(169,122,176,1)',
    INTNEM: 'rgba(169,122,176,1)',
    INTNSL: 'rgba(169,122,176,1)',
    INTVKL: 'rgba(169,122,176,1)',
    IMPORTS: 'rgba(169,122,176,1)',
    NPSHYD: '#1878EA',
    NUCLEAR: '#9D71F7',
    OCGT: '#AAA189',
    OIL: '#584745',
    OTHER: '#808080',
    PS: '#2B3CD8',
    WIND: '#69D6F8',
    WIND_EMBEDDED: '#69D6F8',
    SOLAR: '#FFC700'
};

const friendlyNames = {
    BIOMASS: 'Biomass',
    CCGT: 'Gas',
    COAL: 'Coal',
    INTELEC: 'France (Eleclink)',
    INTEW: 'Ireland (East-West)',
    INTFR: 'France (IFA)',
    INTGRNL: 'Ireland (Greenlink)',
    INTIFA2: 'France (IFA2)',
    INTIRL: 'NI (Moyle)',
    INTNED: 'Netherlands (BritNed)',
    INTNEM: 'Belgium (Nemo Link)',
    INTNSL: 'Norway (North Sea Link)',
    INTVKL: 'Denmark (Viking Link)',
    IMPORTS: 'Imports',
    NPSHYD: 'Hydro',
    NUCLEAR: 'Nuclear',
    OCGT: 'Open Cycle Gas',
    OIL: 'Oil',
    OTHER: 'Other',
    PS: 'Pumped Storage',
    WIND: 'Wind',
    WIND_EMBEDDED: 'Wind (Embedded, estimated)',
    SOLAR: 'Solar'
};

const co2Names = {
    CO2: 'CO₂ (actual)',
    CO2_FORECAST: 'CO₂ (forecast)'
};

const co2Colours = {
    CO2: '#008043',
    CO2_FORECAST: '#69D6F8'
};

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
        document.getElementById('loadingIndicator').innerHTML = `Failed to load /${url}`;
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
        "BIOMASS": data["BIOMASS"] || null,
        "CCGT": data["CCGT"] || null,
        "COAL": data["COAL"] || null,
        "INTELEC": data["INTELEC"] || null,
        "INTEW":  data["INTEW"] || null,
        "INTFR": data["INTFR"] || null,
        "INTGRNL": data["INTGRNL"] || null,
        "INTIFA2": data["INTIFA2"] || null,
        "INTIRL": data["INTIRL"] || null,
        "INTNED": data["INTNED"] || null,
        "INTNEM": data["INTNEM"] || null,
        "INTNSL": data["INTNSL"] || null,
        "INTVKL": data["INTVKL"] || null,
        "NPSHYD": data["NPSHYD"] || null,
        "NUCLEAR": data["NUCLEAR"] || null,
        "OCGT": data["OCGT"] || null,
        "OIL": data["OIL"] || null,
        "OTHER": data["OTHER"] || null,
        "PS": data["PS"] || null,
        "WIND": data["WIND"] || null,
        "SOLAR": data["SOLAR"] || null,
        "CO2": data["CO2"] || null,
        "CO2_INDEX": data["CO2_INDEX"] || null,
        "CO2_FORECAST": data["CO2_FORECAST"] || null, // figure out something to put here, probably make api endpoint for forecase
        "WIND_EMBEDDED": data["WIND_EMBEDDED"] || null,
        "SOLAR_EMBEDDED": data["SOLAR_EMBEDDED"] || null
    }

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
    delete data.SOLAR_EMBEDDED;

    /* idk whether wind embedded should be combined with the main wind or not, 
    i'll do it here but i'll leave the maps in the JS just in case */
    data.WIND = data.WIND + data.WIND_EMBEDDED;
    delete data.WIND_EMBEDDED;

    for (const key in data) {
        if (!["CO2", "CO2_INDEX", "CO2_FORECAST"].includes(key)) {
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
 *  Remove all the INT* keys and add IMPORTS (an aggregate of them all)
 *  @param {object} positives 
 *  @param {object} categories 
 *  @returns {object} data for the doughnut chart
 */
function calcDoughnutData(positives, categories) {
    delete positives.INTFR;
    delete positives.INTGRNL;
    delete positives.INTIFA2;
    delete positives.INTIRL;
    delete positives.INTNED;
    delete positives.INTNEM;
    delete positives.INTNSL;
    delete positives.INTVKL;
    positives.IMPORTS = categories.imports;

    return positives;
}

/**
 *  Calculate generation categories
 *  @param {object} data
 *  @returns {object} {renewables, lowCarbon, fossilFuels, imports}
 */
function calculateCategories(data) {
    const renewables = data.WIND + data.SOLAR + data.WIND_EMBEDDED || data.WIND + data.SOLAR;
    const lowCarbon = data.BIOMASS + data.NUCLEAR;
    const fossilFuels = data.CCGT + data.COAL + data.OIL + data.OCGT;
    const imports =
        (data.INTELEC ?? 0) +
        (data.INTEW ?? 0) +
        (data.INTFR ?? 0) +
        (data.INTGRNL ?? 0) +
        (data.INTIFA2 ?? 0) +
        (data.INTIRL ?? 0) +
        (data.INTNED ?? 0) +
        (data.INTNEM ?? 0) +
        (data.INTNSL ?? 0) +
        (data.INTVKL ?? 0);

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
        if (key.includes("INT")) {
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
        source !== 'SOLAR_EMBEDDED' && source !== 'CO2' && source !== 'CO2_INDEX' && source !== 'CO2_FORECAST'
    );

        if (energySources.includes('WIND') && energySources.includes('WIND_EMBEDDED')) {
            // Remove WIND_EMBEDDED from the sources array, as it will be combined with WIND
            energySources = energySources.filter(source => source !== 'WIND_EMBEDDED');
        }

    const desiredOrder = [
        'NUCLEAR',
        'BIOMASS',
        'NPSHYD',
        'WIND',
        'SOLAR',
        'CCGT',
        'OCGT',
	'COAL',
        'INTFR',
        'INTIFA2',
        'INTELEC',
        'INTGRNL',
        'INTIRL',
        'INTEW',
        'INTNED',
        'INTNEM',
        'INTNSL',
        'INTVKL',
        'PS',
    ];

    // Sort energy sources based on the predefined order
    energySources = energySources.sort((a, b) => {
        return desiredOrder.indexOf(a) - desiredOrder.indexOf(b);
    });

    const datasets = energySources.map(source => {
        // Combine WIND and WIND_EMBEDDED if both are present
        if (includeEmbedded) {
            var data = rawData.map(entry => {
                if (source === 'WIND') {
                    // Combine WIND and WIND_EMBEDDED data
                    return (entry.data['WIND'] || 0) + (entry.data['WIND_EMBEDDED'] || 0);
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
            backgroundColor: colours[source] || 'rgba(128, 128, 128, 0.5)', // Default colour if not defined
            borderColor: colours[source] || 'rgba(128, 128, 128, 1)',
            fill: true,
            pointRadius: 0,
        };
    });

    return { timestamps, datasets };
}

/**
 *  Process the historical CO2 data and return the timestamps and datasets ready for use in chart.js
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
        source == 'CO2' || source == 'CO2_FORECAST'
    );

    const co2Datasets = energySources.map(source => {
        let data = rawData.map(entry => {
            return entry.data[source] || 0;
        });

        return {
            label: co2Names[source] || source,
            data: data,
            backgroundColor: co2Colours[source] || 'rgba(128, 128, 128, 0.5)', // Default color if not defined
            borderColor: co2Colours[source] || 'rgba(128, 128, 128, 1)',
            fill: false,
            pointRadius: 0,
        };
    });

    return { co2Timestamps, co2Datasets };
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

    // Render the chart
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
    // Render the chart
    return new Chart(ctx, config);
}

/**
 *  Update the CO2 intensity information in the dashboard
 *  @param {object} data 
 */
function updateCO2Info(data) {
    const co2Index = document.getElementById('co2-index');
    co2Index.classList.add('aqua-text'); // Apply aqua text style
    if (data.CO2 == null || data.CO2 == "null" || data.CO2 == "" || data.CO2 == undefined) {
        co2Index.textContent = `CO2 Intensity: ${data.CO2_FORECAST} gCO2/kWh (forecasted)`;
    } else {
        co2Index.textContent = `CO2 Intensity: ${data.CO2} gCO2/kWh (${data.CO2_INDEX.toUpperCase()})`;
    }
}

/**
 *  Display the demand information in the dashboard
 *  @param {object} data 
 *  @param {object} positives 
 *  @param {object} negatives 
 */
function displayDemand(data, positives, negatives) {
    let demand = 0;
    let positiveTotal = 0;
    let negativeTotal = 0;

    for (const key in data) {
        if (colours[key] && !["CO2", "CO2_INDEX", "CO2_FORECAST"].includes(key)) {
            demand += data[key];
        }
    }

    for (const key in positives) {
        positiveTotal += positives[key];
    }

    for (const key in negatives) {
        negativeTotal += negatives[key];
    }

    negativeTotal = negativeTotal.toString().replace("-", "")

    document.getElementById('power-equation').innerHTML = `${demand}MW (total) = ${positiveTotal}MW (generation) - ${negativeTotal}MW (demands)`;
}

/**
 *  Initialise the dashboard
 */
async function initialiseDashboard() {
    const startTimestamp = new Date();
    const data = cleanData(await fetchData('current')); // only current data needs to be cleaned as this only exists to account for when upstream APIs are behind
    const past48HrsData = await fetchData('past-48-hrs');
    const pastWeekData = await fetchData('past-week');
    const pastYearData = await fetchData('past-year/week-avg');
    if (data) {
        // Process all the data
        const { positives, negatives } = separateNegativeValues(data);
        const categories = calculateCategories(positives);
        const doughnutData = calcDoughnutData(positives, categories);
        const imports = separateImports(positives);
        const { timestamps: timestamps, datasets: datasets } = processHistoricalData(past48HrsData);
        const { co2Timestamps: co2Timestamps, co2Datasets: co2Datasets } = processHistoricalCO2(past48HrsData);
        const { timestamps: weekTimestamps, datasets: weekDatasets } = processHistoricalData(pastWeekData);
        const { co2Timestamps: weekCO2Timestamps, co2Datasets: weekCO2Datasets } = processHistoricalCO2(pastWeekData);
        const { timestamps: yearTimestamps, datasets: yearDatasets } = processHistoricalData(pastYearData, true);
        const { co2Timestamps: yearCO2Timestamps, co2Datasets: yearCO2Datasets } = processHistoricalCO2(pastYearData, true);

        console.warn("I'm an idiot");

        // Render current data charts
        renderDoughnutChart(doughnutData, 'generationDoughnutChart', 'Generation Sources');
        renderDoughnutChart(imports, 'importsDoughnutChart', 'Imports');
        renderBarChart(categories);
        updateCO2Info(data);
        displayDemand(data, positives, negatives);

        renderStackedAreaChart(timestamps, datasets, 'past48Hours');
        renderLineChart(co2Timestamps, co2Datasets, 'past48HoursCO2');

        renderStackedAreaChart(weekTimestamps, weekDatasets, 'pastWeek');
        renderLineChart(weekCO2Timestamps, weekCO2Datasets, 'pastWeekCO2');

        renderStackedAreaChart(yearTimestamps, yearDatasets, 'pastYear');
        renderLineChart(yearCO2Timestamps, yearCO2Datasets, 'pastYearCO2');

        console.log(`%cComplete in ${new Date() - startTimestamp}ms`, 'font-weight: bold; font-size: 30px; color: aqua; text-shadow: 2px 2px 0 rgb(217,31,38)');

        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('defaultButton').click();
    } else {
        document.getElementById('dashboard').innerHTML = '<h1>Failed to load data.</h1>';
    }
}

/**
 * Initialise historical data (/historical/)
 */
async function initialiseHistorical() {
    const startTimestamp = new Date();
    const data = await fetchData('all/month-avg');
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
