import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

function TxChart({ chartArray }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {

        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null; // Set to null for good measure
        }
        
        // Ensure the chartRef is available
        if (chartRef && chartRef.current) {
            const ctx = chartRef.current.getContext('2d');

            const options = {
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
                            color: "#0f2140"
                        },
                        ticks: {
                            precision: 0,
                            color: "#dee0e0"
                        },
                        beginAtZero: true
                    },
                },                
                plugins: {
                    legend: {
                        display: false
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

            const txData = {
                datasets: [{
                    label: 'Weekly Transactions',
                    backgroundColor: '#316CF4',
                    fill: true,
                    pointBorderColor: '#316CF4',
                    pointBackgroundColor: '#316CF4',
                    pointHoverBackgroundColor: '#316CF4',
                    pointHoverBorderColor: '#316CF4',
                    borderRadius: 5,
                    data: chartArray,
                    tension: 0.4,
                    minBarLength: 1,
                }]
            };

            // If a chart instance already exists, destroy it to free up the canvas
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Create a new Chart instance and store in the ref
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
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
    }, [chartArray]);

    return <canvas ref={chartRef} width="400" height="200"></canvas>;
}

export default TxChart;
