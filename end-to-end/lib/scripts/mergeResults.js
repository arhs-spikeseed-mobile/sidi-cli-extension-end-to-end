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
            const files = await fs.promises.readdir(RESULTS_PATH);
            const filteredFiles = files.filter(file => minimatch(file, FILTER));

            if (filteredFiles.length === 0) {
                console.log(`ℹ️ No files matching '${FILTER}' found in ${RESULTS_PATH}`);
            } else {
                await Promise.all(filteredFiles.map(file => 
                    fs.promises.copyFile(
                        path.join(RESULTS_PATH, file),
                        path.join(TEMP_PATH, file)
                    )
                ));
                console.log(`ℹ️ Copied ${filteredFiles.length} files matching '${FILTER}' to ${TEMP_PATH}`);
            }
        }

        // Generate reports without screenshots
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
        let options = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--single-process',
            '--no-zygote',
            '--disable-extensions',
            '--enable-chrome-browser-cloud-management'
          ];

        await printPdf(htmlReportFile, pdfFile, options);
        console.log("✅ PDF generated successfully:", pdfFile);

        // Clean up temp stuff
        const mergedReportFile = path.resolve(TEMP_PATH, 'merged-report-no-screenshots.json');
        if (fs.existsSync(mergedReportFile)) {
            try {
                await fs.promises.unlink(mergedReportFile);
                console.log(`🗑️ Deleted file: ${mergedReportFile}`);
            } catch (err) {
                console.error(`🚨 Failed to delete file: ${mergedReportFile}`, err);
            }
        } else {
            console.log(`ℹ️ File does not exist: ${mergedReportFile}`);
        }

        // Function to replace paths in all JSON files in TEMP_PATH
        const replacePathsInJsonFiles = async (dirPath) => {
            const files = await fs.promises.readdir(dirPath);

            await Promise.all(files.map(async (file) => {
                const filePath = path.join(dirPath, file);

                if ((await fs.promises.stat(filePath)).isFile() && file.endsWith('.json')) {
                    let content = await fs.promises.readFile(filePath, 'utf-8');
                    content = content.replace(
                        /build\/reports\/wdio-html-nice-reporter-results\/screenshots\//g,
                        'build/reports/wdio-html-nice-reporter-results/temp/screenshots/'
                    );

                    await fs.promises.writeFile(filePath, content, 'utf-8');
                    console.log(`✅ Updated paths in: ${filePath}`);
                }
            }));
        };

        await replacePathsInJsonFiles(TEMP_PATH);

        // Generate HTML report with screenshots
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
