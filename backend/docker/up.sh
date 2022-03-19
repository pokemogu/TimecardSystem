#!/bin/sh

BASEDIR=$(dirname "$0")

if [ -e ${BASEDIR}/.env ];
then
  . ${BASEDIR}/.env
fi

if [ -e ${BASEDIR}/../.env.${NODE_ENV} ];
then
  . ${BASEDIR}/../.env.${NODE_ENV}
elif [ -e ${BASEDIR}/../.env ];
then
  . ${BASEDIR}/../.env
fi

COMPOSE_YML=${BASEDIR}/docker-compose.yml

# Start docker container
docker-compose -f ${COMPOSE_YML} up -d

# Wait for MySQL instance
echo "Waiting for the MySQL instance to be activated...";
docker-compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 sh -c "while ! mysqladmin ping -h localhost --silent; do sleep 1; done"

# Wait for MySQL socket
echo "Waiting for the MySQL socket file to be activated..."
docker-compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 sh -c "while [ ! -S /var/run/mysqld/mysqld.sock ]; do sleep 1; done"

sleep 10

# Create database
docker-compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysqladmin -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}" create ${DB_NAME}

# Create user
echo "CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';" | docker-compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysql -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}"

# Grant user
echo "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_APP_USER}'@'%';" | docker-compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysql -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}"

echo "FLUSH PRIVILEGES;" | docker-compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysql -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}"
