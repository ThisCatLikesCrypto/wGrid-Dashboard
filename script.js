const apiUrl = 'http://localhost:3000/current'; // Run wGrid-Backend locally, I'll move this to repo.c48.uk once the backend is nearly done

document.addEventListener('DOMContentLoaded', () => {

    async function fetchGridData() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            updateDashboard(data);
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

    function updateDashboard(data) {
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

        // Update CO2 intensity and index
        document.getElementById('co2-intensity').textContent = `${data.CO2} gCO₂/kWh`;
        document.getElementById('co2-index').textContent = data.CO2_INDEX;

        // Render Highcharts pie chart
        Highcharts.chart('chart-container', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'UK Grid Power Generation'
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
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
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
    }

    // Initial fetch
    fetchGridData();

    // Refresh data every 30 minutes
    setInterval(fetchGridData, 30 * 60 * 1000);
});