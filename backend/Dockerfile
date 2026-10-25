
# Build stage
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

RUN apk add --no-cache maven
COPY pom.xml .
COPY src ./src

RUN mvn -B clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S hirematch && adduser -S hirematch -G hirematch
COPY --from=builder /app/target/*.jar app.jar

RUN mkdir -p /app/uploads && chown -R hirematch:hirematch /app
USER hirematch

EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
