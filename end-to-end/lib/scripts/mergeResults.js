const fs = require("fs-extra");
const path = require("path");
const minimatch = require("minimatch");

(async () => {
    const ReportAggregator = (await import('wdio-html-nice-reporter/lib/ReportAggregator.js')).default;
    
    // Parse command-line arguments
    let args = process.argv.slice(2);
    const RESULTS_PATH = args[0] || './build/reports/wdio-html-nice-reporter-results/';
    const FILTER = args[1] || '';
    const TEMP_PATH = path.join(RESULTS_PATH, 'temp');
    let reportName = args[2] || "master-report";
    
    try {
        // Create temp directory if FILTER is provided
        if (FILTER) {
            fs.ensureDirSync(TEMP_PATH);
            
            // Copy files matching FILTER to TEMP_PATH
            const files = fs.readdirSync(RESULTS_PATH);
            const filteredFiles = files.filter(file => minimatch(file, FILTER));
            
            if (filteredFiles.length === 0) {
                console.log(`ℹ️ No files matching '${FILTER}' found in ${RESULTS_PATH}`);
            } else {
                filteredFiles.forEach(file => {
                    fs.copyFileSync(
                        path.join(RESULTS_PATH, file),
                        path.join(TEMP_PATH, file)
                    );
                });
                console.log(`ℹ️ Copied ${filteredFiles.length} files matching '${FILTER}' to ${TEMP_PATH}`);
            }
        }
        
        // Generate reports without screenshots
        
        // Generate HTML report
        const reportAggregator = new ReportAggregator({
            outputDir: FILTER ? TEMP_PATH : RESULTS_PATH,
            filename: 'merged-report-no-screenshots.html',
            reportTitle: 'E2E Report',
            collapseTests: true,
        });
        
        await reportAggregator.createReport();
        console.log("✅ HTML report generated successfully.");
        
        // Generate PDF report
        const { default: printPdf } = await import('@rpii/wdio-html-reporter-pdf');
        
        const htmlReportFile = path.resolve(TEMP_PATH, 'merged-report-no-screenshots.html');
        const pdfFile = path.resolve(TEMP_PATH, `${reportName}-no-screenshots.pdf`);
        
        let options = ['--no-sandbox', '--disable-gpu', '--disable-extensions', '--enable-chrome-browser-cloud-management'];
        
        await printPdf(htmlReportFile, pdfFile, options);
        console.log("✅ PDF generated successfully:", pdfFile);
        
        // Clean up temp stuff
        const mergedReportFile = path.resolve(TEMP_PATH, 'merged-report-no-screenshots.json');
        if (fs.existsSync(mergedReportFile)) {
            fs.unlink(mergedReportFile, (err) => {
                if (err) {
                    console.error(`🚨 Failed to delete file: ${mergedReportFile}`, err);
                } else {
                    console.log(`🗑️ Deleted file: ${mergedReportFile}`);
                }
            });
        } else {
            console.log(`ℹ️ File does not exist: ${mergedReportFile}`);
        }        

        // Generate reports with screenshots
        
        // Function to replace paths in all JSON files in TEMP_PATH
        const replacePathsInJsonFiles = (dirPath) => {
            const files = fs.readdirSync(dirPath);
            
            files.forEach((file) => {
                const filePath = path.join(dirPath, file);
                
                // Check if it's a JSON file
                if (fs.statSync(filePath).isFile() && file.endsWith('.json')) {
                    let content = fs.readFileSync(filePath, 'utf-8');
                    
                    // Replace all occurrences of the screenshot path
                    content = content.replace(
                        /build\/reports\/wdio-html-nice-reporter-results\/screenshots\//g,
                        'build/reports/wdio-html-nice-reporter-results/temp/screenshots/'
                    );
                    
                    fs.writeFileSync(filePath, content, 'utf-8');
                    console.log(`✅ Updated paths in: ${filePath}`);
                }
            });
        };
        
        // Replace paths in all JSON files within TEMP_PATH
        replacePathsInJsonFiles(TEMP_PATH);
        
        // Generate HTML report
        const reportAggregator2 = new ReportAggregator({
            outputDir: FILTER ? TEMP_PATH : RESULTS_PATH,
            filename: 'merged-report.html',
            reportTitle: 'E2E Report',
            collapseTests: true,
        });
        
        await reportAggregator2.createReport();
        console.log("✅ HTML report generated successfully.");
        
        const htmlReportFile2 = path.resolve(TEMP_PATH, 'merged-report.html');
        const pdfFile2 = path.resolve(TEMP_PATH, `${reportName}.pdf`);
        
        await printPdf(htmlReportFile2, pdfFile2, options);
        console.log("✅ PDF generated successfully:", pdfFile2);
        
    } catch (error) {
        console.error("🚨 Error during report generation or PDF creation:", error);
    }
})();