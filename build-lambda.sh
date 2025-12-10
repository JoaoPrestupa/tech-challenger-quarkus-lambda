#!/bin/bash
fi
    exit 1
    echo "================================================"
    echo "Build Failed!"
    echo "================================================"
    echo ""
else
    echo ""
    echo "   aws lambda update-function-code --function-name receber-feedback --zip-file fileb://target/function.zip"
    echo "2. Or deploy manually using AWS CLI:"
    echo ""
    echo "   sam deploy --guided"
    echo "1. Deploy using SAM CLI:"
    echo "Next steps:"
    echo ""
    echo "================================================"
    echo "Build completed successfully!"
    echo "================================================"
    echo ""

    fi
        ls -lh target/function.zip
        echo "Deploy files:"
        echo ""
        echo "✓ function.zip created successfully"
        cd ..
        zip -r function.zip function.jar lib/
        cp feedback-system-1.0.0-SNAPSHOT-runner.jar function.jar
        cd target
        echo "3. Creating function.zip for AWS Lambda..."
        echo ""
    if [ -f "target/feedback-system-1.0.0-SNAPSHOT-runner.jar" ]; then
    # Create function.zip for AWS Lambda

    ls -lh target/*.jar 2>/dev/null || echo "No JAR files found"
    echo "Generated files:"
    echo ""
    # List generated files

    echo "================================================"
    echo "Build Successful!"
    echo "================================================"
    echo ""
if [ $? -eq 0 ]; then
# Check if build was successful

mvn package -DskipTests -Dquarkus.package.jar.type=uber-jar
echo "2. Building project with Maven..."
# Build the project

mvn clean
echo "1. Cleaning previous builds..."
# Clean previous builds

echo "================================================"
echo "Building Quarkus Lambda Functions"
echo "================================================"


