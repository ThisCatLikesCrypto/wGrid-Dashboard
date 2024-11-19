const apiUrl = 'http://localhost:3000/current'; // Run wGrid-Backend locally, I'll move this to repo.c48.uk once the backend is nearly done
const past48HrsApiUrl = 'http://localhost:3000/past-48-hrs';

document.addEventListener('DOMContentLoaded', () => {

    function updateLoadingStatus(status) {
        var loadingStatusElements = document.getElementsByClassName('loading-status');
        for (var i = 0; i < loadingStatusElements.length; i++) {
            loadingStatusElements[i].textContent = status;
        }
    }

    async function fetchPast48HoursData() {
        try {
            updateLoadingStatus('Fetching past 48 hours data...');
            const response = await fetch(past48HrsApiUrl);
            if (!response.ok) throw new Error('Failed to fetch past 48 hours data');
            const data = await response.json();
            renderPast48HoursChart(data);
            renderCO2Chart(data); // CO₂ chart
            updateLoadingStatus('Past data loaded successfully');
        } catch (error) {
            console.error('Error fetching past 48 hours data:', error);
            updateLoadingStatus('Error loading past data');
        }
    }

    function renderPast48HoursChart(data) {
        const categories = data.map((entry) => new Date(entry.timestamp).toLocaleString());

        // Define keys to amalgamate into "Imports"
        const importKeys = [
            'INTELEC', 'INTEW', 'INTFR', 'INTGRNL', 'INTIFA2',
            'INTIRL', 'INTNED', 'INTNEM', 'INTNSL', 'INTVKL'
        ];
    
        // Exclude CO2-related keys
        const excludedKeys = ['CO2', 'CO2_FORECAST', 'CO2_INDEX'];
    
        // Process data to create a combined "Imports" category
        const seriesData = [];
        const importData = data.map((entry) =>
            importKeys.reduce((sum, key) => sum + (entry.data[key] || 0), 0)
        );
    
        // Add "Imports" as a single category
        seriesData.push({
            name: 'Imports',
            data: importData,
            color: '#A97AB0' // Purple for imports
        });
    
        // Add the remaining categories, excluding the imports and CO2-related keys
        Object.keys(data[0].data)
            .filter((key) => !importKeys.includes(key) && !excludedKeys.includes(key))
            .forEach((key) => {
                seriesData.push({
                    name: key,
                    data: data.map((entry) => entry.data[key]),
                });
            });
    
        // Render the chart
        Highcharts.chart('past-day-chart-container', {
            chart: {
                type: 'line',
            },
            title: {
                text: 'Power Generation (Past 48 Hours)',
            },
            xAxis: {
                categories,
                title: {
                    text: 'Timestamp',
                },
            },
            yAxis: {
                title: {
                    text: 'Power (MW)',
                },
            },
            tooltip: {
                shared: true,
                valueSuffix: ' MW',
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true,
                    },
                },
            },
            series: seriesData,
            credits: {
                enabled: false,
            },
        });
    }

    function renderCO2Chart(data) {
        const categories = data.map((entry) => new Date(entry.timestamp).toLocaleString());
    
        // Extract CO₂-related data
        const co2Data = data.map((entry) => entry.data.CO2);
        const co2ForecastData = data.map((entry) => entry.data.CO2_FORECAST);
        const co2IndexData = data.map((entry) => entry.data.CO2_INDEX);
    
        // Render the CO₂ chart
        Highcharts.chart('co2-chart-container', {
            chart: {
                type: 'line',
            },
            title: {
                text: 'CO₂ Intensity and Forecast (Past 48 Hours)',
            },
            xAxis: {
                categories,
                title: {
                    text: 'Timestamp',
                },
            },
            yAxis: {
                title: {
                    text: 'CO₂ Intensity (gCO₂/kWh)',
                },
                labels: {
                    format: '{value} gCO₂/kWh',
                },
            },
            tooltip: {
                shared: true,
                pointFormat: '<b>{point.y} gCO₂/kWh</b>',
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true,
                    },
                },
            },
            series: [
                {
                    name: 'CO₂ Intensity',
                    data: co2Data,
                    color: 'green',
                },
                {
                    name: 'CO₂ Forecast',
                    data: co2ForecastData,
                    color: 'blue',
                },
            ],
            credits: {
                enabled: false,
            },
        });
    
        // Optional: Render CO₂ index as a categorical data series (if meaningful)
        console.log('CO₂ Index Data:', co2IndexData);
    }

    function calculateDemand(data) {
        const demand = data.WIND + data.SOLAR + data.NPSHYD + data.NUCLEAR + data.PS + data.BIOMASS + data.CCGT + data.COAL + data.OIL + data.INTELEC + data.INTFR + data.INTNED + data.INTNSL + data.INTNEM + data.INTGRNL + data.INTIRL + data.INTIFA2 + data.INTVKL;
        return demand;
    }

    async function fetchGridData() {
        try {
            updateLoadingStatus('Fetching...');
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            updateLoadingStatus('200 OK');
            updateCurrent(data);
        } catch (error) {
            console.error('Error fetching grid data:', error);
        }
    }

    Highcharts.setOptions({
        chart: {
            backgroundColor: '#1e1e1e',
            style: {
                fontFamily: 'Calibri, Carlito, sans-serif',
                fontSize: '18px'
            }
        },
        title: {
            style: {
                color: '#ffffff'
            }
        },
        subtitle: {
            style: {
                color: '#cccccc'
            }
        },
        xAxis: {
            gridLineColor: '#444444',
            labels: {
                style: {
                    color: '#ffffff'
                }
            },
            lineColor: '#444444',
            minorGridLineColor: '#222222',
            tickColor: '#444444',
            title: {
                style: {
                    color: '#ffffff'
                }
            }
        },
        yAxis: {
            gridLineColor: '#444444',
            labels: {
                style: {
                    color: '#ffffff'
                }
            },
            lineColor: '#444444',
            minorGridLineColor: '#222222',
            tickColor: '#444444',
            tickWidth: 1,
            title: {
                style: {
                    color: '#ffffff'
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(33, 33, 33, 0.85)',
            style: {
                color: '#ffffff'
            }
        },
        plotOptions: {
            series: {
                dataLabels: {
                    color: '#ffffff'
                },
                marker: {
                    lineColor: '#333333'
                }
            },
            pie: {
                dataLabels: {
                    style: {
                        color: '#ffffff'
                    }
                }
            }
        },
        legend: {
            backgroundColor: 'rgba(30, 30, 30, 0.85)',
            itemStyle: {
                color: '#ffffff'
            },
            itemHoverStyle: {
                color: '#dddddd'
            },
            itemHiddenStyle: {
                color: '#444444'
            }
        },
        credits: {
            style: {
                color: '#666666'
            }
        },
        labels: {
            style: {
                color: '#ffffff'
            }
        }
    });

    function updateCurrent(data) {
        const colours = {
            BIOMASS: '#008043', // Green for biomass
            CCGT: '#AAA189', // Some colour I can't describe
            INTELEC: 'rgba(169,122,176,1)', // Purple-ish? Stolen from EnergyDashboard anyway
            INTEW: 'rgba(169,122,176,1)',
            INTFR: 'rgba(169,122,176,1)',
            INTGRNL: 'rgba(169,122,176,1)',
            INTIFA2: 'rgba(169,122,176,1)',
            INTIRL: 'rgba(169,122,176,1)',
            INTNED: 'rgba(169,122,176,1)',
            INTNEM: 'rgba(169,122,176,1)',
            INTNSL: 'rgba(169,122,176,1)',
            INTVKL: 'rgba(169,122,176,1)',
            NPSHYD: '#1878EA', // Blue for hydro
            NUCLEAR: '#9D71F7', // Pinkish-purple
            OCGT: '#AAA189', // Some colour I can't describe
            OIL: '#584745', // Brown for oil
            OTHER: '#808080', // Grey for other
            PS: '#2B3CD8', // Dark blue for pumped storage
            WIND: '#69D6F8', // Light blue
            SOLAR: '#FFC700' // Yellow
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
            SOLAR: 'Solar'
        };

        const categories = Object.keys(data).filter(
            (key) => key !== 'CO2' && key !== 'CO2_FORECAST' && key !== 'CO2_INDEX'
        );

        const chartData = categories.map((key) => ({
            name: friendlyNames[key] || key, // Use friendly name if available
            y: data[key],
            color: colours[key] || '#808080' // Default to grey if color is not mapped
        }));

        // Aggregate data for bar chart
        const aggregatedData = {
            Renewable: data.WIND + data.SOLAR + data.NPSHYD,
            'Low-Carbon': data.NUCLEAR + data.PS + data.BIOMASS,
            'Fossil Fuels': data.CCGT + data.COAL + data.OIL,
            Imports:
                data.INTELEC +
                data.INTFR +
                data.INTNED +
                data.INTNSL +
                data.INTNEM +
                data.INTGRNL +
                data.INTIRL +
                data.INTIFA2 +
                data.INTVKL
        };

        const barChartData = Object.keys(aggregatedData).map((key) => ({
            name: key,
            y: aggregatedData[key],
            color:
                key === 'Renewable'
                    ? '#69D6F8' // Light blue for renewable
                    : key === 'Low-Carbon'
                    ? '#9D71F7' // Purple for low-carbon
                    : key === 'Fossil Fuels'
                    ? '#AAA189' // Grey-brown for fossil fuels
                    : '#A97AB0' // Purple for imports
        }));


        var co2IndexElement = document.getElementById('co2-index');
        var co2IntensityElement = document.getElementById('co2-intensity');

        // Update CO2 intensity and index
        co2IntensityElement.textContent = `${data.CO2} gCO₂/kWh`;
        co2IndexElement.textContent = data.CO2_INDEX;
        if (data.CO2_INDEX == "very low") {
           co2IndexElement.style.color = "darkgreen";
           co2IntensityElement.style.color = "darkgreen";
        } else if (data.CO2_INDEX == "low") {
           co2IndexElement.style.color = "green";
           co2IntensityElement.style.color = "green";
        } else if (data.CO2_INDEX == "moderate") {
           co2IndexElement.style.color = "yellow";
           co2IntensityElement.style.color = "yellow";
        } else if (data.CO2_INDEX == "high") {
           co2IndexElement.style.color = "orange";
           co2IntensityElement.style.color = "orange";
        } else if (data.CO2_INDEX == "very high") {
           co2IndexElement.style.color = "red";
           co2IntensityElement.style.color = "red";
        }

        document.getElementById('demand').textContent = calculateDemand(data);

        document.getElementById('loading').style.display = 'none';

        document.getElementById('overview').style.display = 'flex';

        // Render Highcharts pie chart
        Highcharts.chart('chart-container', {
            chart: {
                type: 'pie'
            },
            title: {
                text: null // Removes the title
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y} MW</b> ({point.percentage:.1f}%)'
            },
            accessibility: {
                point: {
                    valueSuffix: ' MW'
                }
            },
            plotOptions: {
                pie: {
                    size: '90%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            credits: {
                enabled: false // Disable the Highcharts watermark
            },
            series: [
                {
                    name: 'Power Sources',
                    colorByPoint: false, // Use specified colors
                    data: chartData
                }
            ]
        });
        
        // Render Highcharts bar chart
        Highcharts.chart('bar-chart-container', {
            chart: {
                type: 'column'
            },
            title: {
                text: null
            },
            xAxis: {
                categories: Object.keys(aggregatedData),
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Power (MW)',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' MW'
            },
            plotOptions: {
                column: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            credits: {
                enabled: false // Disable the Highcharts watermark
            },
            series: [
                {
                    name: 'Power (MW)',
                    data: barChartData
                }
            ]
        });
        
    }

    // Initial fetch
    fetchGridData();
    fetchPast48HoursData();

    // Refresh data every 30 minutes
    setInterval(fetchGridData, 30 * 60 * 1000);
});