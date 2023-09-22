#!/bin/bash

##
## Create root user
##
mongo 'mongodb://127.0.0.1:27017/?authSource=admin' << EOF1
use admin
db.createUser(
  {
    user: "${MONGO_INIT_ROOT_USERNAME}",
    pwd: "${MONGO_INIT_ROOT_PASSWORD}",
    roles: [ { role: "root", db: "admin" } ]
  }
)

##
## Initialize database
##
use ${MONGO_INITDB_DATABASE}
# Add more initialization commands here if needed
EOF1



