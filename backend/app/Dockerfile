FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy everything
COPY . .

# Build the app
RUN ./mvnw clean package -DskipTests

# Run the app
CMD ["java", "-jar", "target/app-0.0.1-SNAPSHOT.jar"]