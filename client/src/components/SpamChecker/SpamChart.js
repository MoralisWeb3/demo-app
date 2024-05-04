import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

function NetworthChart({ chartArray }) {
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
                plugins: {
                    legend: {
                        display: false
                    }
                }
            };

            const data = {
                labels: chartArray.labels,
                datasets: [{
                  label: 'Spam',
                  data: chartArray.data,
                  backgroundColor: [
                    '#0BC18D',
                    '#9b2525'
                  ],
                  borderWidth:0,
                  hoverOffset: 4
                }]
              };

            // If a chart instance already exists, destroy it to free up the canvas
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Create a new Chart instance and store in the ref
            chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: data,
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

    return <canvas ref={chartRef} width="200" height="100"></canvas>;
}

export default NetworthChart;
