import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

function TokenPriceChart({ chartArray, direction }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {

        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null; 
        }
        
        // Ensure the chartRef is available
        if (chartRef && chartRef.current) {
            const ctx = chartRef.current.getContext('2d');

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        grid: {
                            display: true,
                            color: "#172844"
                        },
                        ticks: {
                            precision: 10,
                            source: 'auto',
                            color: "#7886a6"
                        },
                        beginAtZero: false
                    },
                },                
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                          // This callback allows customizing the tooltip label
                          label: function(context) {
                            let label = context.dataset.label || '';
                  
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              label += context.parsed.y;
                            }
                            // Access the 'block' property from the tooltip's data point
                            if (context.raw.block) {
                              label += ' | Block: ' + context.raw.block;
                            }
                            return label;
                          }
                        }
                      }
                },
                hover: {
                    intersect: false
                },
                elements: {
                    point: {
                        radius: 1
                    }
                }
            };


            var gradient = ctx.createLinearGradient(0, 0, 0, 400);
            if(direction === "up") {
                gradient.addColorStop(0, 'rgba(1,195,102,0.6)');   
                gradient.addColorStop(1, 'rgba(1,195,102,0)');
            } else {
                gradient.addColorStop(0, 'rgba(255,81,81,0.6)');   
                gradient.addColorStop(1, 'rgba(255,81,81,0)');
            }
            

            const txData = {
                datasets: [{
                    label: 'USD Price',
                    backgroundColor: gradient,
                    borderColor: direction === "up" ? '#01C366' : "#FF5151",
                    fill: true,
                    pointBorderColor: direction === "up" ? '#01C366' : "#FF5151",
                    pointBackgroundColor: direction === "up" ? '#01C366' : "#FF5151",
                    pointHoverBackgroundColor: direction === "up" ? '#01C366' : "#FF5151",
                    pointHoverBorderColor: direction === "up" ? '#01C366' : "#FF5151",
                    borderWidth: 2,
                    borderRadius: 1,
                    data: chartArray,
                    tension: 0.4,
                    // minBarLength: 1,
                }]
            };

            // If a chart instance already exists, destroy it to free up the canvas
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Create a new Chart instance and store in the ref
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: txData,
                options:options
            });
        }

        // Cleanup: destroy the chart instance on component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [chartArray, direction]);

    return <canvas ref={chartRef} width="400" height="200"></canvas>;
}

export default TokenPriceChart;
