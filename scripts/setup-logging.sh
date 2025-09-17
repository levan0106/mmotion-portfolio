#!/bin/bash

# Portfolio Management System - Logging Setup Script
# This script sets up the logging environment for the application

set -e

echo "🚀 Setting up Portfolio Management System Logging Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating logging directories..."
    
    # Create logs directory
    mkdir -p logs
    print_success "Created logs directory"
    
    # Create logstash directories
    mkdir -p logstash/config
    mkdir -p logstash/pipeline
    print_success "Created logstash directories"
    
    # Create prometheus directory
    mkdir -p prometheus
    print_success "Created prometheus directory"
    
    # Create grafana directories
    mkdir -p grafana/provisioning/datasources
    mkdir -p grafana/provisioning/dashboards
    mkdir -p grafana/dashboards
    print_success "Created grafana directories"
    
    # Create backups directory
    mkdir -p backups/logs
    print_success "Created backups directory"
}

# Copy environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy logging environment example
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
        else
            print_warning "env.example not found, creating basic .env file"
            cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=portfolio_db

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
PORT=3000
NODE_ENV=development

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_CONSOLE_ENABLED=true
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/application.log
LOG_DATABASE_ENABLED=true
LOG_RETENTION_DAYS=30
EOF
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Setup Logstash configuration
setup_logstash() {
    print_status "Setting up Logstash configuration..."
    
    # Create logstash.yml if it doesn't exist
    if [ ! -f logstash/config/logstash.yml ]; then
        cat > logstash/config/logstash.yml << EOF
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
EOF
        print_success "Created logstash.yml"
    fi
    
    # Create logstash.conf if it doesn't exist
    if [ ! -f logstash/pipeline/logstash.conf ]; then
        cat > logstash/pipeline/logstash.conf << EOF
input {
  file {
    path => "/usr/share/logstash/logs/*.log"
    start_position => "beginning"
    codec => "json"
    tags => ["application-logs"]
  }
  
  beats {
    port => 5044
    tags => ["beats-logs"]
  }
}

filter {
  if "application-logs" in [tags] {
    if [message] =~ /^\{.*\}$/ {
      json {
        source => "message"
      }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    if [level] {
      mutate {
        add_field => { "log_level" => "%{level}" }
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "portfolio-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
EOF
        print_success "Created logstash.conf"
    fi
}

# Setup Prometheus configuration
setup_prometheus() {
    print_status "Setting up Prometheus configuration..."
    
    if [ ! -f prometheus/prometheus.yml ]; then
        cat > prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'portfolio-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'elasticsearch'
    static_configs:
      - targets: ['elasticsearch:9200']
    metrics_path: '/_prometheus/metrics'
    scrape_interval: 15s

  - job_name: 'logstash'
    static_configs:
      - targets: ['logstash:9600']
    metrics_path: '/_node/stats/prometheus'
    scrape_interval: 15s
EOF
        print_success "Created prometheus.yml"
    fi
}

# Setup Grafana configuration
setup_grafana() {
    print_status "Setting up Grafana configuration..."
    
    # Create Prometheus datasource
    if [ ! -f grafana/provisioning/datasources/prometheus.yml ]; then
        cat > grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
        print_success "Created Prometheus datasource configuration"
    fi
    
    # Create dashboard provisioning
    if [ ! -f grafana/provisioning/dashboards/dashboard.yml ]; then
        cat > grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
        print_success "Created dashboard provisioning configuration"
    fi
}

# Start logging services
start_services() {
    print_status "Starting logging services..."
    
    # Start ELK Stack and monitoring services
    docker-compose up -d elasticsearch logstash kibana prometheus grafana
    
    print_success "Started ELK Stack and monitoring services"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    
    # Check Elasticsearch
    if curl -f http://localhost:9200/_cluster/health &> /dev/null; then
        print_success "Elasticsearch is healthy"
    else
        print_warning "Elasticsearch is not ready yet"
    fi
    
    # Check Kibana
    if curl -f http://localhost:5601/api/status &> /dev/null; then
        print_success "Kibana is healthy"
    else
        print_warning "Kibana is not ready yet"
    fi
    
    # Check Prometheus
    if curl -f http://localhost:9090/-/healthy &> /dev/null; then
        print_success "Prometheus is healthy"
    else
        print_warning "Prometheus is not ready yet"
    fi
    
    # Check Grafana
    if curl -f http://localhost:3002/api/health &> /dev/null; then
        print_success "Grafana is healthy"
    else
        print_warning "Grafana is not ready yet"
    fi
}

# Display service URLs
show_service_urls() {
    print_success "Logging services are now running!"
    echo ""
    echo "📊 Service URLs:"
    echo "  • Application: http://localhost:3000"
    echo "  • API Documentation: http://localhost:3000/api"
    echo "  • Elasticsearch: http://localhost:9200"
    echo "  • Kibana: http://localhost:5601"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Grafana: http://localhost:3002 (admin/admin)"
    echo ""
    echo "📁 Log Files:"
    echo "  • Application Logs: ./logs/application.log"
    echo "  • Logstash Logs: ./logs/logstash.log"
    echo ""
    echo "🔧 Configuration Files:"
    echo "  • Environment: .env"
    echo "  • Docker Compose: docker-compose.yml"
    echo "  • Logstash: logstash/config/logstash.yml"
    echo "  • Prometheus: prometheus/prometheus.yml"
    echo "  • Grafana: grafana/provisioning/"
    echo ""
    echo "📚 Documentation:"
    echo "  • Logging Configuration: document/logging-configuration.md"
    echo "  • API Documentation: http://localhost:3000/api"
    echo ""
    print_success "Setup complete! 🎉"
}

# Main execution
main() {
    echo "=========================================="
    echo "Portfolio Management System - Logging Setup"
    echo "=========================================="
    echo ""
    
    check_docker
    check_docker_compose
    create_directories
    setup_environment
    setup_logstash
    setup_prometheus
    setup_grafana
    start_services
    show_service_urls
}

# Run main function
main "$@"
