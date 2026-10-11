FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/OrderManagement.Domain/OrderManagement.Domain.csproj src/OrderManagement.Domain/
COPY src/OrderManagement.Infrastructure/OrderManagement.Infrastructure.csproj src/OrderManagement.Infrastructure/
COPY src/OrderManagement.Worker/OrderManagement.Worker.csproj src/OrderManagement.Worker/
RUN dotnet restore src/OrderManagement.Worker/OrderManagement.Worker.csproj
COPY src/OrderManagement.Domain/ src/OrderManagement.Domain/
COPY src/OrderManagement.Infrastructure/ src/OrderManagement.Infrastructure/
COPY src/OrderManagement.Worker/ src/OrderManagement.Worker/
RUN dotnet publish src/OrderManagement.Worker/OrderManagement.Worker.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
USER app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "OrderManagement.Worker.dll"]
