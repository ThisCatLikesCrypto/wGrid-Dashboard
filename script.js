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
    NPSHYD: '#1878EA',
    NUCLEAR: '#9D71F7',
    OCGT: '#AAA189',
    OIL: '#584745',
    OTHER: '#808080',
    PS: '#2B3CD8',
    WIND: '#69D6F8',
    WIND_EMBEDDED: '#69D6F8',
    SOLAR: '#FFC700',
    SOLAR_EMBEDDED: '#FFC700',
};

const friendlyNames = {
    BIOMASS: 'Biomass',
    CCGT: 'Gas',
    COAL: 'Coal',
    INTELEC: 'Eleclink (France, 1GW)',
    INTEW: 'East-West (Ireland, 500MW)',
    INTFR: 'IFA (France, 2GW)',
    INTGRNL: 'Greenlink (Ireland, 500MW)',
    INTIFA2: 'IFA2 (France, 1GW)',
    INTIRL: 'Moyle (NI, 500MW)',
    INTNED: 'BritNed (Netherlands, 1GW)',
    INTNEM: 'Nemo Link (Belgium, 1GW)',
    INTNSL: 'North Sea Link (Norway, 1.4GW)',
    INTVKL: 'Viking Link (Denmark, 1.4GW)',
    NPSHYD: 'Hydro',
    NUCLEAR: 'Nuclear',
    OCGT: 'Open Cycle Gas',
    OIL: 'Oil',
    OTHER: 'Other',
    PS: 'Pumped Storage',
    WIND: 'Wind',
    SOLAR: 'Solar',
    WIND_EMBEDDED: 'Wind (Embedded, estimated)',
    SOLAR_EMBEDDED: 'Solar (Embedded, estimated)',
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

function separateNegativeValues(data) {
    const negatives = {};
    const positives = {};

    for (const key in data) {
        if (colours[key] && !["CO2", "CO2_INDEX", "CO2_FORECAST"].includes(key)) {
            if (data[key] < 0) {
                negatives[key] = data[key];
            } else {
                positives[key] = data[key];
            }
        }
    }

    return { positives, negatives };
}

function renderDoughnutChart(data, elementId, label, isNegative = false) {
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
            },
        },
    });
}

function calculateCategories(data) {
    const renewables = data.WIND + data.SOLAR + data.WIND_EMBEDDED + data.SOLAR_EMBEDDED;
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

function updateCO2Info(data) {
    const co2Index = document.getElementById('co2-index');
    co2Index.classList.add('aqua-text'); // Apply aqua text style
    co2Index.textContent = `CO2 Intensity: ${data.CO2} gCO2/kWh (${data.CO2_INDEX.toUpperCase()})`;
}

function displayDemand(data) {
    let demand = 0;

    for (const key in data) {
        if (colours[key] && !["CO2", "CO2_INDEX", "CO2_FORECAST"].includes(key)) {
            demand += data[key];
        }
    }

    document.getElementById('demand').textContent = `Demand: ${demand} MW`;
}

async function initialiseDashboard() {
    const data = await fetchGridData();
    if (data) {
        const { positives, negatives } = separateNegativeValues(data);

        // Render generation doughnut chart (positives)
        renderDoughnutChart(positives, 'generationDoughnutChart', 'Generation Sources');

        console.log(positives);
        console.log(negatives);
        console.log(Object.keys(negatives).length)

        // Render demands doughnut chart (negatives)
        if (Object.keys(negatives).length > 0) {
            renderDoughnutChart(negatives, 'demandsDoughnutChart', 'Demands', true);
        } else {
            document.getElementById('demandsDoughnutChart').outerHTML = 'No Exports'; 
        }

        const categories = calculateCategories(positives);
        console.log(categories);
        renderBarChart(categories);
        updateCO2Info(data);
        displayDemand(data);
    } else {
        const co2Index = document.getElementById('co2-index');
        co2Index.textContent = 'Failed to load data.';
    }
}

// Initialise the dashboard
initialiseDashboard();
