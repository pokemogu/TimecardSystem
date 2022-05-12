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
docker compose -f ${COMPOSE_YML} up -d

# Wait for MySQL instance
echo "Waiting for the MySQL instance to be activated...";
docker compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 sh -c "while ! mysqladmin ping -h localhost --silent; do sleep 1; done"

# Wait for MySQL socket
echo "Waiting for the MySQL socket file to be activated..."
docker compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 sh -c "while [ ! -S /var/run/mysqld/mysqld.sock ]; do sleep 1; done"

sleep 10

# Create database
if [ -z "${DB_NAME}" ]; then
  echo "Error: DB_NAME not defined!!" 1>&2
  exit 1
fi

docker compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysqladmin -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}" create ${DB_NAME}

# Create user
if [ -z "${DB_USER}" ]; then
  echo "Error: DB_USER not defined!!" 1>&2
  exit 1
fi
if [ -z "${DB_PASSWORD}" ]; then
  echo "Error: DB_PASSWORD not defined!!" 1>&2
  exit 1
fi

echo "CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';" | docker compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysql -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}"

# Grant user
echo "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';" | docker compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysql -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}"

echo "FLUSH PRIVILEGES;" | docker compose -f ${COMPOSE_YML} exec -T mysql_cntdbmy4 mysql -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}"
