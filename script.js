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

async function fetchGridData() {
    try {
        const response = await fetch('https://repo.c48.uk/api/current');
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function fetchPast48Hours() {
    try {
        const response = await fetch('https://repo.c48.uk/api/past-48-hrs');
        if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

function separateNegativeValues(data) {
    console.log(data);
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
            console.log(key);
            console.log(data[key]);
            if (data[key] < 0) {
                negatives[key] = data[key];
                if (!negatives[key]){
                    console.error("what the fuck (neg)");
                }
            } else {
                positives[key] = data[key];
                if (!positives[key]){
                    console.error("what the fuck (pos)");
                }
            }
        }
    }

    console.log(negatives);
    console.log(positives);

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

function process48HourData(rawData) {
    const timestamps = rawData.map(entry =>
        new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );

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
        'HYDRO',
        'WIND',
        'SOLAR',
        'GAS',
        'IMPORTS'
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
            backgroundColor: colours[source] || 'rgba(128, 128, 128, 0.5)', // Default color if not defined
            borderColor: colours[source] || 'rgba(128, 128, 128, 1)',
            fill: true,
            pointRadius: 0,
        };
    });

    return { timestamps, datasets };
}

function process48HourCO2(rawData) {
    const co2Timestamps = rawData.map(entry =>
        new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );

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
    co2Index.textContent = `CO2 Intensity: ${data.CO2} gCO2/kWh (${data.CO2_INDEX.toUpperCase()})`;
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

    document.getElementById('power-equation').innerHTML = `${demand}MW (total) = ${positiveTotal}MW (generation) + ${negativeTotal}MW (demands)`;
}

async function initialiseDashboard() {
    const data = await fetchGridData();
    const past48HrsData = await fetchPast48Hours();
    if (data) {
        const { positives, negatives } = separateNegativeValues(data); // TODO: WHY THE FUCK DOES THIS NOT RETURN SOME INT VALUES

        console.log(positives);
        console.log(negatives);

        const categories = calculateCategories(positives);
        const doughnutData = calcDoughnutData(positives, categories);
        const imports = separateImports(positives);
        const { timestamps, datasets } = process48HourData(past48HrsData);
        const { co2Timestamps, co2Datasets } = process48HourCO2(past48HrsData);

        console.log(co2Timestamps, co2Datasets);

        console.warn("I'm an idiot");

        // Render generation doughnut chart (positives)
        renderDoughnutChart(doughnutData, 'generationDoughnutChart', 'Generation Sources');
        // renderDoughnutChart(imports, 'importsDoughnutChart', 'Imports');
        document.getElementById('importsDoughnutChart').outerHTML = "disabled cuz JS is brokey af and i have no idea why";

        console.log(categories);
        renderBarChart(categories);
        updateCO2Info(data);
        displayDemand(data, positives, negatives);

        renderStackedAreaChart(timestamps, datasets, 'past48Hours');
        renderLineChart(co2Timestamps, co2Datasets, 'past48HoursCO2');

    } else {
        document.getElementById('dashboard').innerHTML = '<h1>Failed to load data.</h1>';
    }
}

Chart.register(ChartDataLabels);

initialiseDashboard();