#!/bin/bash

# Prompt user for inputs with emojis
YARN_COMMAND=${YARN_COMMAND:-yarn}
BROWSERSTACK_COMMAND=${BROWSERSTACK_COMMAND:-e2e:browserstack:run:local}

echo "📱 Enter the platform name (e.g., ios/android/both):"
read -r PLATFORM

echo "🗂️ Enter the test file path (e.g., \"**/energy_new_address_error.e2e.ts\", keep empty to run all tests):"
read -r TEST_SUITE_PATH

if [ -z "$TEST_SUITE_PATH" ]; then
    echo "   - Test suite: All files will run 🗂️"
else
    echo "   - Test suite: $TEST_SUITE_PATH"
fi

# Build the command
COMMAND="$YARN_COMMAND $BROWSERSTACK_COMMAND $PLATFORM \"$TEST_SUITE_PATH\""

# Log: Displaying final command
echo "🚧 Building the command..."
sleep 1
echo "🛠️ Final command:"
echo "   $COMMAND"

# Execute the command with logs
echo "🚀 Executing the test command... 🔍"
eval "$COMMAND"

# Log: Completion message
if [ $? -eq 0 ]; then
    echo "🎉 Tests executed successfully! 🎯"
else
    echo "❌ Tests failed. Check the logs above for details. 🛑"
fi 