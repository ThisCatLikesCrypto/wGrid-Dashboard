const API_URL = "https://repo.c48.uk/api";

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

function openTab(element, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    element.className += " active";
}

async function fetchGridData() {
    try {
        const response = await fetch(`${API_URL}/current`);
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('loadingIndicator').innerHTML = "Failed to load current data";
        return null;
    }
}

async function fetchPast48Hours() {
    try {
        const response = await fetch(`${API_URL}/past-48-hrs`);
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('loadingIndicator').innerHTML = "Failed to load past 48 hrs data";
        return null;
    }
}

async function fetchPastWeek() {
    try {
        const response = await fetch(`${API_URL}/past-week`);
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('loadingIndicator').innerHTML = "Failed to load past week data";
        return null;
    }
}

async function fetchPastYear() {
    try {
        const response = await fetch(`${API_URL}/past-year/day-avg`);
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('loadingIndicator').innerHTML = "Failed to load past year data";
        return null;
    }
}

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

// Function to calculate luminance and return black or white
function getContrastColor(hexColor) {
    const rgb = hexColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance > 0.5 ? '#000' : '#fff'; // Black for light colors, white for dark colors
}

function calcDoughnutData(positives, categories) {
    // remove all the INT stuff and add IMPORTS
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

function separateImports(data) {
    const imports = {};

    for (const key in data) {
        if (key.includes("INT")) {
            imports[key] = data[key];
        }
    }
    return imports;
}

function processHistoricalData(rawData, averagedDays = false) {
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

    // Combine WIND and WIND_EMBEDDED into one dataset
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
        let data = rawData.map(entry => {
            if (source === 'WIND') {
                // Combine WIND and WIND_EMBEDDED data
                return (entry.data['WIND'] || 0) + (entry.data['WIND_EMBEDDED'] || 0);
            }
            return entry.data[source] || 0;
        });

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

function updateCO2Info(data) {
    const co2Index = document.getElementById('co2-index');
    co2Index.classList.add('aqua-text'); // Apply aqua text style
    if (data.CO2 == null || data.CO2 == "null" || data.CO2 == "" || data.CO2 == undefined) {
        co2Index.textContent = `CO2 Intensity: ${data.CO2_FORECAST} gCO2/kWh (forecasted) (${data.CO2_INDEX.toUpperCase()})`;
    } else {
        co2Index.textContent = `CO2 Intensity: ${data.CO2} gCO2/kWh (${data.CO2_INDEX.toUpperCase()})`;
    }
}

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

async function initialiseDashboard() {
    const startTimestamp = new Date();
    const loadingIndicator = document.getElementById('loadingIndicator');
    const data = await fetchGridData();
    const past48HrsData = await fetchPast48Hours();
    const pastWeekData = await fetchPastWeek();
    const pastYearData = await fetchPastYear();
    if (data) {
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

        // Render generation doughnut chart (positives)
        renderDoughnutChart(doughnutData, 'generationDoughnutChart', 'Generation Sources');
        renderDoughnutChart(imports, 'importsDoughnutChart', 'Imports');

        renderBarChart(categories);
        updateCO2Info(data);
        displayDemand(data, positives, negatives);

        renderStackedAreaChart(timestamps, datasets, 'past48Hours');
        renderLineChart(co2Timestamps, co2Datasets, 'past48HoursCO2');

        renderStackedAreaChart(weekTimestamps, weekDatasets, 'pastWeek');
        renderLineChart(weekCO2Timestamps, weekCO2Datasets, 'pastWeekCO2');

        loadingIndicator.innerHTML = 'Rendering past year ...';

        renderStackedAreaChart(yearTimestamps, yearDatasets, 'pastYear');
        renderLineChart(yearCO2Timestamps, yearCO2Datasets, 'pastYearCO2');

        console.log(`%cComplete in ${new Date() - startTimestamp}ms`, 'font-weight: bold; font-size: 30px; color: aqua; text-shadow: 2px 2px 0 rgb(217,31,38)');

        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('defaultButton').click();
    } else {
        document.getElementById('dashboard').innerHTML = '<h1>Failed to load data.</h1>';
    }
}

Chart.register(ChartDataLabels);

initialiseDashboard();