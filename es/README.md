```
// Install
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.5.0

// Run for test
docker-compose up

// Run for prod
docker-compose up -d

// Stop
docker-compose down

// Test that it's up and running
curl -X GET "localhost:9200/_cat/nodes?v&pretty"
```
