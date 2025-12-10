@echo off
echo ================================================
echo Building Quarkus Lambda Functions
echo ================================================

REM Clean previous builds
echo 1. Cleaning previous builds...
call mvn clean

REM Build the project
echo 2. Building project with Maven...
call mvn package -DskipTests -Dquarkus.package.jar.type=uber-jar

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo Build Successful!
    echo ================================================

    echo.
    echo Generated files:
    dir target\*.jar

    REM Create function.zip for AWS Lambda
    if exist "target\feedback-system-1.0.0-SNAPSHOT-runner.jar" (
        echo.
        echo 3. Creating function.zip for AWS Lambda...
        cd target
        copy feedback-system-1.0.0-SNAPSHOT-runner.jar function.jar
        powershell Compress-Archive -Path function.jar,lib\* -DestinationPath function.zip -Force
        cd ..
        echo √ function.zip created successfully
        echo.
        echo Deploy files:
        dir target\function.zip
    )

    echo.
    echo ================================================
    echo Build completed successfully!
    echo ================================================
    echo.
    echo Next steps:
    echo 1. Deploy using SAM CLI:
    echo    sam deploy --guided
    echo.
    echo 2. Or deploy manually using AWS CLI:
    echo    aws lambda update-function-code --function-name receber-feedback --zip-file fileb://target/function.zip
    echo.
) else (
    echo.
    echo ================================================
    echo Build Failed!
    echo ================================================
    exit /b 1
)

